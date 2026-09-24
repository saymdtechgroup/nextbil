import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Wallet,
  X,
  Zap,
  Coins,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Flame,
  Layers,
  ArrowUpRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { executeSmartContractBuy } from '../utils/web3Helper';

type AllocationInput = {
  p1Percent?: number;
  p2Percent?: number;
  p3Percent?: number;
  p4Percent?: number;
  p5Percent?: number;
  dexPercent?: number;
  unallocatedPercent?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpenWalletModal?: () => void;
  onConfirmPurchase: (
    tokenAmount: number,
    usdAmount: number,
    sellAlloc: {
      p1Percent: number;
      p2Percent: number;
      p3Percent: number;
      p4Percent: number;
      p5Percent: number;
      dexPercent: number;
      unallocatedPercent: number;
    },
    txHash?: string,
    currency?: 'USDT',
    directBuyerInviteToken?: string
  ) => Promise<void>;
  currentRate: number;
  walletConnected: boolean;
  walletAddress?: string;
  contractAddress?: string;
  receivingAddress?: string;
  minPurchaseUsd?: number;
  nxbcBalance?: number;
  usdtBalance?: number;
  activePhaseInfo?: {
    phaseNumber: number;
    name: string;
    shortName: string;
    totalSupply: number;
    tokensSold: number;
  };
  initialAllocation?: AllocationInput;
  directBuyerInviteToken?: string;
  directBuyerInfo?: {
    phaseNumber?: number;
    remainingTokens?: number;
    tokenPrice?: number;
    sellerWalletMasked?: string;
    expiresAt?: string;
  } | null;
};

const num = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fmt = (v: number) =>
  Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });

const DEFAULT_ALLOCATION = { p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 };

