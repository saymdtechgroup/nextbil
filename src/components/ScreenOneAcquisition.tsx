import React from 'react';
import { Rocket, WalletCards, UsersRound, Download, UserRound } from 'lucide-react';
import { AllocationState, PhaseConfig, ActiveScreen } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';
import bannerImage from '../assets/images/nxbc-home-banner.png';

interface ScreenOneAcquisitionProps {
  allocation: AllocationState;
  phases: PhaseConfig[];
  onOpenBuyModal: () => void;
  onOpenWalletModal: () => void;
  onNavigate?: (screen: ActiveScreen) => void;
  walletConnected: boolean;
  walletAddress: string;
}

export const ScreenOneAcquisition: React.FC<ScreenOneAcquisitionProps> = ({
  phases,
  onOpenBuyModal,
  onOpenWalletModal,
  onNavigate,
  walletConnected,
  walletAddress,
}) => {
  const activePhase = phases.find((phase) => phase.status === 'active') ?? phases[0];
  const currentRate = Number(activePhase?.rate) || 0;

  const go = (screen: ActiveScreen) => {
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
        <button type="button" onClick={() => go('assets')} className="rounded-[15px] border border-cyan-400/30 bg-[#071426]/85 p-3 text-center hover:border-cyan-300/60 transition-all"><WalletCards className="mx-auto w-6 h-6 text-cyan-300 mb-1.5" /><span className="text-[10px] font-bold text-slate-100">Assets</span></button>
        <button type="button" onClick={() => go('team')} className="rounded-[15px] border border-purple-400/30 bg-[#0c0920]/85 p-3 text-center hover:border-purple-300/60 transition-all"><UsersRound className="mx-auto w-6 h-6 text-purple-300 mb-1.5" /><span className="text-[10px] font-bold text-slate-100">Team</span></button>
        <button type="button" onClick={() => go('withdraw')} className="rounded-[15px] border border-emerald-400/30 bg-[#071a18]/70 p-3 text-center hover:border-emerald-300/60 transition-all"><Download className="mx-auto w-6 h-6 text-emerald-300 mb-1.5" /><span className="text-[10px] font-bold text-slate-100">Withdraw</span></button>
        <button type="button" onClick={() => go('mine')} className="rounded-[15px] border border-amber-400/30 bg-[#171207]/70 p-3 text-center hover:border-amber-300/60 transition-all"><UserRound className="mx-auto w-6 h-6 text-amber-300 mb-1.5" /><span className="text-[10px] font-bold text-slate-100">Account</span></button>
      </div>

      {/* GLOBAL MOVEMENT BANNER */}
      <div className="nxbc-home-banner w-full overflow-hidden rounded-[16px] border border-amber-400/20 bg-[#06101d] shadow-[0_0_24px_rgba(245,158,11,0.08)]">
        <img src={bannerImage} alt="NXBC — A Stronger Tomorrow Builds Here" className="block w-full h-auto object-cover" />
      </div>
    </div>
  );
};