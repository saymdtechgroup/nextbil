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
  onOpenWalletModal,
  onOpenTeamPlanModal,
  onNavigate,
  walletConnected,
  walletAddress,
  nxbcBalance = 0,
  usdtBalance = 0,
  totalEarningUsdt = 0,
  totalWithdrawnUsdt = 0,
}) => {
  const activePhase = phases.find((p) => p.status === 'active') || phases[0];
  const [totalHolders, setTotalHolders] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/presale/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (typeof data.uniqueBuyers === 'number') {
          setTotalHolders(data.uniqueBuyers);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="nxbc-screen flex-1 p-3 sm:p-4 space-y-3.5 max-w-xl mx-auto w-full">
      {/* 1. Header Bar: Profile & Balance Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1.5px] shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <div className="w-full h-full bg-[#081220] rounded-full flex items-center justify-center text-amber-300 font-bold text-xs font-mono-crypto">
              {walletConnected && walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'NX'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-200 font-rajdhani flex items-center gap-1.5">
              <span>{walletConnected && walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Guest Wallet'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[9px] text-amber-300/80 font-mono-crypto">
              {walletConnected ? `${nxbcBalance.toLocaleString()} NXBC` : 'Connect Wallet'}
            </div>
          </div>
        </div>

        <button
          onClick={walletConnected ? () => onNavigate?.('wallet') : onOpenWalletModal}
          className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold font-rajdhani tracking-wide hover:bg-amber-400/30 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
        >
          <CircleDollarSign className="w-3 h-3 text-amber-300" />
          <span>{walletConnected ? `$${usdtBalance.toFixed(2)} USDT` : 'Connect'}</span>
        </button>
      </div>

      {/* 2. Coin Hero Visual */}
      <div className="relative flex flex-col items-center justify-center py-1">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/10 to-transparent blur-2xl pointer-events-none" />
          <GoldCoinGraphic className="w-full h-full drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]" />
        </div>

        {/* Phase Pill */}
        <div className="mt-1 flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1829]/90 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-xs font-black font-rajdhani tracking-wider text-amber-300 uppercase">
            {activePhase.name} • LIVE PRESALE
          </span>
          <span className="text-[10px] font-bold font-mono-crypto text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/25">
            {activePhase.rateLabel}
          </span>
        </div>
      </div>

      {/* 3. Live Metrics Mini-HUD */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] bg-[#071322]/80 border border-amber-400/20 p-2 text-center shadow-[0_0_12px_rgba(245,158,11,0.05)]">
          <div className="text-[8px] sm:text-[9px] uppercase font-rajdhani text-slate-400">Total Holders</div>
          <div className="text-xs sm:text-sm font-black font-mono-crypto text-amber-300 mt-0.5">
            {totalHolders > 0 ? totalHolders.toLocaleString() : '1'}
          </div>
        </div>
        <div className="rounded-[14px] bg-[#071322]/80 border border-cyan-400/20 p-2 text-center shadow-[0_0_12px_rgba(6,182,212,0.05)]">
          <div className="text-[8px] sm:text-[9px] uppercase font-rajdhani text-slate-400">Total Earned</div>
          <div className="text-xs sm:text-sm font-black font-mono-crypto text-cyan-300 mt-0.5">
            ${totalEarningUsdt.toFixed(2)}
          </div>
        </div>
        <div className="rounded-[14px] bg-[#071322]/80 border border-emerald-400/20 p-2 text-center shadow-[0_0_12px_rgba(16,185,129,0.05)]">
          <div className="text-[8px] sm:text-[9px] uppercase font-rajdhani text-slate-400">Withdrawn</div>
          <div className="text-xs sm:text-sm font-black font-mono-crypto text-emerald-300 mt-0.5">
            ${totalWithdrawnUsdt.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 4. Action CTA: Buy Button */}
      <button
        onClick={onOpenBuyModal}
        className="w-full py-3 px-4 rounded-[16px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black font-rajdhani tracking-wider uppercase text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <Rocket className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
        <span>Buy NXBC Token • {activePhase.rateLabel}</span>
      </button>

      {/* 5. Navigation Quick Links Grid */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <button
          onClick={() => onNavigate?.('assets')}
          className="flex flex-col items-center justify-center p-2 rounded-[14px] bg-[#081527]/70 border border-white/10 hover:border-amber-400/40 hover:bg-[#0b1c34] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold font-rajdhani text-slate-300 mt-1 uppercase tracking-wide">Assets</span>
        </button>

        <button
          onClick={() => onNavigate?.('team')}
          className="flex flex-col items-center justify-center p-2 rounded-[14px] bg-[#081527]/70 border border-white/10 hover:border-cyan-400/40 hover:bg-[#0b1c34] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
            <UsersRound className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold font-rajdhani text-slate-300 mt-1 uppercase tracking-wide">Team</span>
        </button>

        <button
          onClick={() => onNavigate?.('wallet')}
          className="flex flex-col items-center justify-center p-2 rounded-[14px] bg-[#081527]/70 border border-white/10 hover:border-emerald-400/40 hover:bg-[#0b1c34] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold font-rajdhani text-slate-300 mt-1 uppercase tracking-wide">Withdraw</span>
        </button>

        <button
          onClick={() => onNavigate?.('mine')}
          className="flex flex-col items-center justify-center p-2 rounded-[14px] bg-[#081527]/70 border border-white/10 hover:border-purple-400/40 hover:bg-[#0b1c34] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
            <UserRound className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold font-rajdhani text-slate-300 mt-1 uppercase tracking-wide">Account</span>
        </button>
      </div>

      {/* GLOBAL MOVEMENT BANNER */}
      <div className="w-full overflow-hidden rounded-[16px] border border-amber-400/20 bg-[#06101d] shadow-[0_0_24px_rgba(245,158,11,0.08)] mt-2">
        <img src={bannerImage} alt="NXBC — A Stronger Tomorrow Builds Here — Join the Global Movement" className="block w-full h-auto object-cover" loading="eager" />
      </div>
    </div>
  );
};