export const BuyTokenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenWalletModal,
  onConfirmPurchase,
  currentRate = 0.01,
  walletConnected,
  walletAddress,
  minPurchaseUsd = 0,
  usdtBalance = 0,
  activePhaseInfo,
  initialAllocation,
  directBuyerInviteToken,
  directBuyerInfo,
}) => {
  const [usd, setUsd] = useState('');
  const currentPhaseNumber = Number(activePhaseInfo?.phaseNumber || 1);

  // User CANNOT sell in the phase they are currently buying (only future phases + DEX are allowed)
  const allowedPhaseKeys = useMemo(
    () =>
      ['p2', 'p3', 'p4', 'p5'].filter(
        (k) => Number(k.slice(1)) > currentPhaseNumber
      ) as Array<'p2' | 'p3' | 'p4' | 'p5'>,
    [currentPhaseNumber]
  );

  const [a, setA] = useState(DEFAULT_ALLOCATION);
  const [rawPhaseInputs, setRawPhaseInputs] = useState<Record<string, string>>({
    p2: '20',
    p3: '30',
    p4: '20',
    p5: '15',
    dex: '15',
  });
  const [busy, setBusy] = useState(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [statusDetail, setStatusDetail] = useState<string>('');
  const [error, setError] = useState('');

  // Protect typing state from external re-renders / price polling
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setUsd('');
      setError('');
      setBusy(false);
      setStatusStep('');
      setStatusDetail('');

      const incoming = {
        p2: clamp(num(initialAllocation?.p2Percent, 20)),
        p3: clamp(num(initialAllocation?.p3Percent, 30)),
        p4: clamp(num(initialAllocation?.p4Percent, 20)),
        p5: clamp(num(initialAllocation?.p5Percent, 15)),
        dex: clamp(num(initialAllocation?.dexPercent, 15)),
      };

      // Disable any phases <= current purchase phase
      for (const key of ['p2', 'p3', 'p4', 'p5'] as const) {
        if (Number(key.slice(1)) <= currentPhaseNumber) incoming[key] = 0;
      }

      const totalIncoming =
        incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5 + incoming.dex;
      if (totalIncoming <= 0.000001) {
        incoming.dex = 100;
      } else {
        const futureTotal =
          incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5;
        incoming.dex = clamp(100 - futureTotal);
      }

      setA(incoming);
      setRawPhaseInputs({
        p2: String(incoming.p2),
        p3: String(incoming.p3),
        p4: String(incoming.p4),
        p5: String(incoming.p5),
        dex: String(incoming.dex),
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentPhaseNumber]);

  const effectiveRate = currentRate > 0 ? currentRate : 0.01;
  const purchaseUsd = Math.max(0, num(usd));
  const tokens = purchaseUsd / effectiveRate;
  const tokensPerOneUsdt = 1 / effectiveRate;

  // Breakdown of token amounts per phase based on user's exact % selection
  const parts = useMemo(() => {
    const p2 = (tokens * a.p2) / 100;
    const p3 = (tokens * a.p3) / 100;
    const p4 = (tokens * a.p4) / 100;
    const p5 = (tokens * a.p5) / 100;
    const dex = (tokens * a.dex) / 100;
    const total = a.p2 + a.p3 + a.p4 + a.p5 + a.dex;
    return { p2, p3, p4, p5, dex, total };
  }, [tokens, a]);

  const exact100 = Math.abs(parts.total - 100) <= 0.01;
  const minOk = purchaseUsd >= Math.max(0, minPurchaseUsd);
  const balanceOk = purchaseUsd <= Number(usdtBalance) + 1e-9;

  // Is ready to purchase
  const isPurchaseReady =
    purchaseUsd > 0 && tokens > 0 && exact100 && minOk && balanceOk && !busy;

  const canSubmit = walletConnected && !!walletAddress && isPurchaseReady;

  // Handle direct manual typing into any phase box
  const handlePhaseChange = (key: keyof typeof a, rawVal: string) => {
    setRawPhaseInputs((prev) => ({ ...prev, [key]: rawVal }));
    const valNumber = rawVal === '' ? 0 : clamp(num(rawVal));
    setA((prev) => ({ ...prev, [key]: valNumber }));
    setError('');
  };

  // Give 100% allocation to a single selected phase/DEX
  const allocateAllToSinglePhase = (targetKey: 'p2' | 'p3' | 'p4' | 'p5' | 'dex') => {
    const nextA = { p2: 0, p3: 0, p4: 0, p5: 0, dex: 0 };
    nextA[targetKey] = 100;
    setA(nextA);
    setRawPhaseInputs({
      p2: String(nextA.p2),
      p3: String(nextA.p3),
      p4: String(nextA.p4),
      p5: String(nextA.p5),
      dex: String(nextA.dex),
    });
    setError('');
  };

  // Set preset combination (e.g. 10/30/60/0/0 or 20/30/20/15/15)
  const applyPreset = (presetAlloc: typeof DEFAULT_ALLOCATION) => {
    const safe = { ...presetAlloc };
    for (const key of ['p2', 'p3', 'p4', 'p5'] as const) {
      if (!allowedPhaseKeys.includes(key)) safe[key] = 0;
    }
    const futureTotal = safe.p2 + safe.p3 + safe.p4 + safe.p5;
    safe.dex = clamp(100 - futureTotal);
    setA(safe);
    setRawPhaseInputs({
      p2: String(safe.p2),
      p3: String(safe.p3),
      p4: String(safe.p4),
      p5: String(safe.p5),
      dex: String(safe.dex),
    });
    setError('');
  };

  const setQuickUsd = (amount: number) => {
    setUsd(String(amount));
    setError('');
  };

  const setMaxUsd = () => {
    if (usdtBalance > 0) {
      setUsd(String(Math.floor(usdtBalance * 100) / 100));
      setError('');
    }
  };

  const handleActionClick = async () => {
    if (!walletConnected) {
      if (onOpenWalletModal) {
        onOpenWalletModal();
      } else {
        setError('Please connect your Web3 wallet first.');
      }
      return;
    }

    setError('');
    setStatusStep('');
    setStatusDetail('');

    if (purchaseUsd <= 0) {
      setError('Enter a valid USDT purchase amount.');
      return;
    }
    if (!minOk) {
      setError(
        `Minimum purchase is $${Number(minPurchaseUsd).toFixed(2)} USDT.`
      );
      return;
    }
    if (!balanceOk) {
      setError('Insufficient USDT balance in the connected wallet.');
      return;
    }
    if (!exact100) {
      setError(
        `Please allocate exactly 100%. Current allocation is ${parts.total.toFixed(
          2
        )}%.`
      );
      return;
    }

    try {
      setBusy(true);
      setStatusStep('Initiating Web3 Transaction...');
      setStatusDetail('Please check your Trust Wallet / MetaMask / Web3 app to confirm.');

      const buyResult = await executeSmartContractBuy(
        purchaseUsd,
        null,
        parts.p2,
        parts.p3,
        parts.p4,
        parts.p5,
        parts.dex,
        (msg) => {
          // Status updates from blockchain steps (Approve, Buy, Waiting confirmation)
          setStatusStep(msg);
          setStatusDetail('Check your wallet screen and confirm prompt if requested.');
        }
      );

      if (!buyResult.success || !buyResult.txHash) {
        throw new Error(buyResult.error || 'NXBC purchase transaction failed or was rejected.');
      }

      setStatusStep('Finalizing your purchase on server...');
      setStatusDetail(`Tx: ${buyResult.txHash.substring(0, 10)}...${buyResult.txHash.substring(58)}`);

      await onConfirmPurchase(
        Number(buyResult.tokenAmount || tokens),
        Number(buyResult.usdtAmount || purchaseUsd),
        {
          p1Percent: 0,
          p2Percent: a.p2,
          p3Percent: a.p3,
          p4Percent: a.p4,
          p5Percent: a.p5,
          dexPercent: a.dex,
          unallocatedPercent: 0,
        },
        buyResult.txHash,
        'USDT',
        directBuyerInviteToken
      );
      onClose();
    } catch (e: any) {
      console.error('Purchase Execution Failed:', e);
      setError(e?.message || 'Purchase could not be completed.');
      setStatusStep('');
      setStatusDetail('');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  // Phase cards configuration
  const phaseCards = [
    { key: 'p2' as const, label: 'Phase 2 Sell', targetPrice: 0.1, tokens: parts.p2 },
    { key: 'p3' as const, label: 'Phase 3 Sell', targetPrice: 1.0, tokens: parts.p3 },
    { key: 'p4' as const, label: 'Phase 4 Sell', targetPrice: 10.0, tokens: parts.p4 },
    { key: 'p5' as const, label: 'Phase 5 Sell', targetPrice: 100.0, tokens: parts.p5 },
  ];

  // Calculate sold progress percentage for current phase
  const phaseSoldPercent =
    activePhaseInfo && activePhaseInfo.totalSupply > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (activePhaseInfo.tokensSold / activePhaseInfo.totalSupply) * 100
          )
        )
      : 35;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#070b16] text-white shadow-[0_0_50px_rgba(245,158,11,0.15)] custom-scrollbar">
        {/* Glowing ambient background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-amber-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/95 backdrop-blur-md px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/40 text-amber-300 shadow-inner">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-base tracking-wide flex items-center gap-2">
                  BUY NXBC TOKENS
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    Official Presale
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select your custom sell phase allocation or DEX wallet hold
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Direct Match Banner if active */}
          {directBuyerInfo && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                  DIRECT BUYER MATCH ACTIVE
                </div>
                <div className="text-[10px] text-slate-200 mt-0.5 leading-relaxed">
                  Phase {directBuyerInfo.phaseNumber} · Available:{' '}
                  <span className="font-bold text-white">
                    {fmt(directBuyerInfo.remainingTokens)} NXBC
                  </span>{' '}
                  · Seller:{' '}
                  <span className="font-mono text-cyan-300">
                    {directBuyerInfo.sellerWalletMasked}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BEAUTIFIED CURRENT PHASE & LIVE RATE SHOWCASE */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#121024] via-[#090e1f] to-[#04121b] p-4 sm:p-5 shadow-xl">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top Stage Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  {activePhaseInfo?.name || `Phase ${activePhaseInfo?.phaseNumber || 1}`} · LIVE STAGE
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <Flame size={13} className="text-orange-400" />
                <span>1 NXBC = ${effectiveRate.toFixed(4)} USD</span>
              </div>
            </div>

            {/* Hero 1 USDT Exchange Rate Display */}
            <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Coins size={13} className="text-amber-400" />
                  Live Official Conversion Rate
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-baseline gap-2">
                  <span>1 USDT =</span>
                  <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent font-mono">
                    {fmt(tokensPerOneUsdt)}
                  </span>
                  <span className="text-sm font-bold text-cyan-300">NXBC</span>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-[9px] uppercase font-semibold text-slate-400">
                  Active Price Target
                </div>
                <div className="text-lg font-black text-emerald-300 font-mono">
                  ${effectiveRate.toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* Phase Supply Progress Bar */}
            {activePhaseInfo && (
              <div className="mt-3.5 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>
                    Sold:{' '}
                    <b className="text-white">
                      {fmt(activePhaseInfo.tokensSold)} NXBC
                    </b>
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {phaseSoldPercent.toFixed(1)}% Completed
                  </span>
                  <span>
                    Total:{' '}
                    <b className="text-white">
                      {fmt(activePhaseInfo.totalSupply)} NXBC
                    </b>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.max(5, phaseSoldPercent)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* USDT Purchase Amount Input */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0e1b] p-4 sm:p-5 space-y-3.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-200 uppercase flex items-center gap-1.5">
                <Wallet size={15} className="text-cyan-400" />
                USDT Purchase Amount
              </label>
              <span className="text-xs text-slate-400">
                Wallet Balance:{' '}
                <b className="text-cyan-300 font-mono">
                  {fmt(usdtBalance)} USDT
                </b>
              </span>
            </div>

            <div className="flex items-center rounded-2xl border-2 border-purple-500/40 bg-[#060913] px-4 py-2 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/20 transition-all">
              <span className="text-2xl font-black text-amber-400 mr-2">$</span>
              <input
                type="text"
                disabled={busy}
                value={usd}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setUsd(val);
                    setError('');
                  }
                }}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent py-2 outline-none font-black text-2xl text-white placeholder:text-slate-600 disabled:opacity-50"
              />
              <span className="text-cyan-300 font-black text-sm px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                USDT
              </span>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuickUsd(10)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                +$10
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuickUsd(50)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                +$50
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuickUsd(100)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                +$100
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuickUsd(500)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                +$500
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={setMaxUsd}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-black text-cyan-300 transition-all cursor-pointer disabled:opacity-40"
              >
                MAX USDT
              </button>
            </div>

            {/* Real-time Token Calculation Summary */}
            <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40 border border-purple-500/30 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total NXBC Tokens to Acquire
                </div>
                <div className="text-xl font-black text-cyan-300 flex items-center gap-2 mt-0.5">
                  <Coins size={20} className="text-amber-400" />
                  <span>{fmt(tokens)} NXBC</span>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <div>Formula:</div>
                <div className="font-mono text-amber-300 font-bold">
                  ${purchaseUsd > 0 ? purchaseUsd.toFixed(2) : '0.00'} ÷ $
                  {effectiveRate.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOM PHASE SELECTION SECTION */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0e18] p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <div className="flex items-center gap-2 font-black text-sm text-cyan-300">
                  <Layers size={17} /> Phase Sell Distribution (User Controlled)
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Choose which future phase to sell your NXBC in. Total must equal 100%.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20 w-fit">
                Current Buying Phase Locked
              </span>
            </div>

            {/* Quick 1-Click Preset Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap size={12} className="text-amber-400" /> Quick 100% or Split Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allowedPhaseKeys.includes('p2') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => allocateAllToSinglePhase('p2')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 ${
                      a.p2 === 100
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    100% Phase 2
                  </button>
                )}
                {allowedPhaseKeys.includes('p3') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => allocateAllToSinglePhase('p3')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 ${
                      a.p3 === 100
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    100% Phase 3
                  </button>
                )}
                {allowedPhaseKeys.includes('p4') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => allocateAllToSinglePhase('p4')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 ${
                      a.p4 === 100
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    100% Phase 4
                  </button>
                )}
                {allowedPhaseKeys.includes('p5') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => allocateAllToSinglePhase('p5')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 ${
                      a.p5 === 100
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    100% Phase 5
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => allocateAllToSinglePhase('dex')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 ${
                    a.dex === 100
                      ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-300'
                  }`}
                >
                  100% DEX
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    applyPreset({ p2: 10, p3: 30, p4: 60, p5: 0, dex: 0 })
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 transition-all cursor-pointer disabled:opacity-40"
                >
                  10/30/60 Split
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    applyPreset({ p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 })
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 transition-all cursor-pointer disabled:opacity-40"
                >
                  20/30/20/15/15
                </button>
              </div>
            </div>

            {/* Individual Phase Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {phaseCards.map(({ key, label, targetPrice, tokens: phaseTokens }) => {
                const isAllowed = allowedPhaseKeys.includes(key);
                const percentVal = a[key];
                const expectedUsdPayout = phaseTokens * targetPrice;

                return (
                  <div
                    key={key}
                    className={`relative rounded-2xl border p-3.5 transition-all ${
                      isAllowed
                        ? percentVal > 0
                          ? 'border-cyan-500/50 bg-[#0c1427] shadow-md shadow-cyan-500/5'
                          : 'border-white/10 bg-[#080d18] hover:border-white/20'
                        : 'border-white/5 bg-[#080d18]/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-xs font-black flex items-center gap-1.5">
                          {label}
                          {!isAllowed ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                              Current / Locked
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                              ${targetPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-cyan-300 font-mono font-bold mt-1">
                          {fmt(phaseTokens)} NXBC
                        </div>
                        {isAllowed && phaseTokens > 0 && (
                          <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                            Est. Return: ${fmt(expectedUsdPayout)} USD
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            disabled={!isAllowed || busy}
                            value={rawPhaseInputs[key] ?? String(percentVal)}
                            onChange={(e) =>
                              handlePhaseChange(key, e.target.value)
                            }
                            className="w-16 rounded-xl bg-[#101527] px-2.5 py-1.5 text-right font-black text-sm outline-none border border-white/15 focus:border-cyan-400 text-white disabled:cursor-not-allowed disabled:opacity-40"
                          />
                          <span className="text-xs font-black text-slate-400">
                            %
                          </span>
                        </div>

                        {isAllowed && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => allocateAllToSinglePhase(key)}
                            className="text-[9px] font-black text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-40"
                          >
                            100% ALL
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* DEX / LIVE Wallet Hold Box */}
              <div
                className={`sm:col-span-2 rounded-2xl border p-4 transition-all ${
                  a.dex > 0
                    ? 'border-purple-500/50 bg-purple-950/25 shadow-md shadow-purple-500/10'
                    : 'border-purple-500/30 bg-purple-950/10'
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <TrendingUp size={15} className="text-purple-400" />
                      DEX / LIVE Wallet Hold
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        No FIFO Queue
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Directly sent to your Web3 wallet for holding or decentralized trading.
                    </div>
                    <div className="text-xs text-purple-300 font-mono font-black mt-1">
                      Receive: {fmt(parts.dex)} NXBC
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        disabled={busy}
                        value={rawPhaseInputs.dex ?? String(a.dex)}
                        onChange={(e) =>
                          handlePhaseChange('dex', e.target.value)
                        }
                        className="w-16 rounded-xl bg-[#101527] px-2.5 py-1.5 text-right font-black text-sm outline-none border border-purple-500/40 focus:border-purple-400 text-white disabled:opacity-40"
                      />
                      <span className="text-xs font-black text-purple-300">%</span>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => allocateAllToSinglePhase('dex')}
                      className="text-[9px] font-black text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 px-2 py-0.5 rounded-lg border border-purple-500/30 transition-all cursor-pointer disabled:opacity-40"
                    >
                      100% DEX
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ALLOCATION VALIDATION BOX */}
          <div
            className={`rounded-2xl border p-4 transition-all ${
              exact100
                ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
                : 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-500/5'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ShieldCheck size={16} className={exact100 ? 'text-emerald-400' : 'text-rose-400'} />
                Allocation Sum Validation
              </span>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                  exact100
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {parts.total.toFixed(2)}% / 100%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
                <span className="text-slate-400">Total Purchase:</span>
                <div className="font-bold text-white text-xs mt-0.5 font-mono">
                  {fmt(tokens)} NXBC
                </div>
              </div>
              <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
                <span className="text-slate-400">Phase Sell Queues:</span>
                <div className="font-bold text-amber-300 text-xs mt-0.5 font-mono">
                  {fmt(parts.p2 + parts.p3 + parts.p4 + parts.p5)} NXBC
                </div>
              </div>
              <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
                <span className="text-slate-400">DEX Hold:</span>
                <div className="font-bold text-purple-300 text-xs mt-0.5 font-mono">
                  {fmt(parts.dex)} NXBC
                </div>
              </div>
            </div>

            {exact100 ? (
              <div className="text-emerald-300 text-xs font-bold flex items-center gap-1.5 mt-2.5">
                <CheckCircle2 size={15} /> 100% Allocation Complete. Ready to proceed.
              </div>
            ) : (
              <div className="text-rose-300 text-xs font-bold flex items-center gap-1.5 mt-2.5">
                <AlertCircle size={15} /> Total must equal exactly 100% (currently{' '}
                {parts.total.toFixed(1)}%).
              </div>
            )}
          </div>

          {/* ACTIVE TRANSACTION PROGRESS BANNER */}
          {busy && (
            <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/60 to-purple-950/60 p-4 shadow-xl space-y-2 animate-pulse">
              <div className="flex items-center gap-2.5 text-cyan-300 font-black text-sm">
                <Loader2 size={18} className="animate-spin text-cyan-400" />
                <span>{statusStep || 'Processing On-Chain Transaction...'}</span>
              </div>
              <p className="text-[11px] text-slate-300 pl-7">
                {statusDetail || 'Please look at your Trust Wallet / MetaMask / Web3 app to confirm the transaction request.'}
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">Transaction Notice:</div>
                <div className="mt-0.5 text-[11px] leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* HIGH-VISIBILITY HIGHLIGHTED CALL TO ACTION BUTTON */}
          <button
            type="button"
            onClick={handleActionClick}
            disabled={busy || (walletConnected && !canSubmit)}
            className={`w-full relative overflow-hidden rounded-2xl py-4 px-6 font-black text-base flex justify-center items-center gap-2.5 transition-all duration-300 cursor-pointer ${
              busy
                ? 'bg-slate-800 text-amber-300 border border-amber-500/40 cursor-wait'
                : !walletConnected
                ? isPurchaseReady
                  ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)] ring-2 ring-amber-300 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95'
                : canSubmit
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-cyan-300 text-black shadow-[0_0_35px_rgba(245,158,11,0.6)] ring-2 ring-amber-300 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {busy ? (
              <span className="flex items-center gap-2.5">
                <Loader2 size={18} className="animate-spin text-amber-300" />
                <span>CONFIRMING IN WALLET &amp; BSC...</span>
              </span>
            ) : !walletConnected ? (
              <>
                <Wallet size={19} />
                <span>CONNECT WALLET TO BUY</span>
                <ArrowRight size={19} />
              </>
            ) : (
              <>
                <Lock size={19} />
                {purchaseUsd > 0 && exact100
                  ? `CONFIRM & PAY $${purchaseUsd.toFixed(2)} USDT`
                  : purchaseUsd <= 0
                  ? 'ENTER USDT AMOUNT'
                  : 'SET EXACT 100% ALLOCATION'}
                <ArrowUpRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTokenModal;
