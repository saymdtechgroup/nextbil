import React from 'react';
import { Clock, Flame, Info, Sparkles, TrendingUp, ArrowRight, Wallet, DollarSign, Activity } from 'lucide-react';
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
  walletConnected,
  walletAddress,
  totalEarningUsdt,
  totalWithdrawnUsdt,
}) => {
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

  return (
    <div className="flex-1 px-4 py-4 space-y-4 max-w-xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-100 uppercase tracking-widest font-rajdhani">NXBC Network</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono-crypto text-emerald-400/80 uppercase">BSC Mainnet</span>
            </div>
          </div>
        </div>
        
        {walletConnected && walletAddress ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#120822] border border-emerald-500/30 rounded-xl text-xs font-mono-crypto text-emerald-400 shadow-inner">
            <Wallet className="w-3.5 h-3.5" />
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
        ) : (
          <button onClick={onOpenWalletModal} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs font-bold font-rajdhani uppercase transition-colors shadow-xl shadow-slate-100/10">
            <Wallet className="w-3.5 h-3.5" />
            Connect
          </button>
        )}
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#130722] to-[#0a0312] p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-12 h-12 text-emerald-400" /></div>
          <span className="text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider block mb-1">Total Earnings</span>
          <span className="text-2xl font-black font-mono-crypto text-emerald-400 block">${totalEarningUsdt.toFixed(2)}</span>
        </div>
        <div className="bg-gradient-to-br from-[#130722] to-[#0a0312] p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-fuchsia-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-12 h-12 text-fuchsia-400" /></div>
          <span className="text-[10px] text-slate-400 font-rajdhani uppercase tracking-wider block mb-1">Total Withdrawn</span>
          <span className="text-2xl font-black font-mono-crypto text-fuchsia-400 block">${totalWithdrawnUsdt.toFixed(2)}</span>
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
            <div className="bg-[#1a0a2e]/60 rounded-xl p-3.5 border border-amber-500/20 backdrop-blur-md">
              <span className="text-[9px] text-amber-400/70 uppercase font-rajdhani tracking-wider block mb-1">Tokens Sold</span>
              <span className="text-sm font-black font-mono-crypto text-amber-400">{tokensSold.toLocaleString()}</span>
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
            Buy &amp; Allocate NXBC
          </button>
        </div>
      </div>

      {/* FIFO Engine Widget */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0a0312] border border-blue-500/20 p-5 shadow-lg shadow-blue-900/10">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[13px] font-bold font-rajdhani uppercase tracking-wider text-slate-200">
              Live Auto-Sell Engine
            </span>
          </div>
          <span className="px-3 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono-crypto flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Active
          </span>
        </div>
        
        <p className="text-xs text-slate-400 font-rajdhani mb-5 leading-relaxed">
          Queue your allocation to auto-sell in upcoming phases. 20% of new incoming buyer volume is automatically routed to fulfill seller queues.
        </p>

        {onViewFIFO && (
          <button
            onClick={onViewFIFO}
            className="w-full py-3 rounded-xl bg-black/40 hover:bg-[#1a0a38] border border-blue-500/30 text-blue-400 text-xs font-bold font-rajdhani uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Open FIFO Queue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};