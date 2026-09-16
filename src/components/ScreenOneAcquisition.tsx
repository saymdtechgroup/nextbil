import React from 'react';
import { Clock, Flame, Info, ListOrdered, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { AllocationState, PhaseConfig } from '../types/crypto';

interface ScreenOneAcquisitionProps {
  allocation: AllocationState;
  phases: PhaseConfig[];
  onUpdateAllocation: (newAlloc: AllocationState) => void;
  onOpenBuyModal: () => void;
  onOpenWalletModal: () => void;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  onSimulateFillPhase?: () => void;
  onResetPhases?: () => void;
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
  walletConnected,
  walletAddress,
  totalEarningUsdt,
  totalWithdrawnUsdt,
}) => {
  const activePhase = phases.find((phase) => phase.status === 'active') ?? phases[0];
  const totalTokens = Number(allocation.totalTokensPurchased ?? 0);

  const p2Tokens = Math.floor(totalTokens * ((allocation.p2Percent ?? 0) / 100));
  const p3Tokens = Math.floor(totalTokens * ((allocation.p3Percent ?? 0) / 100));
  const p4Tokens = Math.floor(totalTokens * ((allocation.p4Percent ?? 0) / 100));
  const p5Tokens = Math.floor(totalTokens * ((allocation.p5Percent ?? 0) / 100));
  const dexTokens = Math.floor(totalTokens * ((allocation.dexPercent ?? 0) / 100));
  const allocatedTokens = p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens;
  const unallocatedTokens = Math.max(0, totalTokens - allocatedTokens);

  const tokensSold = Number(activePhase?.tokensSold ?? 0);
  const totalSupply = Number(activePhase?.totalSupply ?? 0);
  const tokensRemaining = Math.max(0, totalSupply - tokensSold);
  const progressPercent = totalSupply > 0 ? Math.min(100, (tokensSold / totalSupply) * 100) : 0;
  const currentRate = Number(activePhase?.rate ?? 0);
  const nextPhase = activePhase
    ? phases.find((phase) => phase.phaseNumber === (activePhase.phaseNumber ?? 1) + 1)
    : undefined;

  const phaseRows = [
    { label: 'P2 FIFO', tokens: p2Tokens, rate: 0.1, color: 'amber' },
    { label: 'P3 FIFO', tokens: p3Tokens, rate: 1, color: 'amber' },
    { label: 'P4 FIFO', tokens: p4Tokens, rate: 10, color: 'fuchsia' },
    { label: 'P5 FIFO', tokens: p5Tokens, rate: 100, color: 'fuchsia' },
    { label: 'DEX FIFO', tokens: dexTokens, rate: 1500, color: 'fuchsia' },
  ];

  return (
    <div className="flex-1 p-3.5 space-y-4 relative">
      <div className="flex flex-col items-center justify-center py-3 border-b border-purple-500/10 gap-2">
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-bold text-amber-300 font-mono-crypto uppercase">BSC Mainnet</span>
          </div>
          {walletConnected && walletAddress ? (
            <div className="px-2 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[9px] font-mono-crypto text-emerald-300">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          ) : (
            <button onClick={onOpenWalletModal} className="px-2 py-1 bg-purple-950/50 border border-purple-500/30 rounded-lg text-[9px] font-mono-crypto text-purple-300">
              Connect Wallet
            </button>
          )}
        </div>
        <div className="w-full px-2 flex items-center gap-1 text-[10px] font-black uppercase font-rajdhani text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          1-Token Ecosystem Matrix
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="bg-[#0b0318] p-2 rounded-xl border border-emerald-500/30 text-center">
            <span className="text-[8px] text-purple-300/70 font-mono-crypto block">Total Earnings</span>
            <span className="text-sm font-black font-mono-crypto text-emerald-300 block">${totalEarningUsdt.toFixed(2)}</span>
          </div>
          <div className="bg-[#0b0318] p-2 rounded-xl border border-fuchsia-500/30 text-center">
            <span className="text-[8px] text-purple-300/70 font-mono-crypto block">Total Withdrawn</span>
            <span className="text-sm font-black font-mono-crypto text-fuchsia-300 block">${totalWithdrawnUsdt.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d0a36] via-[#140628] to-[#0a0316] border-2 border-amber-400/50 p-4 shadow-[0_10px_35px_rgba(245,158,11,0.2)]">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 border border-amber-400 text-amber-300 font-rajdhani uppercase">
            <Flame className="w-3.5 h-3.5" />
            {activePhase?.name ?? 'Phase'}: LIVE SELLING
          </span>
          <span className="text-[10px] text-fuchsia-300 font-mono-crypto flex items-center gap-1">
            <Clock className="w-3 h-3" /> Step {activePhase?.phaseNumber ?? 1}/5
          </span>
        </div>

        <div className="bg-[#0c051a]/90 rounded-xl p-3 border border-amber-500/25 mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-purple-300/80 uppercase font-rajdhani">Current Live Coin Price</p>
            <span className="text-3xl font-black font-mono-crypto text-amber-300">${currentRate.toFixed(2)}</span>
            <span className="text-xs font-bold text-amber-300 font-mono-crypto ml-1">USD/NXBC</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-purple-300/80 uppercase font-rajdhani">{nextPhase ? `Next (${nextPhase.name})` : 'Target Listing Rate'}</p>
            <span className="text-sm font-black text-fuchsia-300 font-mono-crypto">{nextPhase?.rateLabel ?? '$1,500 – $3,000'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Total Phase Supply</span>
            <span className="text-xs font-black font-mono-crypto text-slate-100 block">{totalSupply.toLocaleString()} NXBC</span>
          </div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-amber-500/30">
            <span className="text-[9px] text-amber-300/80 uppercase block font-rajdhani">Tokens Sold ({progressPercent.toFixed(1)}%)</span>
            <span className="text-xs font-black font-mono-crypto text-amber-300 block">{tokensSold.toLocaleString()} NXBC</span>
          </div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Tokens Remaining</span>
            <span className="text-xs font-black font-mono-crypto text-fuchsia-300 block">{tokensRemaining.toLocaleString()} NXBC</span>
          </div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Allocation</span>
            <span className="text-xs font-black font-mono-crypto text-emerald-300 block">{totalTokens.toLocaleString()} NXBC</span>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-[10px] font-mono-crypto">
            <span className="text-purple-200/90">Phase Sales Progress</span>
            <span className="text-amber-300 font-bold">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-purple-950/90 border border-purple-700/50 overflow-hidden p-[1.5px]">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-amber-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 mb-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-200/90 leading-tight">The next phase opens automatically after the current phase reaches 100% sold.</p>
        </div>

        <button onClick={onOpenBuyModal} className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 font-bold text-[11px] uppercase font-rajdhani tracking-wider">
          Buy & Allocate
        </button>
      </section>

      <section className="rounded-2xl bg-gradient-to-b from-[#16092c] via-[#100622] to-[#0b0318] border border-amber-500/30 p-3 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300"><ListOrdered className="w-4 h-4" /></div>
            <div>
              <h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase">Global FIFO Queue</h3>
              <p className="text-[9px] text-purple-300/70 font-mono-crypto">Community execution order</p>
            </div>
          </div>
          <span className="text-[8px] font-mono-crypto px-1.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">LIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-[#0b0518] border border-purple-500/20 text-center">
            <span className="text-[8px] text-purple-300/80 uppercase block font-rajdhani">Global Queued</span>
            <span className="text-sm font-black font-mono-crypto text-amber-300 block">{allocatedTokens.toLocaleString()} NXBC</span>
            <span className="text-[8px] text-purple-400 font-mono-crypto">{allocatedTokens > 0 ? '1 Active Seller' : '0 Active Sellers'}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0b0518] border border-amber-500/30 text-center">
            <span className="text-[8px] text-amber-300 uppercase block font-rajdhani">Queue Status</span>
            <span className="text-sm font-black font-mono-crypto text-emerald-300 block">{allocatedTokens > 0 ? 'ACTIVE' : 'STANDBY'}</span>
            <span className="text-[8px] text-purple-400 font-mono-crypto">Oldest order first</span>
          </div>
        </div>

        <div className="border-t border-purple-500/20 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase">Individual FIFO</h3>
            <span className="text-[9px] text-fuchsia-300 font-mono-crypto">{totalTokens > 0 ? 'Priority #1' : 'Not queued'}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#0b0518] border border-fuchsia-500/30 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[8px] text-purple-300/80 uppercase block font-rajdhani">Your Queued Tokens</span>
              <span className="text-lg font-black font-mono-crypto text-slate-100">{allocatedTokens.toLocaleString()} NXBC</span>
            </div>
            <span className="text-[9px] text-emerald-300 font-mono-crypto">{unallocatedTokens.toLocaleString()} unallocated</span>
          </div>
          <div className="space-y-1.5">
            {phaseRows.map((phase) => (
              <div key={phase.label} className="flex items-center justify-between rounded-lg bg-[#0b0518] border border-purple-500/20 px-2 py-1.5">
                <span className="text-[10px] text-purple-200 font-mono-crypto">{phase.label}</span>
                <span className="text-[10px] text-amber-300 font-mono-crypto">{phase.tokens.toLocaleString()} NXBC @ ${phase.rate.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-fuchsia-900/20 border border-fuchsia-500/30 flex items-start gap-2">
          <RefreshCw className="w-4 h-4 text-fuchsia-400 shrink-0" />
          <p className="text-[10px] text-fuchsia-200/90 leading-tight">FIFO orders are displayed here in chronological execution order. This section is the only FIFO display on the dashboard.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-purple-300/80 font-mono-crypto"><ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Queue data is based on the current account allocation.</div>
      </section>
    </div>
  );
};
