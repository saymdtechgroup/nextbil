import React, { useState, useEffect } from 'react';
import { Clock, Flame, Info, Sparkles, TrendingUp, ArrowRight, Wallet, DollarSign, Activity, ShieldCheck, CheckCircle2, Layers, Zap } from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry } from '../types/crypto';

interface ScreenOneAcquisitionProps {
  allocation: AllocationState;
  phases: PhaseConfig[];
  onUpdateAllocation: (newAlloc: AllocationState) => void;
  onOpenBuyModal: () => void;
  onOpenWalletModal: () => void;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  onSimulateFillPhase?: () => void;
  onSimulateExternalBuy?: (amount?: number) => void;
  onResetPhases?: () => void;
  onViewFIFO?: () => void;
  sellQueue?: QueueEntry[];
  walletConnected: boolean;
  walletAddress: string;
  totalEarningUsdt: number;
  totalWithdrawnUsdt: number;
}

export const ScreenOneAcquisition: React.FC<ScreenOneAcquisitionProps> = ({
  allocation,
  phases,
  onOpenBuyModal,
  onOpenWalletModal,
  onViewFIFO,
  sellQueue = [],
  walletConnected,
  walletAddress,
  totalEarningUsdt,
  totalWithdrawnUsdt,
}) => {
  const [trustStats, setTrustStats] = useState({
    totalTokensSold: 0,
    totalUsdtReceived: 0,
    completedPurchases: 0,
    source: 'verified_transactions',
    verified: true,
  });

  useEffect(() => {
    let cancelled = false;
    const loadTrustStats = async () => {
      try {
        const res = await fetch('/api/presale/trust-stats');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) {
          setTrustStats({
            totalTokensSold: Number(data.totalTokensSold || 0),
            totalUsdtReceived: Number(data.totalUsdtReceived || 0),
            completedPurchases: Number(data.completedPurchases || 0),
            source: data.source || 'verified_transactions',
            verified: data.verified !== false,
          });
        }
      } catch {}
    };
    loadTrustStats();
    const timer = window.setInterval(loadTrustStats, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const activePhase = phases.find((phase) => phase.status === 'active') ?? phases[0];
  const totalTokens = Number(allocation.totalTokensPurchased) || 0;
  const tokensSold = Number(activePhase?.tokensSold) || 0;
  const totalSupply = Number(activePhase?.totalSupply) || 0;
  const tokensRemaining = Math.max(0, totalSupply - tokensSold);
  const progressPercent = totalSupply > 0 ? Math.min(100, (tokensSold / totalSupply) * 100) : 0;
  const currentRate = Number(activePhase?.rate) || 0;
  const nextPhase = activePhase
    ? phases.find((phase) => phase.phaseNumber === (activePhase.phaseNumber ?? 1) + 1)
    : undefined;

  // Active presale running phase
  const currentRunningPhase = activePhase?.phaseNumber ?? 1;
  // Next phase whose queue is scheduled to execute
  const nextTargetPhase = Math.min(5, currentRunningPhase + 1);

  // Automatically default filter to the NEXT phase relative to the running presale
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number>(nextTargetPhase);

  useEffect(() => {
    setSelectedPhaseFilter(nextTargetPhase);
  }, [nextTargetPhase]);

  // Live FIFO status only — no demo/benchmark queue is used.
  // The first open/partially-filled real DB order is the current running FIFO order.
  const liveFifoOrders = (sellQueue || [])
    .filter((entry) =>
      Number(entry.phaseNumber) >= 2 &&
      Number(entry.phaseNumber) <= 5 &&
      Number(entry.tokensRequested || 0) > Number(entry.tokensSold || 0)
    )
    .sort((a, b) => Number(a.id) - Number(b.id));
  const currentFifoOrder = liveFifoOrders[0];

  return (
    <div className="nxbc-screen flex-1 px-4 py-4 space-y-4 max-w-xl mx-auto w-full">


      {/* Verified Presale Trust / Treasury Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-[#1a0d2c] via-[#10071d] to-[#08030f] shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="absolute -bottom-14 -left-10 w-28 h-28 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-[10px] font-rajdhani font-bold uppercase tracking-[0.16em] text-amber-300">
                  Presale Activity
                </div>
                <div className="text-[9px] text-slate-400 font-mono-crypto">
                  {trustStats.verified ? 'Live • Completed BSC purchases only' : 'Live • Database phase counters'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">{trustStats.verified ? 'On-chain verified' : 'Database total'}</span>
            </div>
          </div>

          <div className="nxbc-home-trust-grid grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-black/20 border border-white/5 p-2.5">
              <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">NXBC Sold</div>
              <div className="text-base font-black font-mono-crypto text-slate-100">
                {trustStats.totalTokensSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-[8px] text-cyan-300/60 mt-0.5">On-chain</div>
            </div>

            <div className="rounded-xl bg-black/20 border border-emerald-400/10 p-2.5">
              <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">USDT Received</div>
              <div className="text-base font-black font-mono-crypto text-emerald-300">
                ${trustStats.totalUsdtReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[8px] text-emerald-300/50 mt-0.5">Treasury</div>
            </div>

            <div className="rounded-xl bg-black/20 border border-cyan-400/10 p-2.5">
              <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">Purchases</div>
              <div className="text-base font-black font-mono-crypto text-cyan-300">
                {trustStats.completedPurchases.toLocaleString()}
              </div>
              <div className="text-[8px] text-cyan-300/50 mt-0.5">Completed</div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-500 font-mono-crypto">
            <span>{trustStats.completedPurchases.toLocaleString()} completed purchases</span>
            <span>Updates automatically</span>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#130722] to-[#0a0312] p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-12 h-12 text-emerald-400" /></div>
          <span className="text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider block mb-1">Total Earnings</span>
          <span className="text-2xl font-black font-mono-crypto text-emerald-400 block">${totalEarningUsdt.toFixed(2)}</span>
        </div>
        <div className="bg-gradient-to-br from-[#130722] to-[#0a0312] p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-12 h-12 text-cyan-400" /></div>
          <span className="text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider block mb-1">Total Withdrawn</span>
          <span className="text-2xl font-black font-mono-crypto text-cyan-400 block">${totalWithdrawnUsdt.toFixed(2)}</span>
        </div>
      </div>

      {/* Live Presale Phase Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#1c0d33] to-[#0d041a] border border-amber-500/20 overflow-hidden shadow-2xl shadow-amber-500/10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="p-5 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg backdrop-blur-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 font-rajdhani uppercase tracking-wider">{activePhase?.name ?? 'Phase'}: Live</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono-crypto">Step {activePhase?.phaseNumber ?? 1}/5</span>
            </div>
          </div>

          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] text-slate-400 font-rajdhani uppercase tracking-wider mb-1">Current Coin Price</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black font-mono-crypto text-white">${currentRate.toFixed(2)}</span>
                <span className="text-sm font-medium text-slate-500 font-mono-crypto">/ NXBC</span>
              </div>
            </div>
            <div className="text-right pb-1.5">
              <p className="text-[10px] text-slate-500 font-rajdhani uppercase tracking-wider mb-0.5">{nextPhase ? `Next Phase` : 'Listing'}</p>
              <span className="text-base font-bold text-amber-500/80 font-mono-crypto">{nextPhase?.rateLabel ?? '$0.50'}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <div className="bg-black/40 rounded-xl p-3.5 border border-white/5 backdrop-blur-md">
              <span className="text-[9px] text-slate-400 uppercase font-rajdhani tracking-wider block mb-1">Phase Supply</span>
              <span className="text-sm font-black font-mono-crypto text-slate-200">{totalSupply.toLocaleString()}</span>
            </div>
            <div className="bg-[#0b1424]/80 rounded-xl p-3.5 border border-cyan-500/15 backdrop-blur-md">
              <span className="text-[9px] text-cyan-300/70 uppercase font-rajdhani tracking-wider block mb-1">Phase Progress</span>
              <span className="text-sm font-black font-mono-crypto text-cyan-300">{progressPercent.toFixed(2)}%</span>
            </div>
            <div className="bg-black/40 rounded-xl p-3.5 border border-white/5 backdrop-blur-md">
              <span className="text-[9px] text-slate-400 uppercase font-rajdhani tracking-wider block mb-1">Remaining</span>
              <span className="text-sm font-bold font-mono-crypto text-slate-300">{tokensRemaining.toLocaleString()}</span>
            </div>
            <div className="bg-[#0b1f1a]/60 rounded-xl p-3.5 border border-emerald-500/20 backdrop-blur-md">
              <span className="text-[9px] text-emerald-400/70 uppercase font-rajdhani tracking-wider block mb-1">Your Allocation</span>
              <span className="text-sm font-black font-mono-crypto text-emerald-400">{totalTokens.toLocaleString()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-7">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] text-slate-400 font-rajdhani uppercase tracking-wider">Phase Progress</span>
              <span className="text-xs font-bold text-amber-400 font-mono-crypto">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/60 border border-white/5 overflow-hidden backdrop-blur-md">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>

          {/* Call to Action */}
          <button 
            onClick={onOpenBuyModal} 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-900 font-black text-sm uppercase font-rajdhani tracking-widest transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            BUY NXBC NOW
          </button>
        </div>
      </div>

      {/* NXBC GLOBAL MOVEMENT BANNER */}
      <div className="overflow-hidden rounded-2xl border border-amber-400/20 bg-[#06101d] shadow-[0_0_28px_rgba(245,158,11,0.08)]">
        <img
          src="/nxbc-home-banner.png"
          alt="NXBC — A Stronger Tomorrow Builds Here — Join the Global Movement"
          className="block w-full h-auto object-cover"
          loading="lazy"
        />
      </div>

      {/* LIVE FIFO STATUS — REAL DATABASE DATA ONLY */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#120824] border border-blue-500/25 p-4 sm:p-5 shadow-xl shadow-blue-950/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black font-rajdhani uppercase tracking-wider text-slate-100">
                Live FIFO Status
              </div>
              <div className="text-[10px] text-slate-400 font-mono-crypto mt-0.5">
                Real active sell order only • No demo data
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-crypto uppercase whitespace-nowrap">
            P{currentRunningPhase} Running
          </span>
        </div>

        {currentFifoOrder ? (
          <div className="mt-3 rounded-xl bg-black/30 border border-emerald-500/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-rajdhani">Now Serving</div>
                <div className="text-2xl font-black text-emerald-300 font-mono-crypto">
                  #{currentFifoOrder.id}
                </div>
              </div>
              <div className="text-right min-w-0">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-rajdhani">Seller Wallet</div>
                <div className="text-[11px] text-slate-200 font-mono-crypto truncate max-w-[180px] sm:max-w-[260px]">
                  {currentFifoOrder.userId}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-500 font-mono-crypto">
              This number comes from the live FIFO sell-order database.
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-black/20 border border-white/5 p-4 text-center">
            <div className="text-xs font-bold text-slate-300 font-rajdhani uppercase tracking-wider">
              No active FIFO order yet
            </div>
            <div className="text-[9px] text-slate-500 font-mono-crypto mt-1">
              The current FIFO number will appear here when a real sell order is active.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};