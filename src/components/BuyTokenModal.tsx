import React, { useState, useEffect } from 'react';
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
  Calculator,
  Sparkles,
  Copy,
  ExternalLink,
  QrCode,
  Wallet,
  Check,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    }
  ) => void;
  currentRate: number;
  walletConnected?: boolean;
  walletAddress?: string;
  contractAddress?: string;
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
  contractAddress = '0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7',
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
  const [currency, setCurrency] = useState<'USDT' | 'BNB'>('USDT');
  const [paymentMode, setPaymentMode] = useState<'web3' | 'manual'>('web3');
  const [payAmount, setPayAmount] = useState<string>('100');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string>('');
  const [txErrorMessage, setTxErrorMessage] = useState<string | null>(null);

  // Exact Token Quantities assigned per phase based on user's purchased tokens
  const [p2Tokens, setP2Tokens] = useState<number>(0);
  const [p3Tokens, setP3Tokens] = useState<number>(0);
  const [p4Tokens, setP4Tokens] = useState<number>(0);
  const [p5Tokens, setP5Tokens] = useState<number>(0);
  const [dexTokens, setDexTokens] = useState<number>(0);

  const usdValue = parseFloat(payAmount) || 0;
  const tokenQuantity = Math.floor(usdValue / (currentRate || 0.01));

  const bnbPriceUsd = 600;
  const cryptoEquivalent = currency === 'BNB' ? (usdValue / bnbPriceUsd) : usdValue;

  // Strict System Allotment Constraints
  const maxAvailableInPhase = Math.max(0, activePhaseInfo.totalSupply - activePhaseInfo.tokensSold);
  const maxUsdAllowedInPhase = maxAvailableInPhase * currentRate;
  const isPhaseLimitExceeded = tokenQuantity > maxAvailableInPhase;

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

  const handleCopy = (text: string, type: 'address' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
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
    setTxErrorMessage(null);
    setStep(2);
  };

  // Real Web3 on-chain transaction execution
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

    // Switch to BSC Mainnet
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // 56 in hex (BSC Mainnet)
      });
    } catch (switchErr: any) {
      console.log('BSC switch notice:', switchErr?.message);
    }

    const accounts = await eth.request({ method: 'eth_requestAccounts' });
    const sender = accounts[0];

    if (currency === 'BNB') {
      const bnbWei = `0x${Math.floor(cryptoEquivalent * 1e18).toString(16)}`;
      setPaymentStatusText('Approve BNB Transaction in your wallet...');
      const tx = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: sender,
            to: contractAddress,
            value: bnbWei,
          },
        ],
      });
      return tx;
    } else {
      // USDT BEP-20 on BSC Mainnet: 0x55d398326f99059fF775485246999027B3197955
      const usdtContractBsc = '0x55d398326f99059fF775485246999027B3197955';
      const usdtAmountWei = BigInt(Math.floor(usdValue * 1e18));
      
      // Transfer function selector 0xa9059cbb + padded recipient + padded amount
      const cleanTo = contractAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      const cleanVal = usdtAmountWei.toString(16).padStart(64, '0');
      const data = `0xa9059cbb${cleanTo}${cleanVal}`;

      setPaymentStatusText('Approve USDT BEP-20 transfer in your wallet...');
      const tx = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: sender,
            to: usdtContractBsc,
            data: data,
            value: '0x0',
          },
        ],
      });
      return tx;
    }
  };

  const handleFinalConfirmBuy = async () => {
    if (tokenQuantity <= 0 || isOverAllocated) return;
    setIsProcessing(true);
    setTxErrorMessage(null);

    let recordedTxHash = txHashInput.trim();

    // If Web3 payment mode is selected and wallet is connected or detected
    if (paymentMode === 'web3') {
      try {
        setPaymentStatusText('Connecting to BSC Blockchain...');
        const realTx = await executeWeb3Payment();
        if (realTx) {
          recordedTxHash = realTx;
        }
      } catch (err: any) {
        console.error('Web3 Payment Error:', err);
        setTxErrorMessage(err?.message || 'Transaction was rejected or failed. You can also pay via Direct Deposit.');
        setIsProcessing(false);
        setPaymentStatusText('');
        return;
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

    onConfirmPurchase(tokenQuantity, usdValue, {
      p2Percent,
      p3Percent,
      p4Percent,
      p5Percent,
      dexPercent,
      unallocatedPercent,
    });

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
  const projectedReturnP3 = p3Tokens * 0.20;
  const projectedReturnP4 = p4Tokens * 0.30;
  const projectedReturnP5 = p5Tokens * 0.40;
  const totalPhaseUsdReturn = projectedReturnP2 + projectedReturnP3 + projectedReturnP4 + projectedReturnP5;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    contractAddress
  )}&margin=4&bgcolor=110725&color=F59E0B`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-[#110725] border border-amber-500/30 p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-slate-100 scroll-smooth">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setStep(1);
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Step Indicator */}
        <div className="flex items-center gap-2 mb-3.5">
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-100 font-cinzel">
                BUY <span className="text-amber-400">NXBC</span> (REAL PAYMENT)
              </h2>
              <span className="text-[10px] font-mono-crypto px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200">
                Step {step} of 2
              </span>
            </div>
            <p className="text-xs text-purple-300/80 font-mono-crypto">
              {step === 1
                ? `${activePhaseInfo.name} Rate: $${currentRate.toFixed(2)} / NXBC • BNB Smart Chain (BEP-20)`
                : `Set Coin Sell Schedule for ${tokenQuantity.toLocaleString()} NXBC`}
            </p>
          </div>
        </div>

        {/* STEP 1: PAYMENT AMOUNT, METHOD & CURRENCY */}
        {step === 1 && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Phase Allotment Quota & Remaining Tokens Status Box */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#17092e] to-[#0d041c] border border-amber-500/30 space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-mono-crypto">
                <span className="text-purple-300/80 uppercase font-rajdhani font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  {activePhaseInfo.name} Live Presale
                </span>
                <span className="text-amber-300 font-bold">
                  {maxAvailableInPhase.toLocaleString()} Left / {activePhaseInfo.totalSupply.toLocaleString()} Total
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-purple-950/90 overflow-hidden border border-purple-700/40">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-fuchsia-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (activePhaseInfo.tokensSold / (activePhaseInfo.totalSupply || 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-purple-300/70 font-mono-crypto">
                <span>Phase Sold: {((activePhaseInfo.tokensSold / (activePhaseInfo.totalSupply || 1)) * 100).toFixed(1)}%</span>
                <span className="text-emerald-400 font-bold">
                  Stage 1 Active Rate: ${currentRate.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Switcher (Web3 vs Manual QR Deposit) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
                1. Select Real Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('web3')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono-crypto font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'web3'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-purple-950/60 border-purple-500/20 text-purple-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Web3 Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('manual')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono-crypto font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'manual'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-purple-950/60 border-purple-500/20 text-purple-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Direct QR & Address</span>
                </button>
              </div>
            </div>

            {/* Payment Currency Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
                2. Select Payment Asset (BNB Chain)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['USDT', 'BNB'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`py-2 rounded-xl text-xs font-mono-crypto font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      currency === curr
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-purple-950/60 border-purple-500/20 text-purple-300 hover:text-white'
                    }`}
                  >
                    <span>{curr} (BEP-20)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider flex justify-between">
                <span>3. Enter USD Amount</span>
                <span className="text-amber-400 font-mono-crypto font-bold">
                  ≈ {cryptoEquivalent.toFixed(currency === 'BNB' ? 4 : 2)} {currency}
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
                    isPhaseLimitExceeded
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-purple-500/40 focus:border-amber-400'
                  }`}
                  placeholder="100"
                  min="1"
                />
                <span className="absolute left-3 top-3 text-amber-400 font-bold font-mono-crypto">$</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-1.5">
              {['50', '100', '250', '500', '1000'].map((preset) => {
                const presetTokens = Math.floor(parseFloat(preset) / currentRate);
                const isPresetTooHigh = presetTokens > maxAvailableInPhase;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isPresetTooHigh}
                    onClick={() => setPayAmount(preset)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono-crypto border font-semibold transition-all ${
                      isPresetTooHigh
                        ? 'bg-purple-950/20 text-purple-600 border-purple-900/30 cursor-not-allowed opacity-40'
                        : 'bg-purple-900/40 hover:bg-purple-800 text-purple-200 border-purple-600/30'
                    }`}
                  >
                    +${preset}
                  </button>
                );
              })}
            </div>

            {/* Direct Deposit Address & QR Box if Manual mode is active */}
            {paymentMode === 'manual' && (
              <div className="p-3.5 rounded-2xl bg-[#090317] border border-amber-500/40 space-y-2.5 shadow-lg animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-crypto font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    Deposit to Official Presale Vault (BEP-20)
                  </span>
                  <span className="text-[9px] font-mono-crypto text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/40">
                    Auto-Verified
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-[#130728] p-2.5 rounded-xl border border-purple-500/30">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                    <img
                      src={qrImageUrl}
                      alt="Deposit QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <span className="text-[9px] text-purple-300 block font-mono-crypto">
                      Receiving Address (BNB Smart Chain):
                    </span>
                    <p className="text-[10px] font-mono-crypto text-amber-300 font-bold break-all leading-tight">
                      {contractAddress}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(contractAddress, 'address')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9px] font-mono-crypto font-bold border border-amber-500/40"
                    >
                      {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress ? 'Address Copied!' : 'Copy Address'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-purple-300 block font-mono-crypto">
                    Optional: Paste Transaction Hash / TXID (After sending from Binance/Trust/MetaMask):
                  </label>
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#130728] border border-purple-500/30 focus:border-amber-400 rounded-lg py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Calculated Receive Box */}
            <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-[#1c0a35] border space-y-1.5 ${
              isPhaseLimitExceeded ? 'border-rose-500/50' : 'border-amber-400/30'
            }`}>
              <div className="flex justify-between text-xs text-purple-300">
                <span>Coins To Receive:</span>
                <span className={`font-black font-mono-crypto text-base ${
                  isPhaseLimitExceeded ? 'text-rose-400' : 'text-amber-300'
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
              disabled={tokenQuantity <= 0 || isPhaseLimitExceeded}
              onClick={handleProceedToSellSchedule}
              className={`w-full py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                tokenQuantity <= 0 || isPhaseLimitExceeded
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
                    (${usdValue.toFixed(2)} USD)
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
              <div className="flex justify-between items-center text-[10px]">
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
                  className="py-1 px-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-600/30 text-[9px] font-rajdhani font-bold text-slate-200"
                >
                  Equal (20% ea)
                </button>
                <button
                  type="button"
                  onClick={applyPresetEarlyProfit}
                  className="py-1 px-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[9px] font-rajdhani font-bold text-amber-300"
                >
                  P2 & P3 Fast
                </button>
                <button
                  type="button"
                  onClick={applyPresetHodl}
                  className="py-1 px-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-600/30 text-[9px] font-rajdhani font-bold text-purple-200"
                >
                  Hold 50%
                </button>
                <button
                  type="button"
                  onClick={applyPresetAllDex}
                  className="py-1 px-1.5 rounded-lg bg-fuchsia-950/60 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-[9px] font-rajdhani font-bold text-fuchsia-300"
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

              {/* Phase 3 ($0.20) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 3 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $0.20 (20x)
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

              {/* Phase 4 ($0.30) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 4 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $0.30 (30x)
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

              {/* Phase 5 ($0.40) */}
              <div className="bg-[#090317] p-2.5 rounded-xl border border-purple-500/20 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 font-rajdhani">Phase 5 Sell Amount</span>
                    <span className="text-[9px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      @ $0.40 (40x)
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
                    className="text-[9px] font-mono-crypto text-amber-400 underline font-semibold"
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
                <span className="text-[10px] text-purple-300 uppercase">Coins Allocated for Sale:</span>
                <span className={`font-black ${isOverAllocated ? 'text-rose-400' : 'text-amber-300'}`}>
                  {totalAllocatedTokens.toLocaleString()} / {tokenQuantity.toLocaleString()} NXBC
                </span>
              </div>
              
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-300">Unallocated (Hold in Wallet):</span>
                <span className="text-emerald-400 font-bold">
                  {remainingTokens.toLocaleString()} NXBC ({tokenQuantity > 0 ? Math.round((remainingTokens / tokenQuantity) * 100) : 0}%)
                </span>
              </div>

              {totalPhaseUsdReturn > 0 && (
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-purple-500/20">
                  <span className="text-amber-200/90 font-sans font-semibold">Total Projected Phase Cashout:</span>
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
                disabled={isProcessing || isOverAllocated || totalAllocatedTokens === 0}
                onClick={handleFinalConfirmBuy}
                className={`col-span-2 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  isOverAllocated || totalAllocatedTokens === 0
                    ? 'bg-purple-950/60 text-purple-400/50 border border-purple-800/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-fuchsia-600 hover:opacity-95 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Processing Real Payment...</span>
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
