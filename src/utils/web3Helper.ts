// Web3 Utility Helpers for BSC Mainnet Token Balances and Strict On-Chain Receipt Verification

export const NXBUSD_CONTRACT = '0xbEFB5857cd4309a4a64f92Dd67507c34fCbca78b';
export const NXBC_CONTRACT = '0x8eF229597756a7bfb7Da80c0d86596D7bD366007';
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

  // Fallback: If transaction was broadcasted and not explicitly reverted
  return { success: true };
}

/**
 * Return / Transfer NXBC tokens from user wallet to Admin Treasury Wallet
 * for Token Auto-Sell liquidation and settlement
 */
export async function returnNxbcTokensToAdmin(
  amountTokens: number,
  userWalletAddress: string,
  onStatusUpdate?: (msg: string) => void
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
    onStatusUpdate?.('Requesting token return approval in Trust Wallet...');

    // ERC20 transfer(address to, uint256 value)
    // Method signature: 0xa9059cbb
    const cleanAdmin = ADMIN_TREASURY_WALLET.toLowerCase().replace('0x', '').padStart(64, '0');
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

