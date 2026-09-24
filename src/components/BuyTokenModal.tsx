import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, Wallet, X, Zap, Coins, TrendingUp, AlertCircle } from 'lucide-react';
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
  directBuyerInfo?: { phaseNumber?: number; remainingTokens?: number; tokenPrice?: number; sellerWalletMasked?: string; expiresAt?: string } | null;
};

const num = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const fmt = (v: number) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });

const DEFAULT_ALLOCATION = { p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 };

export const BuyTokenModal: React.FC<Props> = ({
  isOpen,
  onClose,
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
  const allowedPhaseKeys = useMemo(
    () => ['p2', 'p3', 'p4', 'p5'].filter(k => Number(k.slice(1)) > currentPhaseNumber) as Array<'p2' | 'p3' | 'p4' | 'p5'>,
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
  const [error, setError] = useState('');

  // Prevents re-render / polling cycles from wiping out user typing!
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setUsd('');
      setError('');
      setBusy(false);

      const incoming = {
        p2: clamp(num(initialAllocation?.p2Percent, 20)),
        p3: clamp(num(initialAllocation?.p3Percent, 30)),
        p4: clamp(num(initialAllocation?.p4Percent, 20)),
        p5: clamp(num(initialAllocation?.p5Percent, 15)),
        dex: clamp(num(initialAllocation?.dexPercent, 15)),
      };

      for (const key of (['p2', 'p3', 'p4', 'p5'] as const)) {
        if (Number(key.slice(1)) <= currentPhaseNumber) incoming[key] = 0;
      }
      const totalIncoming = incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5 + incoming.dex;
      if (totalIncoming <= 0.000001) {
        incoming.dex = 100;
      } else {
        const futureTotal = incoming.p2 + incoming.p3 + incoming.p4 + incoming.p5;
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

  const parts = useMemo(() => {
    const p2 = (tokens * a.p2) / 100;
    const p3 = (tokens * a.p3) / 100;
    const p4 = (tokens * a.p4) / 100;
    const p5 = (tokens * a.p5) / 100;
    const dex = (tokens * a.dex) / 100;
    const total = a.p2 + a.p3 + a.p4 + a.p5 + a.dex;
    return { p2, p3, p4, p5, dex, total };
  }, [tokens, a]);

  const totalTokens = parts.p2 + parts.p3 + parts.p4 + parts.p5 + parts.dex;
  const exact100 = Math.abs(parts.total - 100) <= 0.01;
  const minOk = purchaseUsd >= Math.max(0, minPurchaseUsd);
  const balanceOk = purchaseUsd <= Number(usdtBalance) + 1e-9;
  const can =
    walletConnected &&
    !!walletAddress &&
    purchaseUsd > 0 &&
    tokens > 0 &&
    exact100 &&
    minOk &&
    balanceOk &&
    !busy;

  const handlePhaseChange = (key: keyof typeof a, rawVal: string) => {
    setRawPhaseInputs(prev => ({ ...prev, [key]: rawVal }));
    const valNumber = rawVal === '' ? 0 : clamp(num(rawVal));
    setA(prev => ({ ...prev, [key]: valNumber }));
    setError('');
  };

  const preset = (next: typeof DEFAULT_ALLOCATION) => {
    const safe = { ...next };
    for (const key of (['p2', 'p3', 'p4', 'p5'] as const)) {
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

  const confirm = async () => {
    setError('');

    if (!walletConnected || !walletAddress) {
      setError('Please connect your Web3 wallet first.');
      return;
    }
    if (purchaseUsd <= 0) {
      setError('Enter a valid USDT purchase amount.');
      return;
    }
    if (!minOk) {
      setError(`Minimum purchase is $${Number(minPurchaseUsd).toFixed(2)} USDT.`);
      return;
    }
    if (!balanceOk) {
      setError('Insufficient USDT balance in the connected wallet.');
      return;
    }
    if (!exact100) {
      setError(`Please allocate exactly 100%. Current allocation is ${parts.total.toFixed(2)}%.`);
      return;
    }

    try {
      setBusy(true);
      const buyResult = await executeSmartContractBuy(
        purchaseUsd,
        null,
        parts.p2,
        parts.p3,
        parts.p4,
        parts.p5,
        parts.dex,
        msg => setError(msg)
      );

      if (!buyResult.success || !buyResult.txHash) {
        throw new Error(buyResult.error || 'NXBC purchase transaction failed.');
      }

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
      setError(e?.message || 'Purchase could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const cards = [
    ['p2', 'Phase 2 Sell', 0.10, parts.p2],
    ['p3', 'Phase 3 Sell', 1.00, parts.p3],
    ['p4', 'Phase 4 Sell', 10.00, parts.p4],
    ['p5', 'Phase 5 Sell', 100.00, parts.p5],
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#070b16] text-white shadow-2xl custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/95 backdrop-blur-md px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base tracking-wide flex items-center gap-2">
                  BUY NXBC TOKENS
                </h3>
                <p className="text-[11px] text-slate-400">
                  Acquire NXBC directly &amp; set sell phase allocation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
                  <span className="font-bold text-white">{fmt(directBuyerInfo.remainingTokens)} NXBC</span> · Seller:{' '}
                  <span className="font-mono text-cyan-300">{directBuyerInfo.sellerWalletMasked}</span>
                </div>
              </div>
            </div>
          )}

          {/* 1 USDT to NXBC Exchange Rate Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10 p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-400" />
                  Live Official Token Rate
                </div>
                <div className="text-xl font-black text-white mt-1 flex items-baseline gap-2">
                  <span>1 USDT = <span className="text-amber-300 font-mono text-2xl">{fmt(tokensPerOneUsdt)}</span> NXBC</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  1 NXBC = <span className="font-bold text-cyan-300">${effectiveRate.toFixed(4)} USD</span>
                </div>
              </div>

              <div className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-right">
                <div className="text-[9px] uppercase font-semibold text-slate-400">Current Phase</div>
                <div className="text-xs font-bold text-emerald-300">
                  {activePhaseInfo?.name || `Phase ${activePhaseInfo?.phaseNumber || 1}`}
                </div>
              </div>
            </div>

            {activePhaseInfo && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-white/10">
                <div className="rounded-xl bg-black/30 p-2 border border-white/5">
                  <span className="text-slate-400">Phase Sold:</span>
                  <div className="font-bold text-white mt-0.5">{fmt(activePhaseInfo.tokensSold)} NXBC</div>
                </div>
                <div className="rounded-xl bg-black/30 p-2 border border-white/5">
                  <span className="text-slate-400">Phase Supply:</span>
                  <div className="font-bold text-white mt-0.5">{fmt(activePhaseInfo.totalSupply)} NXBC</div>
                </div>
              </div>
            )}
          </div>

          {/* USDT Purchase Amount Input */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0e1b] p-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Wallet size={14} className="text-cyan-400" />
                USDT Purchase Amount
              </label>
              <span className="text-[11px] text-slate-400">
                Wallet Balance: <b className="text-cyan-300">{fmt(usdtBalance)} USDT</b>
              </span>
            </div>

            <div className="flex items-center rounded-2xl border border-purple-500/40 bg-[#060913] px-3.5 py-1 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <span className="text-xl font-black text-amber-400 mr-2">$</span>
              <input
                type="text"
                value={usd}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setUsd(val);
                    setError('');
                  }
                }}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent py-2.5 outline-none font-black text-xl text-white placeholder:text-slate-600"
              />
              <span className="text-cyan-300 font-black text-sm px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                USDT
              </span>
            </div>

            {/* Quick Amount Selector */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setQuickUsd(10)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => setQuickUsd(50)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
              >
                +$50
              </button>
              <button
                type="button"
                onClick={() => setQuickUsd(100)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
              >
                +$100
              </button>
              <button
                type="button"
                onClick={() => setQuickUsd(500)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
              >
                +$500
              </button>
              <button
                type="button"
                onClick={setMaxUsd}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[10px] font-black text-cyan-300 transition-colors"
              >
                MAX USDT
              </button>
            </div>

            {/* Live Calculation Preview */}
            <div className="rounded-xl bg-gradient-to-r from-purple-950/40 to-cyan-950/40 border border-purple-500/20 p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">You will receive</div>
                <div className="text-lg font-black text-cyan-300 flex items-center gap-1.5 mt-0.5">
                  <Coins size={18} className="text-amber-400" />
                  {fmt(tokens)} NXBC
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <div>Formula:</div>
                <div className="font-mono text-slate-300">
                  ${purchaseUsd > 0 ? purchaseUsd.toFixed(2) : '0.00'} × {fmt(tokensPerOneUsdt)}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Quick Split */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0e18] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs text-cyan-300">
                <Zap size={15} /> Quick 1-Click Split
              </div>
              <span className="text-[10px] text-slate-400">Presets auto-sum to 100%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => preset({ p2: 20, p3: 30, p4: 20, p5: 15, dex: 15 })}
                className="rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2 py-2 text-[10px] font-bold text-cyan-200 transition-colors"
              >
                20/30/20/15/15
              </button>
              <button
                type="button"
                onClick={() => preset({ p2: 50, p3: 25, p4: 10, p5: 5, dex: 10 })}
                className="rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2 py-2 text-[10px] font-bold text-cyan-200 transition-colors"
              >
                50/25/10/5/10
              </button>
              <button
                type="button"
                onClick={() => preset({ p2: 0, p3: 0, p4: 0, p5: 0, dex: 100 })}
                className="rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-2 text-[10px] font-bold text-purple-200 transition-colors"
              >
                100% DEX
              </button>
              <button
                type="button"
                onClick={() => preset({ p2: 0, p3: 0, p4: 0, p5: 100, dex: 0 })}
                className="rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-2 text-[10px] font-bold text-emerald-200 transition-colors"
              >
                100% P5
              </button>
            </div>
          </div>

          {/* Phase Sell Sliders & Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cards.map(([key, title, rate, tok]) => {
              const isAllowed = allowedPhaseKeys.includes(key);
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-3 transition-all ${
                    isAllowed
                      ? 'border-white/10 bg-[#080d18] hover:border-cyan-500/30'
                      : 'border-white/5 bg-[#080d18]/50 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <div className="text-[11px] font-black flex items-center gap-1.5">
                        {title}
                        {!isAllowed && <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Locked</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Target: <span className="text-amber-300 font-bold">${rate.toFixed(2)}</span> · <span className="text-cyan-300 font-mono">{fmt(tok)} NXBC</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        disabled={!isAllowed}
                        value={rawPhaseInputs[key] ?? String(a[key])}
                        onChange={e => handlePhaseChange(key, e.target.value)}
                        className="w-16 rounded-xl bg-[#101527] px-2 py-1.5 text-right font-black text-sm outline-none border border-white/10 focus:border-cyan-400 disabled:cursor-not-allowed"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* DEX / LIVE Box */}
            <div className="sm:col-span-2 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-purple-400" />
                    DEX / LIVE Wallet Hold
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    Held in your personal Web3 wallet for live decentralized trading.
                  </div>
                  <div className="text-[11px] text-purple-300 font-bold mt-1">
                    Receive: {fmt(parts.dex)} NXBC
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={rawPhaseInputs.dex ?? String(a.dex)}
                    onChange={e => handlePhaseChange('dex', e.target.value)}
                    className="w-16 rounded-xl bg-[#101527] px-2 py-1.5 text-right font-black text-sm outline-none border border-purple-500/40 focus:border-purple-400 text-white"
                  />
                  <span className="text-xs font-bold text-purple-300">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Total Check */}
          <div
            className={`rounded-2xl border p-3.5 transition-all ${
              exact100 ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/40 bg-rose-950/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Allocation Sum Validation
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${exact100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {parts.total.toFixed(2)}% / 100%
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10px]">
              <div className="rounded-lg bg-black/30 p-2">
                <span className="text-slate-400">Total Tokens:</span>
                <div className="font-bold text-white mt-0.5">{fmt(tokens)} NXBC</div>
              </div>
              <div className="rounded-lg bg-black/30 p-2">
                <span className="text-slate-400">FIFO Queue:</span>
                <div className="font-bold text-amber-300 mt-0.5">{fmt(parts.p2 + parts.p3 + parts.p4 + parts.p5)} NXBC</div>
              </div>
              <div className="rounded-lg bg-black/30 p-2">
                <span className="text-slate-400">DEX Hold:</span>
                <div className="font-bold text-purple-300 mt-0.5">{fmt(parts.dex)} NXBC</div>
              </div>
            </div>
            {exact100 ? (
              <div className="text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 mt-2">
                <CheckCircle2 size={14} /> Allocation complete (100% matches)
              </div>
            ) : (
              <div className="text-rose-300 text-[10px] font-bold flex items-center gap-1.5 mt-2">
                <AlertCircle size={14} /> Please adjust percentages so the total equals exactly 100%.
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirm & Purchase Button */}
          <button
            type="button"
            onClick={confirm}
            disabled={!can}
            className={`w-full rounded-2xl py-4 font-black flex justify-center items-center gap-2 transition-all shadow-lg ${
              can
                ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-300 text-black hover:opacity-95 cursor-pointer shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                PROCESSING BLOCKCHAIN TRANSACTION...
              </span>
            ) : (
              <>
                <Lock size={17} />
                {walletConnected
                  ? purchaseUsd > 0
                    ? `CONFIRM & PAY $${purchaseUsd.toFixed(2)} USDT`
                    : 'ENTER USDT AMOUNT'
                  : 'CONNECT WALLET TO BUY'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTokenModal;