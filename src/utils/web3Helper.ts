import { ethers } from "ethers";

const waitWithTimeout = (promise: Promise<any>, ms: number) => {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve({ status: -1, timeout: true }), ms))
    ]);
};

// Web3 Utility Helpers for BSC Mainnet Token Balances and Strict On-Chain Receipt Verification


export const NXBC_TOKEN_CONTRACT = '0x94D064AFDB04E3489C313054260929588b38dF85';
export const NXBC_PRESALE_CONTRACT = '0x0C4a86691B3937549BFa688211EbF56520B64981';
export const NXBC_CONTRACT = NXBC_TOKEN_CONTRACT; // Standard token import points to the actual BEP-20 token
export const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
export const ADMIN_TREASURY_WALLET = '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261';

const BSC_RPCS = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
];

/**
 * Fetch real on-chain BEP-20 token balance directly from BSC nodes
 */
export async function fetchOnChainTokenBalance(
  tokenContract: string,
  walletAddress: string
): Promise<number> {
  if (!walletAddress || !tokenContract) return 0;

  // Clean address format
  const cleanAddr = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  // balanceOf(address) function selector: 0x70a08231
  const callData = `0x70a08231${cleanAddr}`;

  // Try in-wallet provider first if available
  if (typeof window !== 'undefined') {
    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (eth && typeof eth.request === 'function') {
      try {
        const result = await eth.request({
          method: 'eth_call',
          params: [
            {
              to: tokenContract,
              data: callData,
            },
            'latest',
          ],
        });
        if (result && result !== '0x') {
          const wei = BigInt(result);
          return Number(wei) / 1e18;
        }
      } catch (providerErr) {
        // Fall back to public RPCs
      }
    }
  }

  // Fallback to BSC public JSON-RPC nodes
  for (const rpcUrl of BSC_RPCS) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: tokenContract,
              data: callData,
            },
            'latest',
          ],
        }),
      });

      const json = await response.json();
      if (json?.result && json.result !== '0x') {
        const wei = BigInt(json.result);
        return Number(wei) / 1e18;
      }
    } catch (err) {
      // Try next RPC
      continue;
    }
  }

  return 0;
}

/**
 * Strict BSC Transaction Verification: Polls until mined and verifies status is 0x1 (Success)
 */
export async function waitForBscTxConfirmation(
  txHash: string,
  onStatusUpdate?: (msg: string) => void,
  maxWaitSeconds: number = 25
): Promise<{ success: boolean; blockNumber?: string; error?: string }> {
  if (!txHash || !txHash.startsWith('0x')) {
    return { success: false, error: 'Invalid transaction hash received.' };
  }

  const startTime = Date.now();
  const maxMs = maxWaitSeconds * 1000;
  let attempts = 0;

  while (Date.now() - startTime < maxMs) {
    attempts++;
    onStatusUpdate?.(`Verifying on-chain confirmation (Check #${attempts})...`);

    // Poll across BSC RPC endpoints
    for (const rpcUrl of BSC_RPCS) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: attempts,
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        });

        const json = await response.json();
        const receipt = json?.result;

        if (receipt) {
          // status '0x1' represents SUCCESS
          if (receipt.status === '0x1') {
            return {
              success: true,
              blockNumber: receipt.blockNumber,
            };
          } else if (receipt.status === '0x0') {
            return {
              success: false,
              error: 'Transaction failed / reverted on BSC ledger! Insufficient balance or execution reverted.',
            };
          }
        }
      } catch (rpcErr) {
        // Continue to next endpoint
      }
    }

    // Wait 1.5 seconds between polling attempts
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  // If mined not returned within timeout, check in-wallet eth provider
  if (typeof window !== 'undefined') {
    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (eth && typeof eth.request === 'function') {
      try {
        const receipt = await eth.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt?.status === '0x1') {
          return { success: true, blockNumber: receipt.blockNumber };
        } else if (receipt?.status === '0x0') {
          return { success: false, error: 'Transaction reverted on BSC blockchain.' };
        }
      } catch (e) {}
    }
  }

  // Never treat an unconfirmed transaction as successful.
  return {
    success: false,
    error: 'Transaction was not confirmed on BSC within the allotted time. Please check the transaction hash before retrying.',
  };
}

/**
 * Return / Transfer NXBC tokens from user wallet to Admin Treasury Wallet
 * for Token Auto-Sell liquidation and settlement
 */
