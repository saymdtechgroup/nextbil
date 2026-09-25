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
  nxbcBalance?: number;
  usdtBalance?: number;
  totalEarningUsdt?: number;
  totalWithdrawnUsdt?: number;
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
        const res = await fetch('/api/presale/trust-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nxbc_admin_token')}`
          }
        });
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
  const projectTotalSupply = phases.reduce((sum, phase) => sum + (Number(phase.totalSupply) || 0), 0);

  const go = (screen: ActiveScreen) => {
    // Home shortcut navigation: delegate to App's single-screen router.
    if (typeof onNavigate === 'function') {
      onNavigate(screen);
    }
  };

  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 pb-0">
      {/* Wallet Connection / Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-300 font-medium">
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Guest Wallet'}
          </span>
        </div>
        {!walletConnected && (
          <button onClick={onOpenWalletModal} className="px-3 py-1 text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg">
            Connect
          </button>
        )}
      </div>

      {/* Animated Coin */}
      <div className="flex justify-center my-6">
        <GoldCoinGraphic size="hero" animated={true} />
      </div>

      {/* Presale Status Card */}
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {activePhase?.name ?? 'Phase 1'} • LIVE PRESALE • ${currentRate.toFixed(2)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-[#050b16]/65 p-3 text-center">
          <p className="text-[9px] text-slate-400 uppercase">Total Holders</p>
          <p className="text-lg font-black text-white">1</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#050b16]/65 p-3 text-center">
          <p className="text-[9px] text-slate-400 uppercase">Total Earned</p>
          <p className="text-lg font-black text-emerald-300">$0.00</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#050b16]/65 p-3 text-center">
          <p className="text-[9px] text-slate-400 uppercase">Withdrawn</p>
          <p className="text-lg font-black text-rose-300">$0.00</p>
        </div>
      </div>

      {/* Buy Button */}
      <button onClick={onOpenBuyModal} className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2">
        <Rocket className="w-5 h-5" />
        BUY NXBC TOKEN • ${currentRate.toFixed(2)}
      </button>

      {/* FOUR WORKING SHORTCUTS */}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" aria-label="Open Assets" data-home-shortcut="assets" onClick={() => go('assets')} className="rounded-[15px] border border-cyan-400/30 bg-[#071426]/85 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(34,211,238,0.05)] hover:border-cyan-300/60 transition-all active:scale-[0.98]"><WalletCards className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Assets</span></button>
        <button type="button" aria-label="Open Team" data-home-shortcut="team" onClick={() => go('team')} className="rounded-[15px] border border-purple-400/30 bg-[#0c0920]/85 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(168,85,247,0.05)] hover:border-purple-300/60 transition-all active:scale-[0.98]"><UsersRound className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-purple-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Team</span></button>
        <button type="button" aria-label="Open Withdraw" data-home-shortcut="withdraw" onClick={() => go('withdraw')} className="rounded-[15px] border border-emerald-400/30 bg-[#071a18]/70 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(16,185,129,0.05)] hover:border-emerald-300/60 transition-all active:scale-[0.98]"><Download className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Withdraw</span></button>
        <button type="button" aria-label="Open Mine" data-home-shortcut="mine" onClick={() => go('mine')} className="rounded-[15px] border border-amber-400/30 bg-[#171207]/70 p-2.5 sm:p-3 text-center shadow-[0_0_18px_rgba(245,158,11,0.05)] hover:border-amber-300/60 transition-all active:scale-[0.98]"><UserRound className="mx-auto w-6 h-6 sm:w-7 sm:h-7 text-amber-300 mb-1.5" /><span className="text-[10px] sm:text-[12px] font-rajdhani font-bold text-slate-100">Mine</span></button>
      </div>

      {/* GLOBAL MOVEMENT BANNER */}
      <div className="nxbc-home-banner fixed bottom-0 left-0 right-0 z-50 w-full overflow-hidden rounded-none border border-amber-400/20 bg-[#06101d] shadow-[0_0_24px_rgba(245,158,11,0.08)] md:static md:rounded-[16px]">
        <img src={bannerImage} alt="NXBC — A Stronger Tomorrow Builds Here — Join the Global Movement" className="block w-full h-auto object-cover" loading="eager" />
      </div>
    </div>
  );
};
