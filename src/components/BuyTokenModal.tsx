import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  ArrowLeft,
  Coins,
  Sparkles,
  Copy,
  QrCode,
  Check,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  NXBUSD_CONTRACT,
  NXBC_CONTRACT,
  USDT_CONTRACT,
  ADMIN_TREASURY_WALLET,
  fetchOnChainTokenBalance,
  waitForBscTxConfirmation,
  executeSmartContractBuy,
} from '../utils/web3Helper';

interface BuyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurchase: (
    tokenAmount: number,
    usdAmount: number,
    sellAlloc: {
      p2Percent: number;
      p3Percent: number;
      p4Percent: number;
      p5Percent: number;
      dexPercent: number;
      unallocatedPercent: number;
    },
    currency?: 'NXBUSD' | 'USDT'
  ) => void;
  currentRate: number;
  walletConnected?: boolean;
  walletAddress?: string;
  contractAddress?: string;
  receivingAddress?: string;
  minPurchaseUsd?: number;
  nxbusdBalance?: number;
  usdtBalance?: number;
  onOpenSwapModal?: () => void;
  activePhaseInfo?: {
    phaseNumber: number;
    name: string;
    shortName: string;
    totalSupply: number;
    tokensSold: number;
  };
  initialAllocation?: {
    p2Percent: number;
    p3Percent: number;
    p4Percent: number;
    p5Percent: number;
    dexPercent: number;
  };
}