export async function returnNxbcTokensToAdmin(
  amountTokens: number,
  userWalletAddress: string,
  onStatusUpdate?: (msg: string) => void,
  customReturnAddress?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!amountTokens || amountTokens <= 0) {
    return { success: false, error: 'Invalid token return amount' };
  }

  if (typeof window === 'undefined') {
    return { success: false, error: 'Web3 window not available' };
  }

  const eth =
    (window as any).trustwallet?.ethereum ||
    (window as any).ethereum ||
    (window as any).binancew3w?.ethereum ||
    (window as any).okxwallet;

  if (!eth || typeof eth.request !== 'function') {
    return {
      success: false,
      error: 'Web3 Wallet (Trust Wallet/MetaMask) not detected. Please connect your wallet.',
    };
  }

  try {
    const destinationWallet = (customReturnAddress && customReturnAddress.startsWith('0x') && customReturnAddress.length === 42)
      ? customReturnAddress
      : ADMIN_TREASURY_WALLET;

    onStatusUpdate?.(`Requesting token return approval to Settlement Wallet (${destinationWallet.substring(0, 6)}...${destinationWallet.substring(38)})...`);

    // ERC20 transfer(address to, uint256 value)
    // Method signature: 0xa9059cbb
    const cleanAdmin = destinationWallet.toLowerCase().replace('0x', '').padStart(64, '0');
    const amountWei = BigInt(Math.floor(amountTokens * 1e18));
    const cleanAmount = amountWei.toString(16).padStart(64, '0');
    const transferData = `0xa9059cbb${cleanAdmin}${cleanAmount}`;

    const txHash = await eth.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: userWalletAddress,
          to: NXBC_CONTRACT,
          data: transferData,
        },
      ],
    });

    onStatusUpdate?.('Waiting for BSC blockchain confirmation of token return...');
    const confirmResult = await waitForBscTxConfirmation(txHash, onStatusUpdate, 20);

    if (!confirmResult.success) {
      return {
        success: false,
        error: confirmResult.error || 'Token return transaction reverted on BSC.',
      };
    }

    return { success: true, txHash };
  } catch (error: any) {
    console.error('Error returning NXBC tokens:', error);
    return {
      success: false,
      error: error?.message || 'User rejected token return transaction in wallet.',
    };
  }
}

/**
 * 1-Click Trust Wallet / MetaMask Custom Token Importer (wallet_watchAsset)
 */
export async function addTokenToWallet(
  tokenAddress: string,
  tokenSymbol: string,
  tokenDecimals: number = 18,
  tokenImage?: string
): Promise<{ success: boolean; message?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window not available' };
  }

  const eth =
    (window as any).trustwallet?.ethereum ||
    (window as any).ethereum ||
    (window as any).binancew3w?.ethereum ||
    (window as any).okxwallet;

  if (!eth || typeof eth.request !== 'function') {
    return {
      success: false,
      message: 'No Web3 wallet provider detected. Please add the token manually in Trust Wallet using contract address.',
    };
  }

  try {
    const wasAdded = await eth.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage || 'https://i.imgur.com/8Q9Z8gG.png',
        },
      },
    });

    if (wasAdded) {
      return { success: true, message: `${tokenSymbol} successfully added to your wallet!` };
    } else {
      return { success: false, message: 'User declined token import in wallet.' };
    }
  } catch (error: any) {
    console.error('Error adding token to wallet:', error);
    return { success: false, message: error?.message || 'Failed to add token to wallet' };
  }
}



/**
 * Executes a token purchase using the NXBCPresale smart contract
 */
