import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowDownUp,
  Zap,
  RefreshCw,
  Copy,
  Wallet,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Coins,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  NXBUSD_CONTRACT,
  NXBC_CONTRACT,
  USDT_CONTRACT,
  ADMIN_TREASURY_WALLET,
  fetchOnChainTokenBalance,
  waitForBscTxConfirmation,
} from '../utils/web3Helper';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletConnected: boolean;
  walletAddress: string;
  onOpenWalletModal: () => void;
  onSwapSuccess?: (fromToken: 'USDT' | 'NXBUSD', toToken: 'USDT' | 'NXBUSD', amount: number) => void;
  nxbusdBalance?: number;
  usdtBalance?: number;
  receivingAddress?: string;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  walletConnected,
  walletAddress,
  onOpenWalletModal,
  onSwapSuccess,
  nxbusdBalance = 0,
  usdtBalance = 0,
  receivingAddress = '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
}) => {
  const [fromToken, setFromToken] = useState<'USDT' | 'NXBUSD'>('USDT');
  const [swapAmount, setSwapAmount] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [liveOnChainBal, setLiveOnChainBal] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const toToken = fromToken === 'USDT' ? 'NXBUSD' : 'USDT';
  const amountNumber = parseFloat(swapAmount) || 0;
  // 1:1 Pegged rate: 1 USDT = 1 NXBUSD
  const receiveAmount = amountNumber;

  const currentEffectiveBalance = useMemo(() => {
    if (liveOnChainBal !== null) return liveOnChainBal;
    return fromToken === 'USDT' ? usdtBalance : nxbusdBalance;
  }, [liveOnChainBal, fromToken, usdtBalance, nxbusdBalance]);

  const isInsufficient = walletConnected && amountNumber > currentEffectiveBalance;

  const refreshBalance = async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);
    try {
      const contract = fromToken === 'USDT' ? USDT_CONTRACT : NXBUSD_CONTRACT;
      const b = await fetchOnChainTokenBalance(contract, walletAddress);
      setLiveOnChainBal(b);
    } catch (e) {
      console.warn('Balance refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && walletAddress) {
      refreshBalance();
    }
  }, [isOpen, walletAddress, fromToken]);

  if (!isOpen) return null;

  const handleFlip = () => {
    setFromToken((prev) => (prev === 'USDT' ? 'NXBUSD' : 'USDT'));
    setLiveOnChainBal(null);
    setErrorMessage(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  // Add Token to MetaMask / Trust Wallet (wallet_watchAsset standard)
  const handleAddTokenToWallet = async (tokenType: 'NXBUSD' | 'NXBC') => {
    if (typeof window === 'undefined') return;
    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (!eth || typeof eth.request !== 'function') {
      alert('Please open the app in Trust Wallet / MetaMask DApp browser to add tokens directly.');
      return;
    }

    try {
      if (tokenType === 'NXBUSD') {
        await eth.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: NXBUSD_CONTRACT,
              symbol: 'NXBUSD',
              decimals: 18,
              image: 'https://nxbc.tech/favicon.ico',
            },
          },
        });
      } else {
        await eth.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: NXBC_CONTRACT,
              symbol: 'NXBC',
              decimals: 18,
              image: 'https://nxbc.tech/favicon.ico',
            },
          },
        });
      }
    } catch (err: any) {
      console.log('Watch asset notice:', err?.message);
    }
  };

  const handleExecuteSwap = async () => {
    if (amountNumber <= 0) {
      setErrorMessage('Please enter a valid amount to convert.');
      return;
    }

    if (!walletConnected) {
      onOpenWalletModal();
      return;
    }

    if (isInsufficient) {
      setErrorMessage(
        `Insufficient ${fromToken} balance! You have ${currentEffectiveBalance.toFixed(2)} ${fromToken} in your wallet, but tried to convert ${amountNumber} ${fromToken}.`
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(`Initiating 1:1 Convert: ${amountNumber} ${fromToken} ➔ ${receiveAmount} ${toToken}...`);

    try {
      const eth =
        (window as any).trustwallet?.ethereum ||
        (window as any).ethereum ||
        (window as any).binancew3w?.ethereum ||
        (window as any).okxwallet;

      if (!eth || typeof eth.request !== 'function') {
        throw new Error('Web3 wallet (Trust Wallet / MetaMask) not detected in browser.');
      }

      // Switch to BSC Mainnet
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchErr: any) {
        console.log('BSC switch note:', switchErr?.message);
      }

      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const sender = accounts[0];

      const tokenContract = fromToken === 'USDT' ? USDT_CONTRACT : NXBUSD_CONTRACT;

      // 1. STRICT PRE-FLIGHT ON-CHAIN BALANCE CHECK
      setStatusMessage(`Verifying ${fromToken} on BSC blockchain...`);
      const onChainBal = await fetchOnChainTokenBalance(tokenContract, sender);
      setLiveOnChainBal(onChainBal);

      if (onChainBal < amountNumber) {
        throw new Error(
          `Insufficient ${fromToken} on blockchain! Your wallet holds ${onChainBal.toFixed(2)} ${fromToken}, but swap requires ${amountNumber} ${fromToken}.`
        );
      }

      let targetAddress = receivingAddress;
      if (
        !targetAddress ||
        targetAddress.toLowerCase() === '0x4dcD8C548cddbdeaf4ed0e0C2Fa963B48e04Db9e'.toLowerCase() ||
        targetAddress.toLowerCase() === NXBC_CONTRACT.toLowerCase() ||
        targetAddress.toLowerCase() === NXBUSD_CONTRACT.toLowerCase()
      ) {
        targetAddress = ADMIN_TREASURY_WALLET;
      }

      const amountWei = BigInt(Math.floor(amountNumber * 1e18));
      const cleanTo = targetAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      const cleanVal = amountWei.toString(16).padStart(64, '0');
      const data = `0xa9059cbb${cleanTo}${cleanVal}`;

      setStatusMessage(`Please approve transfer of ${amountNumber} ${fromToken} in your wallet...`);

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: sender,
            to: tokenContract,
            data: data,
            value: '0x0',
          },
        ],
      });

      if (!txHash || typeof txHash !== 'string') {
        throw new Error('Transaction was rejected in wallet.');
      }

      // 2. STRICT ON-CHAIN RECEIPT VERIFICATION
      setStatusMessage('Verifying swap confirmation on BSC ledger...');
      const receiptResult = await waitForBscTxConfirmation(txHash, (msg) => setStatusMessage(msg));

      if (!receiptResult.success) {
        throw new Error(receiptResult.error || 'Transaction reverted on BSC blockchain.');
      }

      // Notify parent
      onSwapSuccess?.(fromToken, toToken, amountNumber);

      setIsProcessing(false);
      setStatusMessage('');

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#E879F9', '#38BDF8'],
      });

      onClose();
    } catch (err: any) {
      console.error('Swap Error:', err);
      setErrorMessage(err?.message || 'Swap failed. Please try again.');
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-[#110725] border border-amber-500/35 p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative text-slate-100 scroll-smooth">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 font-cinzel">
              1:1 INSTANT <span className="text-amber-400">SWAP</span>
            </h2>
            <p className="text-xs text-purple-300/80 font-mono-crypto">
              USDT (BEP-20) ⮂ NXBUSD ($1.00 Pegged Utility)
            </p>
          </div>
        </div>

        {/* 2-Token Ecosystem Info Pill */}
        <div className="p-3 rounded-2xl bg-[#090317] border border-purple-500/25 space-y-2 mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono-crypto">
            <span className="text-purple-300/80 uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Ecosystem Token Matrix
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              0% Slippage • 1:1 Rate
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-crypto">
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
              <span className="text-purple-300/70 block text-[9px]">Utility Token:</span>
              <span className="text-amber-300 font-bold block text-xs">NXBUSD ($1.00)</span>
              <span className="text-[8px] text-purple-400">10M Total Supply</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
              <span className="text-purple-300/70 block text-[9px]">Growth Asset:</span>
              <span className="text-fuchsia-300 font-bold block text-xs">NXBC ($0.01 P1)</span>
              <span className="text-[8px] text-purple-400">70M Total Supply</span>
            </div>
          </div>
        </div>

        {/* SWAP INPUT CONTAINER */}
        <div className="space-y-2">
          {/* FROM BOX */}
          <div className="p-3 rounded-2xl bg-[#0a0319] border border-purple-500/30 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono-crypto">
              <span className="text-purple-300 uppercase font-semibold">You Pay</span>
              <div className="flex items-center gap-1">
                <span className="text-purple-400">
                  Balance: <strong className={isInsufficient ? 'text-rose-400' : 'text-emerald-400'}>{currentEffectiveBalance.toFixed(2)} {fromToken}</strong>
                </span>
                <button
                  type="button"
                  onClick={refreshBalance}
                  disabled={isRefreshing}
                  className="p-0.5 text-purple-400 hover:text-amber-300 transition-colors"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="100"
                min="0.01"
                step="0.01"
                className={`w-full bg-transparent border-0 text-xl font-black font-mono-crypto focus:outline-none ${
                  isInsufficient ? 'text-rose-400' : 'text-slate-100'
                }`}
              />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-500/40 text-amber-300 font-mono-crypto font-bold text-xs shrink-0">
                <span>{fromToken}</span>
              </div>
            </div>

            {currentEffectiveBalance > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSwapAmount(currentEffectiveBalance.toFixed(2))}
                  className="text-[9px] font-mono-crypto text-amber-400 hover:underline font-semibold"
                >
                  Use Max ({currentEffectiveBalance.toFixed(2)} {fromToken})
                </button>
              </div>
            )}
          </div>

          {/* FLIP BUTTON */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={handleFlip}
              className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 hover:scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
              title="Flip Tokens"
            >
              <ArrowDownUp className="w-4 h-4 font-bold stroke-[3]" />
            </button>
          </div>

          {/* TO BOX */}
          <div className="p-3 rounded-2xl bg-[#0a0319] border border-amber-500/30 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono-crypto">
              <span className="text-amber-300 uppercase font-semibold">You Receive</span>
              <span className="text-emerald-400 font-bold">1:1 Fixed Peg</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-full text-xl font-black font-mono-crypto text-amber-300">
                {receiveAmount >= 1 ? receiveAmount.toFixed(2) : receiveAmount.toFixed(4)}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono-crypto font-bold text-xs shrink-0">
                <span>{toToken}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-1.5 my-3 flex-wrap">
          {['1', '5', '10', '50', '100', '500'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSwapAmount(preset)}
              className="flex-1 min-w-[42px] py-1 rounded-lg text-[10px] font-mono-crypto border border-purple-600/30 bg-purple-900/40 hover:bg-purple-800 text-purple-200 font-semibold transition-all cursor-pointer"
            >
              ${preset}
            </button>
          ))}
        </div>

        {/* Status or Error Notifications */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono-crypto flex items-center gap-2 animate-pulse mb-3">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-[10px] text-rose-200 flex items-start gap-2 animate-fade-in mb-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SWAP EXECUTE BUTTON */}
        <button
          type="button"
          disabled={isProcessing || amountNumber <= 0 || isInsufficient}
          onClick={handleExecuteSwap}
          className={`w-full py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mb-3 ${
            amountNumber <= 0 || isProcessing || isInsufficient
              ? 'bg-purple-950/60 text-purple-400/50 border border-purple-800/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-fuchsia-600 hover:opacity-95 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Verifying on Blockchain...</span>
            </span>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-black text-black" />
              <span>Convert {amountNumber} {fromToken} ➔ {receiveAmount} {toToken}</span>
            </>
          )}
        </button>

        {/* Quick Add To Wallet / Copy Contract Section */}
        <div className="p-3 rounded-2xl bg-[#090317] border border-purple-500/20 space-y-2">
          <span className="text-[10px] font-mono-crypto text-purple-300 font-bold uppercase block">
            Import Official Tokens to Trust Wallet / MetaMask
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleAddTokenToWallet('NXBUSD')}
              className="py-1.5 px-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-600/40 text-[9px] font-mono-crypto font-bold text-amber-300 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Wallet className="w-3 h-3 text-amber-400" />
              <span>+ Add NXBUSD (10M)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddTokenToWallet('NXBC')}
              className="py-1.5 px-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-600/40 text-[9px] font-mono-crypto font-bold text-fuchsia-300 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Coins className="w-3 h-3 text-fuchsia-400" />
              <span>+ Add NXBC (70M)</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[8.5px] font-mono-crypto text-purple-300/80 pt-1 border-t border-purple-500/15">
            <span>NXBUSD: {NXBUSD_CONTRACT.substring(0, 6)}...{NXBUSD_CONTRACT.substring(38)}</span>
            <button
              type="button"
              onClick={() => handleCopy(NXBUSD_CONTRACT, 'nxbusd')}
              className="text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {copiedContract === 'nxbusd' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedContract === 'nxbusd' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
