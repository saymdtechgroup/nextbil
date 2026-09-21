import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Users,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  ChevronRight,
  Eye,
  EyeOff,
  Percent,
  Clock,
  Rocket,
  Sparkles,
  Calculator,
  Zap,
  RefreshCw,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry, UserEarnings } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  phases?: PhaseConfig[];
  sellQueue?: QueueEntry[];
  onUpdateSellQueue?: (queue: QueueEntry[]) => void;
  onSimulateExternalBuy?: (amount?: number) => void;
  onOpenBuyModal?: () => void;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
  walletAddress?: string | null;
  walletConnected?: boolean;
}

type MilestoneVectorKey = 'p2' | 'p3' | 'p4' | 'p5' | 'live' | 'unallocated';

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  allocation,
  onOpenBuyModal,
  onOpenTeamPlanModal,
  onOpenMatrixModal,
  levelIncomeUsd,
  matrixIncomeUsd,
  walletAddress,
}) => {
  const [showValues, setShowValues] = useState<boolean>(true);
  const [selectedVector, setSelectedVector] = useState<MilestoneVectorKey>('p2');
  const [simTarget, setSimTarget] = useState<'p2' | 'p3' | 'p4' | 'p5' | 'live'>('p3');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saleOrders, setSaleOrders] = useState<Array<{
    id: number; phaseNumber: number; amountTokens: number; soldTokens: number;
    remainingTokens: number; tokenPrice: number; expectedUsdt: number;
    realizedUsdt: number; remainingUsdt: number; status: string; fifoNumber?: number; currentRunningFifoNumber?: number | null; positionsAhead?: number; createdAt?: string;
  }>>([]);
  const [globalFifo, setGlobalFifo] = useState<Array<{
    phaseNumber: number; totalOrders: number; totalQueuedTokens: number;
    orders: Array<{ id: number; userId: number; walletAddress: string; amountTokens: number;
      remainingTokens: number; tokenPrice: number; status: string; position: number;
      aheadTokens: number; expectedRemainingUsdt: number; createdAt?: string; }>;
  }>>([]);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [inviteByOrder, setInviteByOrder] = useState<Record<number, { url: string; expiresAt: string }>>({});
  const [inviteLoading, setInviteLoading] = useState<number | null>(null);

  const generateDirectBuyerLink = async (orderId: number) => {
    if (!walletAddress) return;
    setInviteLoading(orderId);
    try {
      const r = await fetch('/api/presale/direct-buyer/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, orderId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) throw new Error(data.error || 'Could not create Direct Buyer Link.');
      setInviteByOrder(prev => ({ ...prev, [orderId]: { url: data.shareUrl, expiresAt: data.expiresAt } }));
      await navigator.clipboard?.writeText(data.shareUrl);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || 'Could not create Direct Buyer Link.');
    } finally { setInviteLoading(null); }
  };

  const fetchOrders = async () => {
    if (!walletAddress) { setSaleOrders([]); return; }
    try {
      const r = await fetch(`/api/presale/sale-orders/${walletAddress}`);
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) setSaleOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (e) {
      console.error('Failed to load personal phase sale orders:', e);
    }
  };

  const fetchGlobalFifo = async () => {
    try {
      const r = await fetch('/api/presale/fifo-global');
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) {
        setGlobalFifo(Array.isArray(data.phases) ? data.phases : []);
      }
    } catch (e) {
      console.error('Failed to load global FIFO queue:', e);
    } finally {
      setFifoLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, [walletAddress]);

  useEffect(() => {
    fetchGlobalFifo();
    const timer = setInterval(fetchGlobalFifo, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(), fetchGlobalFifo()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Compute token amounts for each vector
  const totalTokens = allocation.totalTokensPurchased;
  const p1Tokens = Math.round(totalTokens * ((allocation.p1Percent || 0) / 100));
  const p2Tokens = Math.round(totalTokens * (allocation.p2Percent / 100));
  const p3Tokens = Math.round(totalTokens * (allocation.p3Percent / 100));
  const p4Tokens = Math.round(totalTokens * (allocation.p4Percent / 100));
  const p5Tokens = Math.round(totalTokens * (allocation.p5Percent / 100));
  const liveTokens = Math.round(totalTokens * (allocation.livePercent / 100));
  const unallocatedTokens = Math.max(
    0,
    totalTokens - (p1Tokens + p2Tokens + p3Tokens + p4Tokens + p5Tokens + liveTokens)
  );

  // Projected values per vector
  const p2Val = p2Tokens * 0.10;
  const p3Val = p3Tokens * 1.00;
  const p4Val = p4Tokens * 10.00;
  const p5Val = p5Tokens * 100.00;
  const liveVal = 0;

  const totalAllocatedUsd = p2Val + p3Val + p4Val + p5Val + liveVal;
  const initialCostUsd = totalTokens * 0.01;

  // Simulator rates & projected holding value
  const simRates: Record<string, { rate: number; label: string; multiplier: string }> = {
    p2: { rate: 0.10, label: 'Phase 2 ($0.10)', multiplier: '10x' },
    p3: { rate: 1.00, label: 'Phase 3 ($1.00)', multiplier: '100x' },
    p4: { rate: 10.00, label: 'Phase 4 ($10.00)', multiplier: '1,000x' },
    p5: { rate: 100.00, label: 'Phase 5 ($100.00)', multiplier: '10,000x' },
    live: { rate: 0, label: 'DEX / LIVE (Market Price)', multiplier: 'TBA' },
  };

  const simCurrent = simRates[simTarget];
  const simValuation = totalTokens * simCurrent.rate;
  const simGain = Math.max(0, simValuation - initialCostUsd);
  const simRoiPercent = initialCostUsd > 0 ? ((simValuation - initialCostUsd) / initialCostUsd) * 100 : 0;


  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 pb-8 sm:pb-12">
      {/* 1. ASSET PORTFOLIO COMMAND CENTER HEADER */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#120b19_100%)] shadow-[0_0_28px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-[14px] bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
                <PieChart className="w-5.5 h-5.5 text-amber-300" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">
                    Asset Portfolio
                  </h1>
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-0.5 truncate">
                  Decentralized Vector Roadmap & Live FIFO Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualRefresh}
                className={`p-1.5 sm:p-2 rounded-xl border border-white/10 bg-[#050b16]/80 text-slate-300 hover:text-amber-300 hover:border-amber-400/40 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Real-time Queue"
                aria-label="Refresh asset data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowValues(!showValues)}
                className="p-1.5 sm:p-2 rounded-xl border border-amber-400/25 bg-[#050b16]/80 text-amber-300 hover:border-amber-400/60 hover:text-amber-200 transition-all"
                title="Toggle Values Visibility"
                aria-label="Toggle portfolio visibility"
              >
                {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
              </button>

              <div className="px-2.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-[15px] border border-white/10 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-slate-300">Total Holdings</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-white">
                {showValues ? `${totalTokens.toLocaleString()}` : '••••'}
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">NXBC</div>
            </div>

            <div className="min-w-0 rounded-[15px] border border-amber-400/20 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-amber-300/90">Milestones</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-amber-300">
                06 VECTORS
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">Phases</div>
            </div>

            <div className="min-w-0 rounded-[15px] border border-cyan-400/20 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-cyan-300/90">Target Cap</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-cyan-300">
                $1,500+
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">DEX / LIVE</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONNECTED WALLET BALANCE & INSTANT ACTIONS */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className="w-4 h-4 text-amber-300" />
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-rajdhani uppercase tracking-wider">
                  Connected Wallet Balance (NXBC)
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[30px] sm:text-[38px] leading-none font-black font-mono-crypto text-white">
                  {showValues ? totalTokens.toLocaleString() : '••••••••'}
                </span>
                <span className="text-sm sm:text-base font-rajdhani text-amber-300 font-bold">NXBC</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[9px] sm:text-[10px] text-emerald-300 font-mono-crypto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <span>100% held safely in your Trust Wallet</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <GoldCoinGraphic size="sm" glow={true} animated={false} />
              {onOpenBuyModal && (
                <button
                  type="button"
                  onClick={onOpenBuyModal}
                  className="mt-2 px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-[10px] uppercase font-rajdhani tracking-wider transition-all shadow-[0_0_12px_rgba(251,191,36,0.2)] flex items-center gap-1"
                >
                  <Rocket className="w-3.5 h-3.5" fill="currentColor" /> BUY
                </button>
              )}
            </div>
          </div>

          {/* UNIQUE FEATURE 1: CYBER ALLOCATION DISTRIBUTION BAR */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-rajdhani uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                Vector Portfolio Distribution Strip
              </span>
              <span className="font-mono-crypto text-amber-300">100% Allocated</span>
            </div>

            <div className="h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden flex p-[1px]">
              <div style={{ width: `${allocation.p1Percent || 0}%` }} title={`Phase 1: ${allocation.p1Percent}%`} className="h-full bg-amber-600 transition-all" />
              <div style={{ width: `${allocation.p2Percent}%` }} title={`Phase 2: ${allocation.p2Percent}%`} className="h-full bg-amber-400 transition-all" />
              <div style={{ width: `${allocation.p3Percent}%` }} title={`Phase 3: ${allocation.p3Percent}%`} className="h-full bg-yellow-300 transition-all" />
              <div style={{ width: `${allocation.p4Percent}%` }} title={`Phase 4: ${allocation.p4Percent}%`} className="h-full bg-cyan-400 transition-all" />
              <div style={{ width: `${allocation.p5Percent}%` }} title={`Phase 5: ${allocation.p5Percent}%`} className="h-full bg-purple-400 transition-all" />
              <div style={{ width: `${allocation.livePercent}%` }} title={`DEX / LIVE: ${allocation.livePercent}%`} className="h-full bg-emerald-400 transition-all" />
              <div style={{ width: `${allocation.unallocatedPercent}%` }} title={`Unallocated: ${allocation.unallocatedPercent}%`} className="h-full bg-slate-600 transition-all" />
            </div>

            <div className="mt-1.5 grid grid-cols-6 gap-1 text-[7px] sm:text-[8px] font-mono-crypto text-center">
              <div className="text-amber-500">P1 {allocation.p1Percent || 0}%</div>
              <div className="text-amber-300">P2 {allocation.p2Percent}%</div>
              <div className="text-yellow-300">P3 {allocation.p3Percent}%</div>
              <div className="text-cyan-300">P4 {allocation.p4Percent}%</div>
              <div className="text-purple-300">P5 {allocation.p5Percent}%</div>
              <div className="text-emerald-300">DEX / LIVE {allocation.livePercent}%</div>
            </div>
          </div>

          {allocation.isLocked && (
            <div className="mt-2.5 pt-2.5 border-t border-amber-300/10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono-crypto">
              <span className="text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>FIFO Queue Registered</span>
              </span>
              <span className="text-slate-300">{allocation.lockedTimestamp || 'Active'}</span>
            </div>
          )}
        </div>
      </section>

      {/* UNIQUE FEATURE 2: INTERACTIVE "WHAT-IF" ROI & GROWTH SIMULATOR */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/35 bg-[radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.09),transparent_35%),linear-gradient(135deg,#071529_0%,#09111e_65%,#120c1a_100%)] shadow-[0_0_24px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-300/30 flex items-center justify-center text-amber-300">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300">
                  Growth & Holding Valuation Simulator
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  Simulate portfolio worth if held to future milestone targets
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-mono-crypto font-bold">
              {simCurrent.multiplier}
            </span>
          </div>

          {/* Simulator Target Selector Pills */}
          <div className="grid grid-cols-5 gap-1.5 p-1 rounded-[14px] bg-[#050b16]/80 border border-white/10 mb-3">
            {(['p2', 'p3', 'p4', 'p5', 'live'] as const).map((key) => {
              const active = simTarget === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSimTarget(key)}
                  className={`py-1.5 rounded-[10px] text-[8px] sm:text-[9px] font-rajdhani font-bold uppercase transition-all ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {key === 'live' ? 'DEX / LIVE' : key.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Simulator Results Display */}
          <div className="rounded-[16px] border border-amber-400/25 bg-[#050b16]/75 p-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-rajdhani uppercase tracking-wider">
                  Target Price
                </p>
                <div className="text-sm sm:text-base font-black font-mono-crypto text-amber-300">
                  {simCurrent.label}
                </div>
                <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto mt-0.5">
                  Multiplier: <span className="text-emerald-300 font-bold">{simCurrent.multiplier}</span>
                </p>
              </div>

              <div className="text-right border-l border-white/10 pl-2.5">
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-rajdhani uppercase tracking-wider">
                  Projected Portfolio Value
                </p>
                <div className="text-lg sm:text-xl font-black font-mono-crypto text-white">
                  {showValues ? `$${simValuation.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '••••••••'}
                </div>
                <p className="text-[7.5px] sm:text-[8px] text-emerald-300 font-mono-crypto mt-0.5">
                  +{simRoiPercent.toLocaleString(undefined, { maximumFractionDigits: 0 })}% ROI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PHASE SELL-THROUGH SCHEDULE — 6 SELL VECTORS ONLY */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-300" />
              <div>
                <h2 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300">
                  Phase Sell-Through Schedule
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  P2 → P5 sell gates + DEX / LIVE + Unallocated
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[8px] sm:text-[9px] font-mono-crypto font-bold">
              6 Vectors
            </span>
          </div>

          {/* 6-Box Grid Container — interactive with selected state */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Box 1: P2 SELL */}
            <button
              type="button"
              onClick={() => setSelectedVector('p2')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'p2'
                  ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'border border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-amber-300 font-rajdhani uppercase tracking-wider block">
                  P2 SELL
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30">
                  FIFO #5
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block">
                  {showValues ? `${(allocation.p2Tokens?.allocated || p2Tokens).toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-amber-400/90 font-semibold">
                  @ $0.10 Rate
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Est. Return:</span>
                <span className="text-emerald-300 font-black">${showValues ? p2Val.toFixed(0) : '••'}</span>
              </div>
            </button>

            {/* Box 2: P3 SELL */}
            <button
              type="button"
              onClick={() => setSelectedVector('p3')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'p3'
                  ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'border border-amber-400/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-amber-300 font-rajdhani uppercase tracking-wider block">
                  P3 SELL
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30">
                  FIFO #7
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block">
                  {showValues ? `${(allocation.p3Tokens?.allocated || p3Tokens).toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-amber-400/90 font-semibold">
                  @ $1.00 Rate
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Est. Return:</span>
                <span className="text-emerald-300 font-black">${showValues ? p3Val.toFixed(0) : '••'}</span>
              </div>
            </button>

            {/* Box 3: P4 SELL */}
            <button
              type="button"
              onClick={() => setSelectedVector('p4')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'p4'
                  ? 'border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'border border-cyan-400/30 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 font-rajdhani uppercase tracking-wider block">
                  P4 SELL
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 font-bold border border-cyan-400/30">
                  FIFO #12
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block">
                  {showValues ? `${(allocation.p4Tokens?.allocated || p4Tokens).toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-cyan-300/90 font-semibold">
                  @ $10.00 Rate
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Est. Return:</span>
                <span className="text-emerald-300 font-black">${showValues ? p4Val.toFixed(0) : '••'}</span>
              </div>
            </button>

            {/* Box 4: P5 SELL */}
            <button
              type="button"
              onClick={() => setSelectedVector('p5')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'p5'
                  ? 'border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'border border-purple-400/30 hover:border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-purple-300 font-rajdhani uppercase tracking-wider block">
                  P5 SELL
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-purple-400/15 text-purple-300 font-bold border border-purple-400/30">
                  FIFO #15
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block">
                  {showValues ? `${(allocation.p5Tokens?.allocated || p5Tokens).toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-purple-300 font-semibold">
                  @ $100.00 Rate
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Est. Return:</span>
                <span className="text-emerald-300 font-black">${showValues ? p5Val.toFixed(0) : '••'}</span>
              </div>
            </button>

            {/* Box 5: DEX / LIVE */}
            <button
              type="button"
              onClick={() => setSelectedVector('live')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'live'
                  ? 'border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : 'border border-emerald-400/30 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-300 font-rajdhani uppercase tracking-wider block">
                  DEX / LIVE
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 font-bold border border-emerald-400/30">
                  FIFO #18
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block truncate">
                  {showValues ? `${liveTokens.toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-emerald-300 font-semibold block truncate">
                  @ DEX / LIVE MARKET PRICE
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Market Value:</span>
                <span className="text-emerald-300 font-black">${showValues ? liveVal.toFixed(0) : '••'}</span>
              </div>
            </button>

            {/* Box 6: Unallocated */}
            <button
              type="button"
              onClick={() => setSelectedVector('unallocated')}
              className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 transition-all relative overflow-hidden group ${
                selectedVector === 'unallocated'
                  ? 'border-2 border-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.25)]'
                  : 'border border-slate-700/60 hover:border-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.06)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black text-slate-300 font-rajdhani uppercase tracking-wider block">
                  Unallocated
                </span>
                <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-slate-700/40 text-slate-300 font-bold border border-slate-600/40">
                  Hold
                </span>
              </div>
              <div className="my-1 sm:my-1.5">
                <span className="text-xs sm:text-sm font-black font-mono-crypto text-slate-300 block truncate">
                  {showValues ? `${unallocatedTokens.toLocaleString()} NXBC` : '••••'}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-slate-400 font-medium">
                  Hold / Flexible
                </span>
              </div>
              <div className="text-[8px] text-slate-300 font-mono-crypto flex justify-between border-t border-white/10 pt-1 mt-1">
                <span>Status:</span>
                <span className="text-amber-300 font-semibold">{allocation.unallocatedPercent}% Free</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 4. TOTAL ALLOCATED VALUE BANNER */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/35 bg-gradient-to-r from-[#081426] via-[#0d1c33] to-[#161007] p-3.5 sm:p-4 shadow-[0_0_28px_rgba(245,158,11,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-300 font-rajdhani">
              Total Projected Valuation
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono-crypto text-white flex items-center gap-2 mt-0.5">
              <span>{showValues ? `$${totalAllocatedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}</span>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold font-mono-crypto">
                USD Est.
              </span>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-1">
              Future cumulative sales projection across all 5 lock stages
            </p>
          </div>

          <div className="w-11 h-11 shrink-0 rounded-[14px] bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 p-[1.5px] shadow-[0_0_18px_rgba(245,158,11,0.3)] flex items-center justify-center">
            <div className="w-full h-full bg-[#071426] rounded-[13px] flex items-center justify-center text-amber-300">
              <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. GLOBAL FIFO EXECUTION QUEUE & TELEMETRY HUD */}
      <section className="relative overflow-hidden rounded-[22px] border border-cyan-400/25 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.06),transparent_30%),linear-gradient(135deg,#071426_0%,#06101c_65%,#050b16_100%)] shadow-[0_0_24px_rgba(6,182,212,0.06)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-300" />
              <div>
                <h2 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-cyan-300">
                  Global FIFO Execution Queue
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  Algorithmic FIFO auto-matching on BSC
                </p>
              </div>
            </div>
            <div className="px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live • 5s Sync
            </div>
          </div>

          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-400/15 text-[9px] text-emerald-200 font-mono-crypto">Automatic FIFO matching is system-controlled and cannot be manually reordered from the user dashboard.</div>

          {fifoLoading ? (
            <div className="py-4 text-center text-[10px] text-slate-400 font-mono-crypto">Loading global queue...</div>
          ) : globalFifo.length === 0 ? (
            <div className="py-4 text-center text-[10px] text-slate-400 font-mono-crypto">No active FIFO orders in queue.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {globalFifo.map((phase) => (
                <div key={phase.phaseNumber} className="rounded-[15px] border border-white/10 bg-[#050b16]/75 p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 font-rajdhani uppercase tracking-wider">
                      PHASE {phase.phaseNumber}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-300 font-mono-crypto">
                      {phase.totalOrders} orders • {phase.totalQueuedTokens.toLocaleString()} NXBC queued
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {phase.orders.slice(0, 1).map((o) => {
                      const isMine = !!walletAddress && o.walletAddress.toLowerCase() === `${walletAddress.slice(0, 6).toLowerCase()}...${walletAddress.slice(-4).toLowerCase()}`;
                      return (
                        <div
                          key={o.id}
                          className={`rounded-[12px] px-2.5 py-2 border ${
                            isMine
                              ? 'border-amber-400/40 bg-amber-400/10'
                              : 'border-white/10 bg-[#071426]/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[8px] sm:text-[9px] font-mono-crypto">
                            <span className="text-white font-bold">#{o.position} {o.walletAddress}</span>
                            <span className="text-amber-300 font-bold">{o.remainingTokens.toLocaleString()} NXBC</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto text-slate-300">
                            <span>Ahead: <strong className="text-cyan-300">{o.aheadTokens.toLocaleString()} NXBC</strong></span>
                            <span className="text-emerald-300 font-bold">@ ${o.tokenPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {phase.totalOrders > 1 && (
                    <div className="mt-1.5 text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto text-center">
                      +{phase.totalOrders - 1} more order(s) waiting in FIFO sequence
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User's Personal FIFO Orders (if any) */}
          {saleOrders.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-[9px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider mb-2">
                Your Queued Orders ({saleOrders.length})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {saleOrders.map((o) => {
                  const invite = inviteByOrder[o.id];
                  const canInvite = o.phaseNumber >= 2 && o.phaseNumber <= 5 && Number(o.remainingTokens) > 0;
                  return (
                    <div key={o.id} className="rounded-[12px] border border-white/10 bg-[#071426]/60 p-2.5 text-[8px] font-mono-crypto space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-amber-300 font-bold">Phase {o.phaseNumber}</span> · FIFO #{o.fifoNumber || o.id}
                        </div>
                        <span className="text-emerald-300 font-bold">{o.status.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-slate-300">
                        <span>Allocation: <b className="text-white">{o.amountTokens.toLocaleString()}</b></span>
                        <span>Remaining: <b className="text-amber-300">{o.remainingTokens.toLocaleString()}</b></span>
                        <span>Running: <b className="text-cyan-300">#{o.currentRunningFifoNumber || '—'}</b></span>
                        <span>Ahead: <b className="text-cyan-300">{o.positionsAhead ?? 0} orders</b></span>
                        <span>Price: <b className="text-emerald-300">${o.tokenPrice.toFixed(2)}</b></span>
                      </div>
                      {canInvite && (
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => generateDirectBuyerLink(o.id)} disabled={inviteLoading === o.id}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 border border-amber-300/30 text-amber-200 font-bold hover:bg-amber-400/25 disabled:opacity-50">
                            {inviteLoading === o.id ? 'Creating...' : 'Generate Direct Buyer Link'}
                          </button>
                          {invite && <button type="button" onClick={() => navigator.clipboard?.writeText(invite.url)} className="px-2 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-300/20 text-cyan-200">Copy</button>}
                        </div>
                      )}
                      {invite && <div className="break-all text-[7px] text-cyan-300/80">{invite.url}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. COMMUNITY & YIELD ANALYTICS */}
      <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,#081426_0%,#07101c_65%,#050b16_100%)] p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-black text-amber-300 font-rajdhani uppercase tracking-wider">
            Community & Yield Analytics
          </h3>
          <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono-crypto">Real-time stats</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* Card 1: Total Return */}
          <div className="p-3 rounded-[15px] bg-[#050b16]/80 border border-emerald-400/25 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Total Return</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-emerald-300">
                {showValues ? `+$${Math.max(0, totalAllocatedUsd - initialCostUsd).toLocaleString()}` : '••••'}
              </div>
            </div>
            
            {/* Mini Sparkline Chart SVG */}
            <div className="mt-2 pt-1 border-t border-white/10">
              <svg className="w-full h-5 stroke-emerald-400 fill-emerald-500/10" viewBox="0 0 100 25">
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2 L100,25 L0,25 Z" />
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2" fill="none" strokeWidth="2" />
              </svg>
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto">Max 40x on P5</span>
            </div>
          </div>

          {/* Card 2: Team Structure */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-purple-400/25 hover:border-purple-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-purple-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Team Structure</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-white">
                0 Directs / 0 Team
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-amber-300 font-medium">
              <span>View Hierarchy</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Level Income */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-amber-400/25 hover:border-amber-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-amber-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Level Income</span>
                <Percent className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-amber-300">
                {showValues ? `$${levelIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-emerald-300 font-mono-crypto">
              <span>10-Level Active</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Matrix Income */}
          <div
            onClick={onOpenMatrixModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-cyan-400/25 hover:border-cyan-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Matrix Income</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-cyan-300">
                {showValues ? `$${matrixIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-cyan-300 font-mono-crypto">
              <span>Placement + 10-Lvl</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


