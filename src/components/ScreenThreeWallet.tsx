import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  Lock,
  AlertCircle,
  Coins,
  Sparkles,
  Layers,
  TrendingUp,
  Percent,
  ArrowUpRight,
  HelpCircle,
  Check,
  FileText,
  ChevronRight,
  Database,
  Info,
} from 'lucide-react';
import { Transaction, AllocationState, TokenSellLedgerItem } from '../types/crypto';
import {
  ADMIN_TREASURY_WALLET,
  returnNxbcTokensToAdmin,
  signWithdrawRequest,
} from '../utils/web3Helper';
import confetti from 'canvas-confetti';

interface ScreenThreeWalletProps {
  walletConnected: boolean;
  walletAddress: string;
  claimableBalanceUsd?: number;
  tokenSellBalanceUsd?: number;
  mlmBalanceUsd?: number;
  allocation?: AllocationState;
  levelIncomeUsd?: number;
  matrixIncomeUsd?: number;
  transactions: Transaction[];
  onWithdraw: (amountUsd: number, walletType: 'token_sell' | 'mlm', txHash?: string) => void;
  onToggleWallet: () => void;
  onOpenWalletModal: () => void;
  
  
  usdtBalance?: number;
  withdrawalFeePercent?: number;
}

export const ScreenThreeWallet: React.FC<ScreenThreeWalletProps> = ({
  walletConnected,
  walletAddress,
  tokenSellBalanceUsd = 0,
  mlmBalanceUsd = 0,
  allocation,
  levelIncomeUsd = 0,
  matrixIncomeUsd = 0,
  transactions,
  onWithdraw,
  onToggleWallet,
  onOpenWalletModal,
  
  
  usdtBalance = 0,
  withdrawalFeePercent = 0,
}) => {
  // Active Wallet Tab: 'token_sell' or 'mlm'
  const [activeTab, setActiveTab] = useState<'token_sell' | 'mlm'>('token_sell');

  // Token Sell Withdrawal State
  const [tokenSellWithdrawAmount, setTokenSellWithdrawAmount] = useState<string>('0.00');

  // MLM Withdrawal State
  const [mlmWithdrawAmount, setMlmWithdrawAmount] = useState<string>(
    mlmBalanceUsd > 0 ? mlmBalanceUsd.toFixed(2) : '0.00'
  );

  // Internal Ledger State for Connected Trust Wallet
  const [ledgerEntries, setLedgerEntries] = useState<TokenSellLedgerItem[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState<boolean>(false);
  const [showLedgerDrawer, setShowLedgerDrawer] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    gross: number;
    fee: number;
    net: number;
    txHash: string;
    tokensReturned?: number;
    walletType: string;
    phaseBreakdown?: Array<{ phaseIndex: number; phaseName: string; tokensToReturn: number; grossDeducted: number }>;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch or Synchronize Phase-by-Phase Token Sell Ledger for Connected Wallet
  const fetchLedger = async () => {
    if (!walletAddress) return;
    setIsLoadingLedger(true);
    try {
      const res = await fetch(`/api/wallet/token-sell-ledger?walletAddress=${encodeURIComponent(walletAddress)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          setLedgerEntries(data.entries);
        } else {
          // Generate default phase ledger representation from allocation state or default phase records
          const defaultEntries: TokenSellLedgerItem[] = [];
          if (allocation) {
            if ((allocation.p2Tokens?.sold || 0) > 0) {
              const sold = allocation.p2Tokens!.sold;
              defaultEntries.push({
                id: 'ledger-p2-init',
                phaseIndex: 2,
                phaseName: 'Phase 2 ($0.10)',
                tokenPrice: 0.10,
                tokensSold: sold,
                tokensReturned: 0,
                grossUsdt: sold * 0.10,
                withdrawnUsdt: 0,
                availableUsdt: sold * 0.10,
                status: 'unclaimed',
                timestamp: 'Active Phase',
              });
            }
            if ((allocation.p3Tokens?.sold || 0) > 0) {
              const sold = allocation.p3Tokens!.sold;
              defaultEntries.push({
                id: 'ledger-p3-init',
                phaseIndex: 3,
                phaseName: 'Phase 3 ($1.00)',
                tokenPrice: 1.00,
                tokensSold: sold,
                tokensReturned: 0,
                grossUsdt: sold * 1.00,
                withdrawnUsdt: 0,
                availableUsdt: sold * 1.00,
                status: 'unclaimed',
                timestamp: 'Active Phase',
              });
            }
            if ((allocation.p4Tokens?.sold || 0) > 0) {
              const sold = allocation.p4Tokens!.sold;
              defaultEntries.push({
                id: 'ledger-p4-init',
                phaseIndex: 4,
                phaseName: 'Phase 4 ($10.00)',
                tokenPrice: 10.00,
                tokensSold: sold,
                tokensReturned: 0,
                grossUsdt: sold * 10.00,
                withdrawnUsdt: 0,
                availableUsdt: sold * 10.00,
                status: 'unclaimed',
                timestamp: 'Upcoming Phase',
              });
            }
            if ((allocation.p5Tokens?.sold || 0) > 0) {
              const sold = allocation.p5Tokens!.sold;
              defaultEntries.push({
                id: 'ledger-p5-init',
                phaseIndex: 5,
                phaseName: 'Phase 5 ($100.00)',
                tokenPrice: 100.00,
                tokensSold: sold,
                tokensReturned: 0,
                grossUsdt: sold * 100.00,
                withdrawnUsdt: 0,
                availableUsdt: sold * 100.00,
                status: 'unclaimed',
                timestamp: 'Upcoming Phase',
              });
            }
          }

          // Never invent ledger rows in production. Empty means there are no database-backed sell settlements.

          setLedgerEntries(defaultEntries);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [walletAddress, tokenSellBalanceUsd]);

  // Compute total available from ledger entries or fallback
  const ledgerTotalAvailableGross = ledgerEntries
    .filter((e) => e.status !== 'fully_claimed')
    .reduce((acc, curr) => acc + (curr.availableUsdt || (curr.grossUsdt - curr.withdrawnUsdt)), 0);

  // Security: token-sell withdrawals are backed only by the phase ledger. Do not
  // let a cached/global balance bypass the exact token-return calculation.
  const effectiveTokenSellBalance = ledgerTotalAvailableGross;

  useEffect(() => {
    if (effectiveTokenSellBalance > 0) {
      setTokenSellWithdrawAmount(effectiveTokenSellBalance.toFixed(2));
    } else {
      setTokenSellWithdrawAmount('0.00');
    }
  }, [effectiveTokenSellBalance]);

  useEffect(() => {
    if (mlmBalanceUsd > 0) {
      setMlmWithdrawAmount(mlmBalanceUsd.toFixed(2));
    } else {
      setMlmWithdrawAmount('0.00');
    }
  }, [mlmBalanceUsd]);

  const pastTransactions = transactions.filter((t) => t.status === 'completed');

  // Total Sold Tokens Across Phases
  const totalSoldTokens = ledgerEntries.reduce((acc, curr) => acc + curr.tokensSold, 0) ||
    ((allocation?.p2Tokens?.sold || 0) +
      (allocation?.p3Tokens?.sold || 0) +
      (allocation?.p4Tokens?.sold || 0) +
      (allocation?.p5Tokens?.sold || 0));

  // FIFO Phase-by-Phase Token Return Calculation
  const grossSellAmount = parseFloat(tokenSellWithdrawAmount) || 0;

  const calculatePhaseSettlementBreakdown = (amountToWithdraw: number) => {
    let remainingToDeduct = amountToWithdraw;
    const breakdown: Array<{
      phaseIndex: number;
      phaseName: string;
      tokensToReturn: number;
      grossDeducted: number;
      tokenPrice: number;
    }> = [];
    let totalTokensToReturn = 0;

    const activeEntries = ledgerEntries.filter((e) => e.status === 'unclaimed' || e.status === 'partially_claimed');

    if (activeEntries.length > 0) {
      for (const entry of activeEntries) {
        if (remainingToDeduct <= 0) break;
        const entryAvail = entry.availableUsdt || (entry.grossUsdt - entry.withdrawnUsdt);
        const deduct = Math.min(entryAvail, remainingToDeduct);
        if (deduct > 0) {
          const tokens = (deduct / entry.grossUsdt) * entry.tokensSold;
          breakdown.push({
            phaseIndex: entry.phaseIndex,
            phaseName: entry.phaseName,
            tokensToReturn: Math.round(tokens * 100) / 100,
            grossDeducted: deduct,
            tokenPrice: entry.tokenPrice,
          });
          totalTokensToReturn += tokens;
          remainingToDeduct -= deduct;
        }
      }
    }

    return {
      breakdown,
      totalTokensToReturn: Math.round(totalTokensToReturn * 1e18) / 1e18,
    };
  };

  const calculatedSettlement = calculatePhaseSettlementBreakdown(grossSellAmount);
  const exactTokensToReturn = calculatedSettlement.totalTokensToReturn;

  // Live admin-configured withdrawal fee (never hardcoded in the UI)
  const safeFeePercent = Math.max(0, Math.min(100, Number(withdrawalFeePercent) || 0));
  const sellFee = grossSellAmount * (safeFeePercent / 100);
  const sellNet = Math.max(0, grossSellAmount - sellFee);

  // Live admin-configured withdrawal fee for MLM
  const grossMlmAmount = parseFloat(mlmWithdrawAmount) || 0;
  const mlmFee = grossMlmAmount * (safeFeePercent / 100);
  const mlmNet = Math.max(0, grossMlmAmount - mlmFee);

  // Handle Token Sell Withdrawal with Exact On-Chain Token Return to Admin Treasury
  const handleWithdrawTokenSell = async () => {
    setErrorMessage(null);
    const parsedAmount = parseFloat(tokenSellWithdrawAmount) || 0;

    if (parsedAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount greater than $0.00.');
      return;
    }

    if (!walletConnected) {
      onOpenWalletModal();
      return;
    }

    if (effectiveTokenSellBalance <= 0) {
      setErrorMessage(
        'Insufficient Token Sell Balance ($0.00)! Only proceeds from completed Phase Auto-Sell (P2–P5 only) accumulate here.'
      );
      return;
    }

    if (parsedAmount > effectiveTokenSellBalance) {
      setErrorMessage(
        `Insufficient Token Sell Balance! Available: $${effectiveTokenSellBalance.toFixed(2)} USDT, Requested: $${parsedAmount.toFixed(2)} USDT.`
      );
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Step 1/3: Returning exactly ${exactTokensToReturn.toLocaleString()} NXBC to the verified Admin Wallet...`);

    try {
      let tokenReturnTxHash = '';
      const tokensToReturn = exactTokensToReturn;

      // Check if Web3 Ethereum window is available for on-chain return
      const hasWeb3 =
        typeof window !== 'undefined' &&
        ((window as any).trustwallet?.ethereum ||
          (window as any).ethereum ||
          (window as any).binancew3w?.ethereum);

      if (!hasWeb3 || tokensToReturn <= 0) {
        throw new Error('A connected BSC wallet is required. The withdrawal cannot continue without a real NXBC return transaction.');
      }

      setStatusMessage(
        `Step 1/3: Confirming transfer of exactly ${tokensToReturn.toLocaleString()} NXBC to Admin Treasury...`
      );
      const returnResult = await returnNxbcTokensToAdmin(
        tokensToReturn,
        walletAddress,
        (msg) => setStatusMessage(msg),
        ADMIN_TREASURY_WALLET
      );

      if (!returnResult.success || !returnResult.txHash) {
        throw new Error(returnResult.error || 'NXBC return was not confirmed on-chain. No USDT will be released.');
      }
      tokenReturnTxHash = returnResult.txHash;

      setStatusMessage('Step 2/3: Server is verifying the exact NXBC Transfer event on BSC...');
      const auth = await signWithdrawRequest(walletAddress, parsedAmount, 'token_sell');
      setStatusMessage(`Step 3/3: Applying ${safeFeePercent}% admin fee and dispatching verified USDT payout...`);

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          amountUsdt: parsedAmount,
          walletType: 'token_sell',
          tokenReturnTxHash,
          tokensReturned: tokensToReturn,
          signature: auth.signature,
          timestamp: auth.timestamp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Token Sell withdrawal rejected by system.');
      }

      if (!data.txHash) throw new Error('Payout server did not return a real BSC transaction hash.');
      const confirmedHash = data.txHash;

      onWithdraw(parsedAmount, 'token_sell', confirmedHash);
      setIsProcessing(false);
      setStatusMessage('');
      setSuccessDetails({
        gross: parsedAmount,
        fee: data.serviceFee || parsedAmount * (safeFeePercent / 100),
        net: data.netPayout || parsedAmount * (1 - safeFeePercent / 100),
        txHash: confirmedHash,
        tokensReturned: tokensToReturn,
        walletType: 'Token Auto-Sell Settlement',
        phaseBreakdown: data.phaseBreakdown || calculatedSettlement.breakdown,
      });
      setShowSuccessNotification(true);
      setTokenSellWithdrawAmount('0.00');
      fetchLedger();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#E879F9'],
      });
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setIsProcessing(false);
      setStatusMessage('');
      setErrorMessage(err?.message || 'Withdrawal failed. Please check available token sell balance.');
    }
  };

  // Handle MLM Earnings Withdrawal with the live Admin-configured service fee
  const handleWithdrawMlm = async () => {
    setErrorMessage(null);
    const parsedAmount = parseFloat(mlmWithdrawAmount) || 0;

    if (parsedAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount greater than $0.00.');
      return;
    }

    if (!walletConnected) {
      onOpenWalletModal();
      return;
    }

    if (mlmBalanceUsd <= 0) {
      setErrorMessage(
        'Insufficient MLM Balance ($0.00)! Only commissions from Direct Referrals (10%), 10-Level Unilevel, and 2x10 Matrix accumulate here.'
      );
      return;
    }

    if (parsedAmount > mlmBalanceUsd) {
      setErrorMessage(
        `Insufficient MLM Balance! Available: $${mlmBalanceUsd.toFixed(2)} USDT, Requested: $${parsedAmount.toFixed(2)} USDT.`
      );
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Authorizing withdrawal and applying ${safeFeePercent}% Service Fee...`);

    try {
      const auth = await signWithdrawRequest(walletAddress, parsedAmount, 'mlm');
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          amountUsdt: parsedAmount,
          walletType: 'mlm',
          signature: auth.signature,
          timestamp: auth.timestamp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'MLM withdrawal rejected by system.');
      }

      if (!data.txHash) throw new Error('Payout server did not return a real BSC transaction hash.');
      const confirmedHash = data.txHash;

      onWithdraw(parsedAmount, 'mlm', confirmedHash);
      setIsProcessing(false);
      setStatusMessage('');
      setSuccessDetails({
        gross: parsedAmount,
        fee: data.serviceFee || parsedAmount * (safeFeePercent / 100),
        net: data.netPayout || parsedAmount * (1 - safeFeePercent / 100),
        txHash: confirmedHash,
        walletType: 'MLM Affiliate & Community Earnings',
      });
      setShowSuccessNotification(true);
      setMlmWithdrawAmount('0.00');

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#E879F9'],
      });
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setIsProcessing(false);
      setStatusMessage('');
      setErrorMessage(err?.message || 'Withdrawal failed. Please check available MLM balance.');
    }
  };

  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2.5 pb-2">
      {/* 1. Header Hero Bar */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#120b19_100%)] shadow-[0_0_28px_rgba(245,158,11,0.08)] p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-[14px] bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
              <Wallet className="w-5.5 h-5.5 text-amber-300" strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">
                Multi-Wallet Settlement & Withdrawal
              </h1>
              <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-0.5 truncate">
                {safeFeePercent}% Service Fee • Verified Smart Settlement & Collateral Return
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowLedgerDrawer(!showLedgerDrawer)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-[9px] font-mono-crypto text-amber-300 cursor-pointer transition-all"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit Ledger</span>
            </button>
            <div className="flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[9px] text-emerald-300 font-mono-crypto font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>BEP-20 Instant</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Global Dynamic Service Fee Policy Banner */}
      <section className="rounded-[18px] bg-[#050b16]/75 border border-white/10 p-2.5 sm:p-3 flex items-center justify-between text-[9.5px]">
        <div className="flex items-center gap-2.5">
          <div className="px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold font-mono-crypto text-xs">
            {safeFeePercent}%
          </div>
          <div>
            <span className="font-bold text-slate-100 font-rajdhani uppercase tracking-wider block text-[11px]">
              Universal Platform Service Charge
            </span>
            <span className="text-slate-400 font-mono-crypto text-[8.5px]">
              Dynamic fee controlled by the Contract and applied to the gross withdrawal amount.
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 font-mono-crypto text-[8.5px] font-bold">
            Auto-Deducted
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 2 DISTINCT DEDICATED WALLETS SELECTOR TAB                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-[18px] bg-[#050b16]/85 border border-white/10">
        {/* Tab 1: Token Auto-Sell Settlement Wallet */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('token_sell');
            setErrorMessage(null);
          }}
          className={`py-2.5 px-2 rounded-[14px] text-center transition-all cursor-pointer ${
            activeTab === 'token_sell'
              ? 'bg-gradient-to-r from-amber-500/20 via-[#071426] to-amber-500/15 border-2 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase font-rajdhani">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Token Sell Wallet</span>
          </div>
          <span className="text-sm font-black font-mono-crypto text-amber-300 block mt-0.5">
            ${effectiveTokenSellBalance.toFixed(2)} USDT
          </span>
          <span className="text-[7.5px] font-mono-crypto text-slate-400 block">
            Auto-Sell Proceeds Only
          </span>
        </button>

        {/* Tab 2: MLM & Referral Earnings Wallet */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('mlm');
            setErrorMessage(null);
          }}
          className={`py-2.5 px-2 rounded-[14px] text-center transition-all cursor-pointer ${
            activeTab === 'mlm'
              ? 'bg-gradient-to-r from-emerald-500/20 via-[#071426] to-emerald-500/15 border-2 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase font-rajdhani">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>MLM Earnings Wallet</span>
          </div>
          <span className="text-sm font-black font-mono-crypto text-emerald-400 block mt-0.5">
            ${mlmBalanceUsd.toFixed(2)} USDT
          </span>
          <span className="text-[7.5px] font-mono-crypto text-slate-400 block">
            Level + Direct + Matrix
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* WALLET 1: TOKEN AUTO-SELL SETTLEMENT GATEWAY (WITH PHASE LEDGER & DYNAMIC FEE) */}
      {/* ========================================================================= */}
      {activeTab === 'token_sell' && (
        <div className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)] p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white font-rajdhani uppercase tracking-wider text-amber-300">
                  TOKEN AUTO-SELL SETTLEMENT WALLET
                </h2>
                <p className="text-[8.5px] text-slate-400 font-mono-crypto">
                  Phase Auto-Sell Proceeds • {safeFeePercent}% Service Fee • FIFO Collateral Return
                </p>
              </div>
            </div>
          </div>

          {/* Balance Hero Box */}
          <div className="p-3 rounded-[18px] bg-[#050b16]/75 border border-amber-400/20 flex items-center justify-between">
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase font-mono-crypto block">
                Withdrawable Token Sell Revenue
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono-crypto gold-gradient-text">
                  ${effectiveTokenSellBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono-crypto">USDT</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8.5px] text-slate-400 font-mono-crypto block">Total Tokens Sold:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono-crypto">
                {totalSoldTokens.toLocaleString()} NXBC
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHASE-BY-PHASE INTERNAL LEDGER SUMMARY TABLE                              */}
          {/* ========================================================================= */}
          <div className="p-3 rounded-[16px] bg-[#050b16]/85 border border-amber-400/25 space-y-2 text-[9px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono-crypto">
                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Phase-Wise Auto-Sell & Return Ledger</span>
              </div>
              <span className="text-[8px] font-mono-crypto text-emerald-300">
                Wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
              </span>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="p-2 text-center text-[8.5px] font-mono-crypto text-slate-400">
                No active phase auto-sell sales recorded yet. Once tokens are sold in P2–P5, they will appear here with exact return collateral.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {ledgerEntries.map((entry) => {
                  const avail = entry.availableUsdt || (entry.grossUsdt - entry.withdrawnUsdt);
                  const isClaimed = entry.status === 'fully_claimed' || avail <= 0;
                  return (
                    <div
                      key={entry.id}
                      className={`p-2 rounded-xl border flex items-center justify-between font-mono-crypto text-[8.5px] ${
                        isClaimed
                          ? 'bg-[#050b16]/40 border-white/5 opacity-60'
                          : 'bg-[#081426]/70 border-amber-400/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{entry.phaseName}</span>
                          <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                            @{entry.tokenPrice.toFixed(2)} USDT
                          </span>
                        </div>
                        <span className="text-slate-400 block text-[7.5px] mt-0.5">
                          Sold: <strong className="text-amber-300">{entry.tokensSold} NXBC</strong> → Gross:{' '}
                          <strong className="text-emerald-400">${entry.grossUsdt.toFixed(2)} USDT</strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold block ${
                            isClaimed ? 'text-slate-400' : 'text-emerald-400'
                          }`}
                        >
                          ${avail.toFixed(2)} Available
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">
                          Return Collateral: {entry.tokensSold} NXBC
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex justify-between">
              <span>Withdraw Amount (USDT)</span>
              <span
                className={`font-mono-crypto font-bold ${
                  effectiveTokenSellBalance > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                Available: ${effectiveTokenSellBalance.toFixed(2)}
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                value={tokenSellWithdrawAmount}
                onChange={(e) => {
                  setTokenSellWithdrawAmount(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={effectiveTokenSellBalance <= 0}
                className={`w-full bg-[#050b16]/90 border rounded-xl py-2 px-3 pl-8 text-sm font-mono-crypto font-bold focus:outline-none focus:ring-1 ${
                  parseFloat(tokenSellWithdrawAmount) > effectiveTokenSellBalance &&
                  parseFloat(tokenSellWithdrawAmount) > 0
                    ? 'border-rose-500/60 text-rose-300 focus:ring-rose-500'
                    : 'border-amber-400/40 focus:border-amber-400 text-slate-100 focus:ring-amber-400'
                } ${effectiveTokenSellBalance <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="0.00"
                min="0"
                max={effectiveTokenSellBalance}
                step="0.01"
              />
              <span className="absolute left-3 text-amber-400 font-bold font-mono-crypto">$</span>
              <button
                type="button"
                disabled={effectiveTokenSellBalance <= 0}
                onClick={() => {
                  setTokenSellWithdrawAmount(effectiveTokenSellBalance.toFixed(2));
                  setErrorMessage(null);
                }}
                className={`absolute right-2 px-2.5 py-1 rounded-lg border text-[9px] font-mono-crypto font-bold ${
                  effectiveTokenSellBalance > 0
                    ? 'bg-amber-400/15 hover:bg-amber-400/25 border-amber-400/40 text-amber-300 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Live Dynamic Settlement Breakdown & Exact Return Receipt */}
          {grossSellAmount > 0 && (
            <div className="p-3 rounded-[16px] bg-[#050b16]/90 border border-amber-400/30 space-y-1.5 font-mono-crypto text-[9.5px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="font-bold text-amber-300 text-[10px]">Settlement & Return Calculation</span>
                <span className="text-emerald-400 text-[8.5px]">Verified Internal Ledger</span>
              </div>

              {/* Phase Breakdown List */}
              {calculatedSettlement.breakdown.length > 0 && (
                <div className="p-2 rounded-xl bg-amber-400/5 border border-amber-400/20 space-y-1 text-[8.5px]">
                  <span className="text-slate-300 font-bold block">Phase Source Breakdown:</span>
                  {calculatedSettlement.breakdown.map((b, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>
                        • {b.phaseName}: ${b.grossDeducted.toFixed(2)} USDT
                      </span>
                      <span className="text-amber-300 font-bold">
                        → Return {b.tokensToReturn.toLocaleString()} NXBC
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-slate-300 pt-0.5">
                <span>Gross Withdrawal Request:</span>
                <span className="text-slate-100 font-bold">${grossSellAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Platform Service Charge ({safeFeePercent}%):</span>
                <span>-${sellFee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Total Exact Tokens to Return to Admin:</span>
                <span className="font-bold">{exactTokensToReturn.toLocaleString()} NXBC</span>
              </div>
              <div className="border-t border-white/10 pt-1 flex justify-between font-bold text-xs text-emerald-400">
                <span>Net USDT Dispatched to Trust Wallet:</span>
                <span>${sellNet.toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          {/* Primary Button */}
          <button
            id="withdraw-token-sell-btn"
            disabled={
              isProcessing ||
              effectiveTokenSellBalance <= 0 ||
              grossSellAmount <= 0 ||
              grossSellAmount > effectiveTokenSellBalance
            }
            onClick={handleWithdrawTokenSell}
            className={`w-full py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              isProcessing ||
              effectiveTokenSellBalance <= 0 ||
              grossSellAmount <= 0 ||
              grossSellAmount > effectiveTokenSellBalance
                ? 'bg-[#050b16]/70 text-slate-500 border border-white/10 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] transform active:scale-98 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{statusMessage || 'PROCESSING SETTLEMENT...'}</span>
              </span>
            ) : effectiveTokenSellBalance <= 0 ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                <span>NO WITHDRAWABLE TOKEN SELL BALANCE ($0.00)</span>
              </span>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4 text-slate-950 font-bold" />
                <span>
                  RETURN {exactTokensToReturn.toLocaleString()} TOKENS & WITHDRAW ${sellNet.toFixed(2)} NET USDT
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WALLET 2: MLM & COMMUNITY EARNINGS GATEWAY (WITH DYNAMIC FEE)                 */}
      {/* ========================================================================= */}
      {activeTab === 'mlm' && (
        <div className="relative overflow-hidden rounded-[22px] border border-emerald-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#0a1d17_100%)] shadow-[0_0_28px_rgba(16,185,129,0.08)] p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white font-rajdhani uppercase tracking-wider text-emerald-300">
                  MLM & COMMUNITY EARNINGS WALLET
                </h2>
                <p className="text-[8.5px] text-slate-400 font-mono-crypto">
                  Direct Referral (10%) + 10-Level Unilevel + Matrix 2x10 • {safeFeePercent}% Service Fee
                </p>
              </div>
            </div>
            <span className="text-[8.5px] font-mono-crypto px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 font-bold">
              Community Income
            </span>
          </div>

          {/* Balance Hero */}
          <div className="p-3 rounded-[18px] bg-[#050b16]/75 border border-emerald-400/25 flex items-center justify-between">
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase font-mono-crypto block">
                Available MLM Affiliate Earnings
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono-crypto text-emerald-400">
                  ${mlmBalanceUsd.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-300 font-mono-crypto">USDT</span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[8px] text-slate-400 font-mono-crypto block">
                Level: <strong className="text-amber-300">${levelIncomeUsd.toFixed(2)}</strong>
              </span>
              <span className="text-[8px] text-slate-400 font-mono-crypto block">
                Matrix: <strong className="text-emerald-400">${matrixIncomeUsd.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider flex justify-between">
              <span>Withdraw Amount (USDT)</span>
              <span
                className={`font-mono-crypto font-bold ${
                  mlmBalanceUsd > 0 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                Available: ${mlmBalanceUsd.toFixed(2)}
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                value={mlmWithdrawAmount}
                onChange={(e) => {
                  setMlmWithdrawAmount(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={mlmBalanceUsd <= 0}
                className={`w-full bg-[#050b16]/90 border rounded-xl py-2 px-3 pl-8 text-sm font-mono-crypto font-bold focus:outline-none focus:ring-1 ${
                  parseFloat(mlmWithdrawAmount) > mlmBalanceUsd && parseFloat(mlmWithdrawAmount) > 0
                    ? 'border-rose-500/60 text-rose-300 focus:ring-rose-500'
                    : 'border-emerald-400/40 focus:border-emerald-400 text-slate-100 focus:ring-emerald-400'
                } ${mlmBalanceUsd <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="0.00"
                min="0"
                max={mlmBalanceUsd}
                step="0.01"
              />
              <span className="absolute left-3 text-emerald-400 font-bold font-mono-crypto">$</span>
              <button
                type="button"
                disabled={mlmBalanceUsd <= 0}
                onClick={() => {
                  setMlmWithdrawAmount(mlmBalanceUsd.toFixed(2));
                  setErrorMessage(null);
                }}
                className={`absolute right-2 px-2.5 py-1 rounded-lg border text-[9px] font-mono-crypto font-bold ${
                  mlmBalanceUsd > 0
                    ? 'bg-emerald-400/15 hover:bg-emerald-400/25 border-emerald-400/40 text-emerald-300 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Live Breakdown Receipt Card */}
          {grossMlmAmount > 0 && (
            <div className="p-3 rounded-[16px] bg-[#050b16]/90 border border-emerald-400/25 space-y-1 font-mono-crypto text-[9.5px]">
              <div className="flex justify-between text-slate-300">
                <span>Gross MLM Withdrawal:</span>
                <span className="text-slate-100 font-bold">${grossMlmAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Platform Service Fee ({safeFeePercent}%):</span>
                <span>-${mlmFee.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-white/10 pt-1 flex justify-between font-bold text-xs text-emerald-400">
                <span>Net USDT to Trust Wallet:</span>
                <span>${mlmNet.toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          {/* Primary Button */}
          <button
            id="withdraw-mlm-btn"
            disabled={
              isProcessing ||
              mlmBalanceUsd <= 0 ||
              grossMlmAmount <= 0 ||
              grossMlmAmount > mlmBalanceUsd
            }
            onClick={handleWithdrawMlm}
            className={`w-full py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              isProcessing ||
              mlmBalanceUsd <= 0 ||
              grossMlmAmount <= 0 ||
              grossMlmAmount > mlmBalanceUsd
                ? 'bg-[#050b16]/70 text-slate-500 border border-white/10 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transform active:scale-98 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{statusMessage || 'PROCESSING MLM PAYOUT...'}</span>
              </span>
            ) : mlmBalanceUsd <= 0 ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                <span>NO WITHDRAWABLE MLM BALANCE ($0.00)</span>
              </span>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4 text-slate-950 font-bold" />
                <span>WITHDRAW ${mlmNet.toFixed(2)} NET USDT (MLM EARNINGS)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3 rounded-[16px] bg-rose-950/90 border border-rose-500/60 text-[10px] text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-rose-300">Withdrawal Blocked:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success Notification Modal / Box */}
      {showSuccessNotification && successDetails && (
        <div className="p-3.5 rounded-[20px] bg-[#0a1a12] border-2 border-emerald-400/70 text-emerald-300 text-[10px] space-y-2.5 shadow-[0_0_28px_rgba(16,185,129,0.25)]">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Confirmed & Dispatched!</span>
            </div>
            <span className="text-[8.5px] font-mono-crypto px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              {successDetails.walletType}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono-crypto text-center text-[9px]">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/20">
              <span className="text-emerald-400/70 block text-[7.5px]">Gross Requested</span>
              <span className="font-bold text-slate-100">${successDetails.gross.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/20">
              <span className="text-rose-400/80 block text-[7.5px]">{safeFeePercent}% Service Fee</span>
              <span className="font-bold text-rose-300">-${successDetails.fee.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-400/40">
              <span className="text-emerald-300 block text-[7.5px]">Net USDT Dispatched</span>
              <span className="font-black text-emerald-400 text-[11px]">
                ${successDetails.net.toFixed(2)}
              </span>
            </div>
          </div>

          {successDetails.tokensReturned && successDetails.tokensReturned > 0 ? (
            <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 font-mono-crypto text-[8.5px] text-emerald-200">
              <span>✓ Returned Collateral: </span>
              <strong className="text-amber-300">{successDetails.tokensReturned.toLocaleString()} NXBC Tokens</strong>
              <span> to Admin Treasury ({ADMIN_TREASURY_WALLET.slice(0, 6)}...{ADMIN_TREASURY_WALLET.slice(-4)})</span>
            </div>
          ) : null}

          {successDetails.phaseBreakdown && successDetails.phaseBreakdown.length > 0 ? (
            <div className="text-[8px] font-mono-crypto text-emerald-300/80 space-y-0.5">
              <span>Phase Audit: </span>
              {successDetails.phaseBreakdown.map((p, idx) => (
                <span key={idx} className="mr-2">
                  [{p.phaseName}: {p.tokensToReturn} tokens / ${p.grossDeducted.toFixed(2)}]
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-[8.5px] text-emerald-200/80 font-mono-crypto truncate">
            Tx: {successDetails.txHash}
          </p>
        </div>
      )}

      {/* Transaction History Section */}
      <section className="rounded-[20px] bg-[linear-gradient(135deg,#081426_0%,#07101c_65%,#0d1726_100%)] border border-amber-400/25 p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider">
            Settlement & Transaction History
          </h3>
          <span className="text-[9px] font-mono-crypto text-amber-300">
            {pastTransactions.length} Verified Records
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {pastTransactions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#050b16]/75 border border-white/10 text-center text-xs text-slate-400 font-mono-crypto">
              No transactions yet
            </div>
          ) : (
            pastTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 rounded-xl bg-[#050b16]/75 border border-white/10 hover:border-amber-400/30 transition-colors flex items-center justify-between text-[10px]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      tx.type === 'withdrawal'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : tx.type === 'buy'
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                        : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                    }`}
                  >
                    {tx.type === 'withdrawal' ? (
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block">{tx.title}</span>
                    <span className="text-[8px] font-mono-crypto text-slate-400">
                      {tx.timestamp} • {tx.txHash}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono-crypto font-bold block ${
                      tx.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'withdrawal' ? '-' : '+'}${tx.amountUsd.toFixed(2)}
                  </span>
                  <span className="text-[8px] font-mono-crypto text-emerald-400 flex items-center gap-0.5 justify-end">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Confirmed
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