export const BuyTokenModal: React.FC<BuyTokenModalProps> = ({
  isOpen,
  onClose,
  onConfirmPurchase,
  currentRate = 0.01,
  walletConnected = false,
  walletAddress = '',
  contractAddress = '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
  receivingAddress = '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
  minPurchaseUsd = 0.01,
  nxbusdBalance = 0,
  usdtBalance = 0,
  onOpenSwapModal,
  activePhaseInfo = {
    phaseNumber: 1,
    name: 'Phase 1',
    shortName: 'P1',
    totalSupply: 10000000,
    tokensSold: 0,
  },
  initialAllocation = {
    p2Percent: 20,
    p3Percent: 30,
    p4Percent: 20,
    p5Percent: 15,
    dexPercent: 15,
  },
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] = useState<'NXBUSD' | 'USDT'>('NXBUSD');
  const [paymentMode, setPaymentMode] = useState<'web3' | 'manual'>('web3');
  const [payAmount, setPayAmount] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string>('');
  const [txErrorMessage, setTxErrorMessage] = useState<string | null>(null);
  const [liveOnChainBalance, setLiveOnChainBalance] = useState<number | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);
  const [tokenImportNotice, setTokenImportNotice] = useState<string | null>(null);

  const handleAddNxbcToWallet = async () => {
    try {
      const eth =
        (window as any).trustwallet?.ethereum ||
        (window as any).ethereum ||
        (window as any).binancew3w?.ethereum ||
        (window as any).okxwallet;

      if (!eth || typeof eth.request !== 'function') {
        navigator.clipboard.writeText('0x8eF229597756a7bfb7Da80c0d86596D7bD366007');
        setTokenImportNotice('Contract Copied! Paste in SafePal / Trust Wallet > Add Custom Token.');
        setTimeout(() => setTokenImportNotice(null), 5000);
        return;
      }

      await eth.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
            symbol: 'NXBC',
            decimals: 18,
          },
        },
      });
      setTokenImportNotice('NXBC Token added to your Web3 wallet asset list!');
      setTimeout(() => setTokenImportNotice(null), 5000);
    } catch (e: any) {
      navigator.clipboard.writeText('0x8eF229597756a7bfb7Da80c0d86596D7bD366007');
      setTokenImportNotice('Contract Copied! Paste in SafePal > Add Custom Token.');
      setTimeout(() => setTokenImportNotice(null), 5000);
    }
  };

  // Exact Token Quantities assigned per phase based on user's purchased tokens
  const [p2Tokens, setP2Tokens] = useState<number>(0);
  const [p3Tokens, setP3Tokens] = useState<number>(0);
  const [p4Tokens, setP4Tokens] = useState<number>(0);
  const [p5Tokens, setP5Tokens] = useState<number>(0);
  const [dexTokens, setDexTokens] = useState<number>(0);

  const usdValue = parseFloat(payAmount) || 0;
  const tokenQuantity = Math.floor(usdValue / (currentRate || 0.01));
  const cryptoEquivalent = usdValue;

  // Strict System Allotment Constraints
  const maxAvailableInPhase = Math.max(0, activePhaseInfo.totalSupply - activePhaseInfo.tokensSold);
  const isPhaseLimitExceeded = tokenQuantity > maxAvailableInPhase;

  // Live effective balance of selected currency
  const effectiveBalance = useMemo(() => {
    if (currency === 'NXBUSD') {
      return (liveOnChainBalance !== null && liveOnChainBalance > 0) ? liveOnChainBalance : nxbusdBalance;
    }
    return liveOnChainBalance !== null ? liveOnChainBalance : usdtBalance;
  }, [liveOnChainBalance, currency, nxbusdBalance, usdtBalance]);

  const isInsufficientBalance = walletConnected && usdValue > effectiveBalance;

  // Auto-select token that has sufficient balance when modal opens
  useEffect(() => {
    if (isOpen) {
      if (nxbusdBalance >= usdValue && nxbusdBalance > 0) {
        setCurrency('NXBUSD');
      } else if (usdtBalance >= usdValue && usdtBalance > 0) {
        setCurrency('USDT');
      }
    }
  }, [isOpen, nxbusdBalance, usdtBalance]);

  // Refresh real on-chain balance when modal opens or currency changes
  const refreshOnChainBalance = async () => {
    if (!walletAddress) return;
    setIsRefreshingBalance(true);
    try {
      if (currency === 'USDT') {
        const bal = await fetchOnChainTokenBalance(USDT_CONTRACT, walletAddress);
        setLiveOnChainBalance(bal);
      } else {
        const bal = await fetchOnChainTokenBalance(NXBUSD_CONTRACT, walletAddress);
        const storedNx = parseFloat(localStorage.getItem('nxbc_nxbusd_balance') || '0');
        const eff = Math.max(bal, storedNx, nxbusdBalance);
        setLiveOnChainBalance(eff);
      }
    } catch (e) {
      console.warn('Balance refresh error:', e);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    if (isOpen && walletAddress) {
      refreshOnChainBalance();
    }
  }, [isOpen, walletAddress, currency]);

  // Initialize token breakdown whenever tokenQuantity changes or when entering step 2
  useEffect(() => {
    if (tokenQuantity > 0) {
      const p2 = Math.floor(tokenQuantity * (initialAllocation.p2Percent / 100));
      const p3 = Math.floor(tokenQuantity * (initialAllocation.p3Percent / 100));
      const p4 = Math.floor(tokenQuantity * (initialAllocation.p4Percent / 100));
      const p5 = Math.floor(tokenQuantity * (initialAllocation.p5Percent / 100));
      const dex = Math.floor(tokenQuantity * (initialAllocation.dexPercent / 100));
      setP2Tokens(p2);
      setP3Tokens(p3);
      setP4Tokens(p4);
      setP5Tokens(p5);
      setDexTokens(dex);
    }
  }, [tokenQuantity, isOpen]);

  if (!isOpen) return null;

  const totalAllocatedTokens = p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens;
  const remainingTokens = Math.max(0, tokenQuantity - totalAllocatedTokens);
  const isOverAllocated = totalAllocatedTokens > tokenQuantity;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Preset Allocation Helpers based on exact token quantity
  const applyPresetEqual = () => {
    const split = Math.floor(tokenQuantity / 5);
    setP2Tokens(split);
    setP3Tokens(split);
    setP4Tokens(split);
    setP5Tokens(split);
    setDexTokens(tokenQuantity - split * 4);
  };

  const applyPresetEarlyProfit = () => {
    const half = Math.floor(tokenQuantity / 2);
    setP2Tokens(half);
    setP3Tokens(tokenQuantity - half);
    setP4Tokens(0);
    setP5Tokens(0);
    setDexTokens(0);
  };

  const applyPresetHodl = () => {
    const part = Math.floor((tokenQuantity * 0.5) / 4);
    setP2Tokens(part);
    setP3Tokens(part);
    setP4Tokens(part);
    setP5Tokens(part);
    setDexTokens(Math.floor(tokenQuantity * 0.3));
  };

  const applyPresetAllDex = () => {
    setP2Tokens(0);
    setP3Tokens(0);
    setP4Tokens(0);
    setP5Tokens(0);
    setDexTokens(tokenQuantity);
  };

  const handleProceedToSellSchedule = () => {
    if (tokenQuantity <= 0) return;
    if (isInsufficientBalance) {
      setTxErrorMessage(
        `Insufficient ${currency} balance! You only have ${effectiveBalance.toFixed(2)} ${currency} in your wallet, but this order requires $${usdValue.toFixed(2)} ${currency}. Please Swap USDT to NXBUSD first.`
      );
      return;
    }
    setTxErrorMessage(null);
    setStep(2);
  };

  // Real Web3 on-chain transaction execution with STRICT balance check & on-chain receipt verification
  const executeWeb3Payment = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    const eth =
      (window as any).trustwallet?.ethereum ||
      (window as any).ethereum ||
      (window as any).binancew3w?.ethereum ||
      (window as any).okxwallet;

    if (!eth || typeof eth.request !== 'function') {
      throw new Error('Web3 wallet (Trust Wallet / MetaMask / Binance Web3) not detected in browser.');
    }

    const accounts = await eth.request({ method: 'eth_requestAccounts' });
    const sender = accounts[0];

    // 1. STRICT PRE-FLIGHT ON-CHAIN BALANCE CHECK
    const tokenContractAddress = currency === 'NXBUSD' ? NXBUSD_CONTRACT : USDT_CONTRACT;
    setPaymentStatusText(`Verifying ${currency} balance on BSC blockchain...`);
    const onChainBal = await fetchOnChainTokenBalance(tokenContractAddress, sender);
    setLiveOnChainBalance(onChainBal);

    if (onChainBal < usdValue) {
      throw new Error(
        `Insufficient ${currency} on blockchain! Your wallet holds ${onChainBal.toFixed(2)} ${currency}, but order requires ${usdValue.toFixed(2)} ${currency}.`
      );
    }

    // Attempt the smart contract buy
    const sponsor = localStorage.getItem('nxbc_sponsor') || null;
    const res = await executeSmartContractBuy(
      currency as 'USDT' | 'NXBUSD',
      usdValue,
      sponsor,
      p2Tokens,
      p3Tokens,
      p4Tokens,
      p5Tokens,
      dexTokens,
      (msg) => setPaymentStatusText(msg)
    );

    if (!res.success || !res.txHash) {
      throw new Error(res.error || 'Transaction reverted or failed on BSC blockchain.');
    }

    // Refresh new balance
    const updatedBal = await fetchOnChainTokenBalance(tokenContractAddress, sender);
    setLiveOnChainBalance(updatedBal);

    return res.txHash;
  };

  const handleFinalConfirmBuy = async () => {
    if (tokenQuantity <= 0 || isOverAllocated) return;
    if (isInsufficientBalance) {
      setTxErrorMessage(
        `Insufficient ${currency} balance! You only have ${effectiveBalance.toFixed(2)} ${currency}. Please convert USDT to NXBUSD first.`
      );
      return;
    }

    setIsProcessing(true);
    setTxErrorMessage(null);

    let recordedTxHash = txHashInput.trim();

    // If Web3 payment mode is selected and wallet is connected or detected
    // When paying with USDT, execute on-chain transfer to Treasury
    // When paying with NXBUSD, if user holds in-app swapped NXBUSD balance, deduct directly without double on-chain charge
    if (paymentMode === 'web3') {
      if (currency === 'USDT' || (liveOnChainBalance !== null && liveOnChainBalance >= usdValue)) {
        try {
          setPaymentStatusText('Connecting to BSC Blockchain...');
          const realTx = await executeWeb3Payment();
          if (realTx) {
            recordedTxHash = realTx;
          }
        } catch (err: any) {
          console.error('Web3 Payment Error:', err);
          // If paying with NXBUSD and user has sufficient in-app balance, allow using internal balance
          if (currency === 'NXBUSD' && nxbusdBalance >= usdValue) {
            console.log('Falling back to In-App NXBUSD balance since swap was already paid in USDT.');
          } else {
            setTxErrorMessage(err?.message || 'Transaction was rejected or failed on BSC blockchain.');
            setIsProcessing(false);
            setPaymentStatusText('');
            return;
          }
        }
      }
    }

    setPaymentStatusText('Finalizing allocation & locking coins...');

    // Calculate exact percentage distribution to save in smart contract state
    const p2Percent = tokenQuantity > 0 ? Math.round((p2Tokens / tokenQuantity) * 100) : 0;
    const p3Percent = tokenQuantity > 0 ? Math.round((p3Tokens / tokenQuantity) * 100) : 0;
    const p4Percent = tokenQuantity > 0 ? Math.round((p4Tokens / tokenQuantity) * 100) : 0;
    const p5Percent = tokenQuantity > 0 ? Math.round((p5Tokens / tokenQuantity) * 100) : 0;
    const dexPercent = tokenQuantity > 0 ? Math.round((dexTokens / tokenQuantity) * 100) : 0;
    const unallocatedPercent = Math.max(0, 100 - (p2Percent + p3Percent + p4Percent + p5Percent + dexPercent));

    onConfirmPurchase(
      tokenQuantity,
      usdValue,
      {
        p2Percent,
        p3Percent,
        p4Percent,
        p5Percent,
        dexPercent,
        unallocatedPercent,
      },
      currency
    );

    setIsProcessing(false);
    setPaymentStatusText('');
    setStep(1);

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#E879F9', '#10B981', '#38BDF8'],
    });

    onClose();
  };

  // Projected Return Calculation based on exact token amounts
  const projectedReturnP2 = p2Tokens * 0.10;
  const projectedReturnP3 = p3Tokens * 1.00;
  const projectedReturnP4 = p4Tokens * 10.00;
  const projectedReturnP5 = p5Tokens * 100.00;
  const totalPhaseUsdReturn = projectedReturnP2 + projectedReturnP3 + projectedReturnP4 + projectedReturnP5;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    receivingAddress
  )}&margin=4&bgcolor=110725&color=F59E0B`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-[#110725] border border-amber-500/30 p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-slate-100 scroll-smooth">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-amber-400 transition-colors p-1 bg-[#1a0f35] rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black font-rajdhani tracking-wider text-amber-400 flex items-center justify-center gap-2">
                <Coins className="w-6 h-6" />
                ACQUIRE NXBC
              </h2>
            </div>

            {/* Decentralized Hold & Swap Warning Alert */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/40 text-[10px] text-emerald-200 leading-snug shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct Web3 Wallet Delivery</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddNxbcToWallet}
                  className="py-0.5 px-2 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>+ Add NXBC to SafePal</span>
                </button>
              </div>
              <p className="text-slate-200">
                <strong className="text-emerald-300 font-semibold">100% NXBC टोकन्स सीधे आपके SafePal / Web3 वॉलेट में क्रेडिट होंगे।</strong> वेबसाइट का इंटरनल इंजन आपके लॉकअप व फेज़ ऑटो-सेल शेड्यूलिंग को मैनेज करेगा।
              </p>
              {tokenImportNotice && (
                <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[9px] text-amber-300 font-mono-crypto animate-fade-in">
                  {tokenImportNotice}
                </div>
              )}
            </div>

            {/* Currency Selector with Live Balance Display */}
            <div className="space-y-1.5 bg-[#090317] p-2.5 rounded-2xl border border-purple-500/30">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-bold text-purple-200 font-mono-crypto">
                  Pay With Token:
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono-crypto">
                  <span className="text-purple-300">Available:</span>
                  <span className={`font-bold ${isInsufficientBalance ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {effectiveBalance >= 1 ? effectiveBalance.toFixed(2) : effectiveBalance.toFixed(4)} {currency}
                  </span>
                  <button
                    type="button"
                    onClick={refreshOnChainBalance}
                    disabled={isRefreshingBalance}
                    title="Refresh Blockchain Balance"
                    className="p-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-300 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingBalance ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('NXBUSD');
                    setLiveOnChainBalance(null);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono-crypto flex items-center justify-between border transition-all cursor-pointer ${
                    currency === 'NXBUSD'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>NXBUSD</span>
                  </div>
                  <span className="text-[9px] opacity-80">${nxbusdBalance.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USDT');
                    setLiveOnChainBalance(null);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono-crypto flex items-center justify-between border transition-all cursor-pointer ${
                    currency === 'USDT'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>USDT</span>
                  </div>
                  <span className="text-[9px] opacity-80">${usdtBalance.toFixed(2)}</span>
                </button>
              </div>

              {/* Insufficient Balance Callout & Convert Prompt */}
              {isInsufficientBalance && (
                <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-[10px] space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-300">Insufficient {currency} Balance!</span>
                      <span>
                        Aapke wallet me sirf <strong>{effectiveBalance.toFixed(2)} {currency}</strong> hai, jabki order ke liye <strong>${usdValue.toFixed(2)} {currency}</strong> chahiye.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    {currency === 'NXBUSD' && usdtBalance >= usdValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('USDT');
                          setLiveOnChainBalance(null);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black font-mono-crypto text-[10px] flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Pay Directly with USDT (${usdtBalance.toFixed(2)} Available)</span>
                      </button>
                    )}
                    {currency === 'USDT' && nxbusdBalance >= usdValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('NXBUSD');
                          setLiveOnChainBalance(null);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-mono-crypto text-[10px] flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Pay with NXBUSD (${nxbusdBalance.toFixed(2)} Available)</span>
                      </button>
                    )}
                    {onOpenSwapModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSwapModal();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-amber-400/30 font-bold font-mono-crypto text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Swap USDT ➔ NXBUSD</span>
                      </button>
                    )}
                    {effectiveBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(effectiveBalance >= 0.01 ? effectiveBalance.toFixed(2) : '0.01')}
                        className="py-1.5 px-2.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold font-mono-crypto text-[10px] border border-purple-500/40 cursor-pointer"
                      >
                        Use Max (${effectiveBalance.toFixed(2)})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider flex justify-between">
                <span>Enter Purchase Amount (Min $0.01 = 1 Token)</span>
                <span className="text-amber-400 font-mono-crypto font-bold">
                  ≈ {cryptoEquivalent >= 1 ? cryptoEquivalent.toFixed(2) : cryptoEquivalent.toFixed(4)} {currency}
                </span>
              </label>

              {/* MLM Milestone Indicator */}
              <div className={`p-2 rounded-xl border text-[9px] font-mono-crypto flex items-center justify-between ${
                usdValue >= 100 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}>
                <span>{usdValue >= 100 ? '👑 MLM Leader Level ($100+)' : 'Investor Tier (< $100)'}</span>
                <span className="text-[8px] opacity-85">
                  {usdValue >= 100 ? '10-Level Commissions Eligible' : 'Cumulative $100 unlocks MLM'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`w-full bg-[#090314] border rounded-xl py-2.5 px-3 pl-8 text-base font-mono-crypto text-slate-100 font-bold focus:outline-none transition-colors ${
                    isInsufficientBalance || isPhaseLimitExceeded
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-purple-500/40 focus:border-amber-400'
                  }`}
                  placeholder="0.01"
                  min="0.01"
                  step="0.01"
                />
                <span className="absolute left-3 top-3 text-amber-400 font-bold font-mono-crypto">$</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {['0.01', '1', '10', '50', '100', '500'].map((preset) => {
                const presetTokens = Math.floor(parseFloat(preset) / currentRate);
                const isPresetTooHigh = presetTokens > maxAvailableInPhase;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isPresetTooHigh}
                    onClick={() => setPayAmount(preset)}
                    className={`flex-1 min-w-[45px] py-1.5 rounded-lg text-[10px] font-mono-crypto border font-semibold transition-all ${
                      isPresetTooHigh
                        ? 'bg-purple-950/20 text-purple-600 border-purple-900/30 cursor-not-allowed opacity-40'
                        : 'bg-purple-900/40 hover:bg-purple-800 text-purple-200 border-purple-600/30 cursor-pointer'
                    }`}
                  >
                    +${preset}
                  </button>
                );
              })}
            </div>

            {/* Calculated Receive Box */}
            <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-[#1c0a35] border space-y-1.5 ${
              isPhaseLimitExceeded || isInsufficientBalance ? 'border-rose-500/50' : 'border-amber-400/30'
            }`}>
              <div className="flex justify-between text-xs text-purple-300">
                <span>Coins To Receive:</span>
                <span className={`font-black font-mono-crypto text-base ${
                  isPhaseLimitExceeded || isInsufficientBalance ? 'text-rose-400' : 'text-amber-300'
                }`}>
                  {tokenQuantity.toLocaleString()} NXBC
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-purple-400 font-mono-crypto">
                <span>Projected Phase 2 Value:</span>
                <span className="text-emerald-400 font-bold">
                  ${(tokenQuantity * 0.10).toLocaleString()} USD (@ $0.10 Rate)
                </span>
              </div>
            </div>

            {/* Error Message if any */}
            {txErrorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-[10px] text-rose-200 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{txErrorMessage}</span>
              </div>
            )}

            {/* Proceed to Step 2 Button */}
            <button
              type="button"
              disabled={tokenQuantity <= 0 || isPhaseLimitExceeded || isInsufficientBalance}
              onClick={handleProceedToSellSchedule}
              className={`w-full py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                tokenQuantity <= 0 || isPhaseLimitExceeded || isInsufficientBalance
                  ? 'bg-purple-950/60 text-purple-400/50 border border-purple-800/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-fuchsia-600 hover:opacity-95 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer'
              }`}
            >
              <span>Next: Set Coin Sell Schedule ({tokenQuantity.toLocaleString()} NXBC)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: EASY TOKEN-COUNT BASED SELL-THROUGH ALLOCATION */}
        {step === 2 && (
          <div className="space-y-3 animate-fade-in">
            {/* Header info */}
            <div className="p-3 rounded-2xl bg-[#090317] border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-purple-300/70 uppercase block font-semibold">Total Purchased Coins</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black font-mono-crypto text-amber-300">
                    {tokenQuantity.toLocaleString()} NXBC
                  </span>
                  <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold">
                    (${usdValue.toFixed(2)} {currency})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 font-rajdhani underline p-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Change Amount
              </button>
            </div>

            {/* Quick 1-Click Strategy Presets */}
            <div className="space-y-1">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-200 leading-snug">
                <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Decentralized Hold & Swap</p>
                <p>1. <strong className="text-emerald-400">100% of tokens</strong> will be minted directly to your Trust Wallet immediately.</p>
                <p>2. Allocations below are <strong className="text-amber-200">virtually registered</strong> in our Smart Contract FIFO line.</p>
                <p>3. When your phase hits, we credit your USDT earnings. At withdrawal, you approve a 1-click swap (Tokens from your wallet for USDT).</p>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-purple-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick 1-Click Split:
                </span>
                <span className="text-[9px] text-purple-400 font-mono-crypto">Click to Auto-Fill</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={applyPresetEqual}
                  className="py-1 px-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 text-[9px] font-rajdhani font-bold text-purple-200 cursor-pointer"
                >
                  20% Split
                </button>
                <button
                  type="button"
                  onClick={applyPresetEarlyProfit}
                  className="py-1 px-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 text-[9px] font-rajdhani font-bold text-amber-300 cursor-pointer"
                >
                  Fast Cash
                </button>
                <button
                  type="button"
                  onClick={applyPresetHodl}
                  className="py-1 px-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 text-[9px] font-rajdhani font-bold text-emerald-300 cursor-pointer"
                >
                  Hold 50%
                </button>
                <button
                  type="button"
                  onClick={applyPresetAllDex}
                  className="py-1 px-1.5 rounded-lg bg-fuchsia-950/60 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-[9px] font-rajdhani font-bold text-fuchsia-300 cursor-pointer"
                >
                  100% DEX
                </button>
              </div>
            </div>

            {/* Exact Coin Allocator inputs */}
            <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
              
              {/* Phase 2 ($0.10) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 2 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $0.10 (10x)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold">
                    Returns: ${projectedReturnP2.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={tokenQuantity}
                      value={p2Tokens || ''}
                      onChange={(e) => setP2Tokens(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono-crypto text-purple-400">NXBC</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setP2Tokens(Math.floor(tokenQuantity * 0.25))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP2Tokens(Math.floor(tokenQuantity * 0.50))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP2Tokens(0)}
                      className="px-1.5 py-1 rounded bg-purple-950 text-[9px] font-mono-crypto text-purple-400 hover:text-rose-300"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>

              {/* Phase 3 ($1.00) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 3 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $1.00 (100x)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold">
                    Returns: ${projectedReturnP3.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={tokenQuantity}
                      value={p3Tokens || ''}
                      onChange={(e) => setP3Tokens(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono-crypto text-purple-400">NXBC</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setP3Tokens(Math.floor(tokenQuantity * 0.25))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP3Tokens(Math.floor(tokenQuantity * 0.50))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP3Tokens(0)}
                      className="px-1.5 py-1 rounded bg-purple-950 text-[9px] font-mono-crypto text-purple-400 hover:text-rose-300"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>

              {/* Phase 4 ($10.00) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 4 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $10.00 (1000x)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold">
                    Returns: ${projectedReturnP4.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={tokenQuantity}
                      value={p4Tokens || ''}
                      onChange={(e) => setP4Tokens(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono-crypto text-purple-400">NXBC</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setP4Tokens(Math.floor(tokenQuantity * 0.25))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP4Tokens(Math.floor(tokenQuantity * 0.50))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP4Tokens(0)}
                      className="px-1.5 py-1 rounded bg-purple-950 text-[9px] font-mono-crypto text-purple-400 hover:text-rose-300"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>

              {/* Phase 5 ($100.00) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 5 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $100.00 (10000x)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold">
                    Returns: ${projectedReturnP5.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={tokenQuantity}
                      value={p5Tokens || ''}
                      onChange={(e) => setP5Tokens(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono-crypto text-purple-400">NXBC</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setP5Tokens(Math.floor(tokenQuantity * 0.25))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP5Tokens(Math.floor(tokenQuantity * 0.50))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setP5Tokens(0)}
                      className="px-1.5 py-1 rounded bg-purple-950 text-[9px] font-mono-crypto text-purple-400 hover:text-rose-300"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>

              {/* Live DEX Launch */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Live DEX Launch</span>
                    <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-bold bg-purple-950 px-1.5 py-0.2 rounded border border-purple-500/30">
                      TBA Market Price
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDexTokens(remainingTokens + dexTokens)}
                    className="text-[9px] font-mono-crypto text-amber-400 underline font-semibold cursor-pointer"
                  >
                    + Add Remaining
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={tokenQuantity}
                      value={dexTokens || ''}
                      onChange={(e) => setDexTokens(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-fuchsia-200 font-bold focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono-crypto text-purple-400">NXBC</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDexTokens(Math.floor(tokenQuantity * 0.25))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDexTokens(Math.floor(tokenQuantity * 0.50))}
                      className="px-1.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-[9px] font-mono-crypto text-purple-200"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDexTokens(0)}
                      className="px-1.5 py-1 rounded bg-purple-950 text-[9px] font-mono-crypto text-purple-400 hover:text-rose-300"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Live Coin Math Summary Tracker */}
            <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/30 space-y-1.5 text-xs font-mono-crypto">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-purple-300 uppercase">Virtually Locked in Queue:</span>
                <span className={`font-black ${isOverAllocated ? 'text-rose-400' : 'text-amber-300'}`}>
                  {totalAllocatedTokens.toLocaleString()} / {tokenQuantity.toLocaleString()} NXBC
                </span>
              </div>
              
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-300">Free to Trade (Hold in Wallet):</span>
                <span className="text-emerald-400 font-bold">
                  {remainingTokens.toLocaleString()} NXBC ({tokenQuantity > 0 ? Math.round((remainingTokens / tokenQuantity) * 100) : 0}%)
                </span>
              </div>

              {totalPhaseUsdReturn > 0 && (
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-purple-500/20">
                  <span className="text-amber-200/90 font-sans font-semibold">Projected Wallet Swap Value:</span>
                  <span className="text-emerald-400 font-black font-mono-crypto text-xs">
                    +${totalPhaseUsdReturn.toLocaleString()} USD
                  </span>
                </div>
              )}
            </div>

            {isOverAllocated && (
              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Allocated coins ({totalAllocatedTokens.toLocaleString()}) exceed purchased coins ({tokenQuantity.toLocaleString()}). Please reduce amounts.
                </span>
              </div>
            )}

            {paymentStatusText && (
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono-crypto flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                <span>{paymentStatusText}</span>
              </div>
            )}

            {txErrorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-[10px] text-rose-200 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{txErrorMessage}</span>
              </div>
            )}

            {/* Actions: Back & Confirm Purchase */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-rajdhani font-bold transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                disabled={isProcessing || isOverAllocated || totalAllocatedTokens === 0 || isInsufficientBalance}
                onClick={handleFinalConfirmBuy}
                className={`col-span-2 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  isOverAllocated || totalAllocatedTokens === 0 || isInsufficientBalance
                    ? 'bg-purple-950/60 text-purple-400/50 border border-purple-800/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-fuchsia-600 hover:opacity-95 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Processing Blockchain Tx...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm & Pay ${usdValue.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
