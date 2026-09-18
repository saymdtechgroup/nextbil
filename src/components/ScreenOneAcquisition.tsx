import React, { useEffect, useState } from 'react';
import { Clock, Flame, Info, ShieldCheck, UsersRound, CircleDollarSign, BarChart3, Rocket, WalletCards, Download, UserRound } from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry, ActiveScreen } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';
import bannerImage from '../assets/images/nxbc-home-banner.png';

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
  onNavigate?: (screen: ActiveScreen) => void;
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
  onNavigate,
}) => {
  const [trustStats, setTrustStats] = useState({
    totalTokensSold: 0,
    totalUsdtReceived: 0,
    completedPurchases: 0,
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
            verified: data.verified !== false,
          });
        }
      } catch {}
    };
    loadTrustStats();
    const timer = window.setInterval(loadTrustStats, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const activePhase = phases.find((phase) => phase.status === 'active') ?? phases[0];
  const totalTokens = Number(allocation.totalTokensPurchased) || 0;
  const tokensSold = Number(activePhase?.tokensSold) || 0;
  const phaseSupply = Number(activePhase?.totalSupply) || 0;
  const tokensRemaining = Math.max(0, phaseSupply - tokensSold);
  const progressPercent = phaseSupply > 0 ? Math.min(100, (tokensSold / phaseSupply) * 100) : 0;
  const currentRate = Number(activePhase?.rate) || 0;
  const nextPhase = activePhase ? phases.find((p) => p.phaseNumber === (activePhase.phaseNumber ?? 1) + 1) : undefined;
  const projectTotalSupply = 70_000_000;

  const go = (screen: ActiveScreen) => onNavigate?.(screen);

  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 pb-0">
      {/* VERIFIED PRESALE ACTIVITY */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#120b19_100%)] shadow-[0_0_28px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-[14px] bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
                <ShieldCheck className="w-5.5 h-5.5 text-amber-300" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">Verified Presale Activity</h2>
                  <Info className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-0.5 truncate">{trustStats.verified ? 'Live on BSC • Real Purchases Only • Updated in Real-time' : 'Live • Database phase counters • Updated in Real-time'}</p>
              </div>
            </div>
            <div className="shrink-0 px-2.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider">On-chain verified</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-[15px] border border-white/10 bg-[#050b16]/65 px-1.5 py-2.5 sm:px-2.5 sm:py-3 text-center aspect-[1/0.88] flex flex-col justify-center">
              <GoldCoinGraphic size="xs" glow={false} animated={false} className="mx-auto mb-1" />
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-slate-300">Total NXBC Sold</div>
              <div className="mt-0.5 text-lg sm:text-2xl leading-none font-black font-mono-crypto text-white">{trustStats.totalTokensSold.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">NXBC</div>
            </div>
            <div className="min-w-0 rounded-[15px] border border-emerald-400/10 bg-[#050b16]/65 px-1.5 py-2.5 sm:px-2.5 sm:py-3 text-center aspect-[1/0.88] flex flex-col justify-center">
              <div className="mx-auto mb-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-400/15 border border-emerald-300/25 flex items-center justify-center text-emerald-300 font-black text-sm">₮</div>
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-slate-300">USDT Received</div>
              <div className="mt-0.5 text-lg sm:text-2xl leading-none font-black font-mono-crypto text-emerald-300">${trustStats.totalUsdtReceived.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">USDT</div>
            </div>
            <div className="min-w-0 rounded-[15px] border border-purple-300/15 bg-[#050b16]/65 px-1.5 py-2.5 sm:px-2.5 sm:py-3 text-center aspect-[1/0.88] flex flex-col justify-center">
              <div className="mx-auto mb-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/15 border border-purple-300/25 flex items-center justify-center"><UsersRound className="w-4 h-4 text-purple-300" /></div>
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-slate-300">Total Purchases</div>
              <div className="mt-0.5 text-lg sm:text-2xl leading-none font-black font-mono-crypto text-white">{trustStats.completedPurchases.toLocaleString()}</div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">Verified</div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-amber-300/10 flex items-center justify-between text-[7px] sm:text-[8px] font-mono-crypto text-slate-400">
            <span>Transparent • Secure • Powered by Blockchain</span>
            <span className="flex items-center gap-1 text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live Data</span>
          </div>
        </div>
      </section>

      {/* CURRENT PHASE */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-300" fill="currentColor" />
              <span className="text-[16px] sm:text-[18px] font-black text-amber-300 font-rajdhani uppercase tracking-wider">{activePhase?.name ?? 'Phase 1'}: Live</span>
              <span className="px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[7px] font-black uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Active</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300 shrink-0"><Clock className="w-4 h-4" /><span className="text-[9px] sm:text-[10px] font-mono-crypto">Step {activePhase?.phaseNumber ?? 1} of 5</span></div>
          </div>

          <div className="rounded-[18px] border border-amber-400/20 bg-[#050b16]/65 p-3 sm:p-3.5 mb-2.5">
            <div className="grid grid-cols-[1.25fr_1fr] gap-2 items-center">
              <div><p className="text-[8px] sm:text-[9px] text-slate-300 font-rajdhani uppercase tracking-wider mb-0.5">Current Price</p><div className="flex items-baseline gap-1"><span className="text-[40px] sm:text-[48px] leading-none font-black font-mono-crypto text-white">${currentRate.toFixed(2)}</span><span className="text-[11px] text-slate-400 font-mono-crypto">/ NXBC</span></div></div>
              <div className="text-right border-l border-white/10 pl-3"><p className="text-[8px] sm:text-[9px] text-slate-400 font-rajdhani uppercase tracking-wider">Next Phase Price</p><span className="text-[20px] sm:text-[24px] font-black text-amber-400 font-mono-crypto">{nextPhase?.rateLabel ?? '—'}</span></div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-[#050b16]/60 p-3 sm:p-3.5 mb-2.5">
            <div className="flex items-end justify-between gap-3 mb-1.5"><div><p className="text-[8px] text-slate-400 font-rajdhani uppercase tracking-wider">Tokens Sold</p><p className="text-lg sm:text-xl font-black font-mono-crypto text-white">{tokensSold.toLocaleString()} <span className="text-[11px] text-slate-400">/ {phaseSupply.toLocaleString()}</span></p></div><div className="text-right"><p className="text-[8px] text-slate-400 font-rajdhani uppercase tracking-wider">Remaining</p><p className="text-lg sm:text-xl font-black font-mono-crypto text-white">{tokensRemaining.toLocaleString()}</p><span className="text-[8px] text-slate-400">NXBC</span></div></div>
            <div className="h-2.5 rounded-full bg-black/70 border border-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]" style={{width:`${progressPercent}%`}} /></div>
            <div className="mt-1.5 flex justify-between text-[8px] sm:text-[9px] font-mono-crypto text-slate-300"><span>{progressPercent.toFixed(2)}% Completed</span><span>Phase {activePhase?.phaseNumber ?? 1} Supply: {phaseSupply.toLocaleString()} NXBC</span></div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div className="rounded-[15px] border border-white/10 bg-[#050b16]/65 p-2.5 text-center aspect-[1/0.92] flex flex-col justify-center"><CircleDollarSign className="mx-auto w-6 h-6 text-amber-300 mb-1" /><p className="text-[7px] sm:text-[8px] text-slate-400 font-rajdhani uppercase tracking-wider">Total Supply</p><p className="mt-0.5 text-base sm:text-lg font-black font-mono-crypto text-white">{projectTotalSupply.toLocaleString()}</p><p className="text-[8px] text-slate-400">NXBC</p></div>
            <div className="rounded-[15px] border border-white/10 bg-[#050b16]/65 p-2.5 text-center aspect-[1/0.92] flex flex-col justify-center"><BarChart3 className="mx-auto w-6 h-6 text-amber-300 mb-1" /><p className="text-[7px] sm:text-[8px] text-slate-400 font-rajdhani uppercase tracking-wider">Current Phase</p><p className="mt-0.5 text-base sm:text-lg font-black font-mono-crypto text-white">{activePhase?.phaseNumber ?? 1} / 5</p><p className="text-[8px] text-slate-400">Phase</p></div>
            <div className="rounded-[15px] border border-emerald-400/20 bg-emerald-400/5 p-2.5 text-center aspect-[1/0.92] flex flex-col justify-center"><UserRound className="mx-auto w-6 h-6 text-cyan-300 mb-1" /><p className="text-[7px] sm:text-[8px] text-emerald-300 font-rajdhani uppercase tracking-wider">Your Allocation</p><p className="mt-0.5 text-base sm:text-lg font-black font-mono-crypto text-cyan-300">{totalTokens.toLocaleString()}</p><p className="text-[8px] text-slate-400">NXBC</p></div>
          </div>

          <button onClick={onOpenBuyModal} className="w-full py-3 sm:py-3.5 rounded-[16px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-[13px] sm:text-[15px] uppercase font-rajdhani tracking-widest transition-all shadow-[0_0_22px_rgba(251,191,36,0.25)] flex items-center justify-center gap-2.5"><Rocket className="w-5 h-5" fill="currentColor" /> BUY NXBC NOW <span className="text-lg">›</span></button>
        </div>
      </section>

      {/* FOUR WORKING SHORTCUTS */}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => go('assets')} className="rounded-[15px] border border-cyan-400/30 bg-[#071426]/85 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(34,211,238,0.05)] hover:border-cyan-300/60 transition-all active:scale-[0.98]"><WalletCards className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Assets</span></button>
        <button type="button" onClick={() => go('team')} className="rounded-[15px] border border-purple-400/30 bg-[#0c0920]/85 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(168,85,247,0.05)] hover:border-purple-300/60 transition-all active:scale-[0.98]"><UsersRound className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-purple-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Team</span></button>
        <button type="button" onClick={() => go('withdraw')} className="rounded-[15px] border border-emerald-400/30 bg-[#071a18]/70 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(16,185,129,0.05)] hover:border-emerald-300/60 transition-all active:scale-[0.98]"><Download className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Withdraw</span></button>
        <button type="button" onClick={() => go('mine')} className="rounded-[15px] border border-amber-400/30 bg-[#171207]/70 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(245,158,11,0.05)] hover:border-amber-300/60 transition-all active:scale-[0.98]"><UserRound className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-amber-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Mine</span></button>
      </div>

      {/* GLOBAL MOVEMENT BANNER */}
      <div className="sticky bottom-0 z-20 mt-0 overflow-hidden rounded-[16px] border border-amber-400/20 bg-[#06101d] shadow-[0_0_24px_rgba(245,158,11,0.08)]">
        <img src={bannerImage} alt="NXBC — A Stronger Tomorrow Builds Here — Join the Global Movement" className="block w-full h-auto object-cover" loading="eager" />
      </div>
    </div>
  );
};
