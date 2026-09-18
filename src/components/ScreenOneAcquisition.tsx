import React, { useEffect, useState } from 'react';
import {
  Clock,
  Flame,
  Info,
  BookOpen,
  FileText,
  BarChart3,
  ShieldCheck,
  UsersRound,
  CircleDollarSign,
  Rocket,
} from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';

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
      } catch {
        // Keep the last known values on transient network errors.
      }
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
  const phaseSupply = Number(activePhase?.totalSupply) || 0;
  const tokensRemaining = Math.max(0, phaseSupply - tokensSold);
  const progressPercent = phaseSupply > 0 ? Math.min(100, (tokensSold / phaseSupply) * 100) : 0;
  const currentRate = Number(activePhase?.rate) || 0;
  const nextPhase = activePhase
    ? phases.find((phase) => phase.phaseNumber === (activePhase.phaseNumber ?? 1) + 1)
    : undefined;

  // Keep the project-level supply as a display metric; phase supply/progress remain live DB values.
  const projectTotalSupply = 50_000_000;

  return (
    <div className="nxbc-screen flex-1 px-4 py-4 sm:px-5 sm:py-5 space-y-4 max-w-xl mx-auto w-full">
      {/* HOME — VERIFIED PRESALE ACTIVITY */}
      <section className="relative overflow-hidden rounded-[26px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.08),transparent_30%),linear-gradient(135deg,#081426_0%,#07101c_55%,#130a1d_100%)] shadow-[0_0_35px_rgba(245,158,11,0.10)]">
        <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none" />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-300/25 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.10)]">
                <ShieldCheck className="w-7 h-7 text-amber-300" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">
                    Verified Presale Activity
                  </h2>
                  <Info className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-300/80 font-mono-crypto mt-1">
                  {trustStats.verified ? 'Live on BSC • Real Purchases Only • Updated in Real-time' : 'Live • Database phase counters • Updated in Real-time'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/35 shadow-[0_0_20px_rgba(16,185,129,0.10)]">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                {trustStats.verified ? 'On-chain verified' : 'Database total'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/10 rounded-[20px] border border-white/10 bg-[#050b16]/60 overflow-hidden">
            <div className="px-2 py-4 sm:px-4 sm:py-5 text-center">
              <div className="mx-auto mb-2 w-11 h-11 rounded-full border border-amber-300/25 bg-amber-400/10 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.12)]">
                <GoldCoinGraphic size="sm" glow={false} animated={false} />
              </div>
              <div className="text-[8px] sm:text-[10px] font-rajdhani uppercase tracking-wider text-slate-300">Total NXBC Sold</div>
              <div className="mt-1 text-2xl sm:text-4xl leading-none font-black font-mono-crypto text-white">
                {trustStats.totalTokensSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-rajdhani text-slate-200">NXBC</div>
            </div>

            <div className="px-2 py-4 sm:px-4 sm:py-5 text-center">
              <div className="mx-auto mb-2 w-11 h-11 rounded-full border border-emerald-300/30 bg-emerald-400/15 flex items-center justify-center text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.12)]">
                <span className="text-2xl font-black leading-none">₮</span>
              </div>
              <div className="text-[8px] sm:text-[10px] font-rajdhani uppercase tracking-wider text-slate-300">USDT Received</div>
              <div className="mt-1 text-2xl sm:text-4xl leading-none font-black font-mono-crypto text-emerald-300">
                ${trustStats.totalUsdtReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-rajdhani text-slate-200">USDT</div>
            </div>

            <div className="px-2 py-4 sm:px-4 sm:py-5 text-center">
              <div className="mx-auto mb-2 w-11 h-11 rounded-full border border-purple-300/25 bg-purple-500/15 flex items-center justify-center text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.12)]">
                <UsersRound className="w-6 h-6" />
              </div>
              <div className="text-[8px] sm:text-[10px] font-rajdhani uppercase tracking-wider text-slate-300">Total Purchases</div>
              <div className="mt-1 text-2xl sm:text-4xl leading-none font-black font-mono-crypto text-white">
                {trustStats.completedPurchases.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-rajdhani text-slate-200">Completed</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-300/15 flex items-center justify-between gap-3 text-[8px] sm:text-[10px] font-mono-crypto text-slate-400">
            <span>Transparent • Secure • Powered by Blockchain</span>
            <span className="flex items-center gap-1.5 text-emerald-300 shrink-0"><span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Live Data</span>
          </div>
        </div>
      </section>

      {/* HOME — CURRENT PHASE */}
      <section className="relative overflow-hidden rounded-[28px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.08),transparent_28%),linear-gradient(135deg,#071426_0%,#09101c_60%,#17120b_100%)] shadow-[0_0_35px_rgba(245,158,11,0.08)]">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Flame className="w-7 h-7 text-amber-300" fill="currentColor" />
              <span className="text-lg sm:text-xl font-black text-amber-300 font-rajdhani uppercase tracking-wider">
                {activePhase?.name ?? 'Phase 1'}: Live
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/35 text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
              <Clock className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-mono-crypto">Step {activePhase?.phaseNumber ?? 1} / 5</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-amber-400/25 bg-[#050b16]/65 p-4 sm:p-5 mb-3">
            <div className="grid grid-cols-[1.35fr_1fr] gap-3 items-center">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-300 font-rajdhani uppercase tracking-wider mb-1">Current Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black font-mono-crypto text-white">${currentRate.toFixed(2)}</span>
                  <span className="text-sm sm:text-base text-slate-400 font-mono-crypto">/ NXBC</span>
                </div>
              </div>
              <div className="text-right border-l border-white/10 pl-4">
                <p className="text-[9px] sm:text-xs text-slate-400 font-rajdhani uppercase tracking-wider mb-1">Next Phase Price</p>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-crypto">{nextPhase?.rateLabel ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#050b16]/60 p-4 sm:p-5 mb-3">
            <div className="flex items-end justify-between gap-4 mb-2">
              <div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider">Tokens Sold</p>
                <p className="text-xl sm:text-2xl font-black font-mono-crypto text-white">{tokensSold.toLocaleString()} <span className="text-sm text-slate-400">/ {phaseSupply.toLocaleString()}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider">Remaining</p>
                <p className="text-xl sm:text-2xl font-black font-mono-crypto text-white">{tokensRemaining.toLocaleString()}</p>
                <span className="text-[9px] text-slate-400">NXBC</span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-black/70 border border-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 shadow-[0_0_14px_rgba(245,158,11,0.55)]" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] sm:text-xs font-mono-crypto text-slate-300">
              <span>{progressPercent.toFixed(2)}% Completed</span>
              <span>Phase {activePhase?.phaseNumber ?? 1} Supply: {phaseSupply.toLocaleString()} NXBC</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="rounded-[20px] border border-white/10 bg-[#050b16]/65 p-3 sm:p-4 text-center">
              <CircleDollarSign className="mx-auto w-8 h-8 text-amber-300 mb-2" />
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider">Total Supply</p>
              <p className="mt-1 text-lg sm:text-xl font-black font-mono-crypto text-white">{projectTotalSupply.toLocaleString()}</p>
              <p className="text-[9px] sm:text-xs text-slate-400">NXBC</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#050b16]/65 p-3 sm:p-4 text-center">
              <BarChart3 className="mx-auto w-8 h-8 text-amber-300 mb-2" />
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider">Current Phase</p>
              <p className="mt-1 text-lg sm:text-xl font-black font-mono-crypto text-white">{activePhase?.phaseNumber ?? 1} / 5</p>
            </div>
            <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/5 p-3 sm:p-4 text-center">
              <UsersRound className="mx-auto w-8 h-8 text-cyan-300 mb-2" />
              <p className="text-[9px] sm:text-[10px] text-emerald-300 font-rajdhani uppercase tracking-wider">Your Allocation</p>
              <p className="mt-1 text-lg sm:text-xl font-black font-mono-crypto text-cyan-300">{totalTokens.toLocaleString()}</p>
              <p className="text-[9px] sm:text-xs text-slate-400">NXBC</p>
            </div>
          </div>

          <button
            onClick={onOpenBuyModal}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm sm:text-base uppercase font-rajdhani tracking-widest transition-all shadow-[0_0_25px_rgba(251,191,36,0.30)] hover:shadow-[0_0_35px_rgba(251,191,36,0.45)] flex items-center justify-center gap-3"
          >
            <Rocket className="w-5 h-5" fill="currentColor" />
            BUY NXBC NOW
          </button>
        </div>
      </section>

      {/* HOME — REFERENCE QUICK LINKS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button type="button" onClick={onOpenBuyModal} className="rounded-2xl border border-cyan-400/25 bg-[#071426]/80 p-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.06)] hover:border-cyan-300/50 transition-colors">
          <BookOpen className="mx-auto w-8 h-8 text-cyan-300 mb-2" />
          <span className="text-xs sm:text-sm font-rajdhani font-bold text-slate-100">How to Buy</span>
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="rounded-2xl border border-cyan-400/25 bg-[#071426]/80 p-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.06)] hover:border-cyan-300/50 transition-colors">
          <FileText className="mx-auto w-8 h-8 text-cyan-300 mb-2" />
          <span className="text-xs sm:text-sm font-rajdhani font-bold text-slate-100">Whitepaper</span>
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="rounded-2xl border border-cyan-400/25 bg-[#071426]/80 p-4 text-center shadow-[0_0_20px_rgba(34,211,238,0.06)] hover:border-cyan-300/50 transition-colors">
          <BarChart3 className="mx-auto w-8 h-8 text-purple-300 mb-2" />
          <span className="text-xs sm:text-sm font-rajdhani font-bold text-slate-100">Roadmap</span>
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="rounded-2xl border border-amber-400/25 bg-[#071426]/80 p-4 text-center shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-amber-300/50 transition-colors">
          <ShieldCheck className="mx-auto w-8 h-8 text-emerald-300 mb-2" />
          <span className="text-xs sm:text-sm font-rajdhani font-bold text-slate-100">Smart Contract</span>
        </button>
      </div>

      {/* HOME — GLOBAL MOVEMENT BANNER */}
      <div className="overflow-hidden rounded-2xl border border-amber-400/25 bg-[#06101d] shadow-[0_0_28px_rgba(245,158,11,0.10)]">
        <img
          src="/nxbc-home-banner.png"
          alt="NXBC — A Stronger Tomorrow Builds Here — Join the Global Movement"
          className="block w-full h-auto object-cover"
          loading="eager"
        />
      </div>
    </div>
  );
};