export async function executeSmartContractBuy(
  amountUsd: number,
  _sponsorAddress: string | null,
  _p2Tokens: number,
  _p3Tokens: number,
  _p4Tokens: number,
  _p5Tokens: number,
  _dexTokens: number,
  onStatusUpdate: (msg: string) => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Web3 window not available' };

  const ethProvider =
    (window as any).trustwallet?.ethereum ||
    (window as any).ethereum ||
    (window as any).binancew3w?.ethereum ||
    (window as any).okxwallet;

  if (!ethProvider || typeof ethProvider.request !== 'function') {
    return { success: false, error: 'Web3 wallet (Trust Wallet / MetaMask / Binance Web3) not detected in browser.' };
  }

  try {
    const provider = new ethers.BrowserProvider(ethProvider, 'any');
    let network = await provider.getNetwork();

    if (network.chainId !== 56n) {
      onStatusUpdate('Switching wallet to BNB Smart Chain Mainnet...');
      try {
        await ethProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902) {
          await ethProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain Mainnet',
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
        } else {
          return { success: false, error: 'Please switch your wallet network to BNB Smart Chain (BSC) before buying.' };
        }
      }
      network = await provider.getNetwork();
      if (network.chainId !== 56n) {
        return { success: false, error: 'Failed to switch network. Please select BNB Smart Chain Mainnet manually.' };
      }
    }

    const signer = await provider.getSigner();
    const buyer = await signer.getAddress();
    const amountWei = ethers.parseUnits(Number(amountUsd).toFixed(12), 18);

    const usdtContract = new ethers.Contract(
      USDT_CONTRACT,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
      ],
      signer
    );

    const presaleContract = new ethers.Contract(
      NXBC_PRESALE_CONTRACT,
      [
        'function buyTokens(uint256 usdtAmount) external',
        'function currentPhase() view returns (uint256)',
        'function currentPhasePrice() view returns (uint256)',
        'function currentPhaseRemaining() view returns (uint256)',
        'function presaleActive() view returns (bool)',
      ],
      signer
    );

    const [active, priceRaw, remainingRaw, balanceRaw] = await Promise.all([
      presaleContract.presaleActive(),
      presaleContract.currentPhasePrice(),
      presaleContract.currentPhaseRemaining(),
      usdtContract.balanceOf(buyer),
    ]);

    if (!active) return { success: false, error: 'Presale is currently inactive.' };
    if (balanceRaw < amountWei) return { success: false, error: 'Insufficient BSC USDT balance.' };

    const phasePrice = Number(ethers.formatUnits(priceRaw, 18));
    const remainingTokens = Number(ethers.formatUnits(remainingRaw, 18));
    const expectedTokens = Number(amountUsd) / phasePrice;
    if (expectedTokens > remainingTokens + 1e-12) {
      return { success: false, error: `Purchase exceeds current phase remaining supply. Remaining: ${remainingTokens.toLocaleString()} NXBC.` };
    }

    let allowance = await usdtContract.allowance(buyer, NXBC_PRESALE_CONTRACT);
    if (allowance < amountWei) {
      onStatusUpdate(`Approving ${Number(amountUsd).toFixed(4)} USDT for the Presale Contract...`);
      const approveTx = await usdtContract.approve(NXBC_PRESALE_CONTRACT, amountWei);
      const approveReceipt = await approveTx.wait(1);
      if (!approveReceipt || approveReceipt.status !== 1) {
        return { success: false, error: 'USDT approval transaction failed on BSC.' };
      }
      allowance = await usdtContract.allowance(buyer, NXBC_PRESALE_CONTRACT);
      if (allowance < amountWei) {
        return { success: false, error: 'USDT allowance was not updated. Please try again.' };
      }
    }

    onStatusUpdate(`Buying ${expectedTokens.toLocaleString()} NXBC from Phase ${await presaleContract.currentPhase()}...`);
    const buyTx = await presaleContract.buyTokens(amountWei, { gasLimit: 300000 });
    onStatusUpdate('Waiting for the NXBC purchase transaction to confirm on BSC...');
    const receipt = await buyTx.wait(1);

    if (!receipt || receipt.status !== 1) {
      return { success: false, error: 'NXBC purchase transaction reverted on BSC.' };
    }

    return { success: true, txHash: buyTx.hash };
  } catch (err: any) {
    console.error('Smart Contract Buy Error:', err);
    return { success: false, error: err?.shortMessage || err?.reason || err?.message || 'Transaction failed or rejected by user.' };
  }
}

export function buildWithdrawMessage(
  walletAddress: string,
  amountUsdt: number,
  walletType: string,
  timestamp: number
): string {
  return `Authorize withdrawal\nWallet: ${walletAddress.toLowerCase()}\nAmount: ${amountUsdt} USDT\nType: ${walletType}\nTimestamp: ${timestamp}`;
}

export async function signWithdrawRequest(
  walletAddress: string,
  amountUsdt: number,
  walletType: string = 'mlm'
): Promise<{ signature: string; timestamp: number }> {
  const timestamp = Date.now();
  const message = buildWithdrawMessage(walletAddress, amountUsdt, walletType, timestamp);

  if (typeof window !== 'undefined') {
    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (eth) {
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return { signature, timestamp };
    }
  }

  throw new Error('Web3 wallet not detected for signature authorization');
}

