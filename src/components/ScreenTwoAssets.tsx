import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Users,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  Sparkles,
  BarChart3,
  ChevronRight,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';
import { AllocationState } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface ScreenTwoAssetsProps {
  allocation: AllocationState;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
}

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  allocation,
  onOpenTeamPlanModal,
  onOpenMatrixModal,
  levelIncomeUsd,
  matrixIncomeUsd,
}) => {
  const [showValues, setShowValues] = useState<boolean>(true);

  // Compute token amounts for each box based on user allocation state
  const totalTokens = allocation.totalTokensPurchased;
  const p2Tokens = Math.round(totalTokens * (allocation.p2Percent / 100));
  const p3Tokens = Math.round(totalTokens * (allocation.p3Percent / 100));
  const p4Tokens = Math.round(totalTokens * (allocation.p4Percent / 100));
  const p5Tokens = Math.round(totalTokens * (allocation.p5Percent / 100));
  const dexTokens = Math.round(totalTokens * (allocation.dexPercent / 100));
  const unallocatedTokens = Math.max(
    0,
    totalTokens - (p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens)
  );

  // Projected value calculation:
  // P2: $0.10, P3: $0.20, P4: $0.30, P5: $0.40, DEX: est $1500.00, Unallocated at Phase 1 rate $0.01
  const p2Val = p2Tokens * 0.10;
  const p3Val = p3Tokens * 0.20;
  const p4Val = p4Tokens * 0.30;
  const p5Val = p5Tokens * 0.40;
  const dexVal = dexTokens * 1500.00;
  const unallocatedVal = unallocatedTokens * 0.01;

  const totalAllocatedUsd = p2Val + p3Val + p4Val + p5Val + dexVal;
  const initialCostUsd = totalTokens * 0.01;

  return (
    <div className="flex-1 p-3.5 space-y-3.5 relative">
      {/* Assets Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Asset Portfolio & Schedule
            </h1>
            <p className="text-[9px] text-purple-300/70 font-mono-crypto">
              Real-Time Phase Allocation
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowValues(!showValues)}
          className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/20 text-purple-300 hover:text-amber-300 transition-colors"
          title="Toggle Privacy"
        >
          {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>

      {/* Portfolio Quick Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d0c38] via-[#140828] to-[#0a0414] border border-amber-500/30 p-3 shadow-[0_10px_30px_rgba(245,158,11,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-semibold text-purple-300/80 uppercase tracking-wider">
              Total Community Holdings
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono-crypto gold-gradient-text">
                {showValues ? `${totalTokens.toLocaleString()} NXBC` : '••••••••'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono-crypto font-medium">
              ≈ ${showValues ? initialCostUsd.toFixed(2) : '•••'} USD (Acquisition Base)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {allocation.isLocked && (
          <div className="mt-2 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[9px] font-mono-crypto">
            <span className="text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Contract Schedule Locked
            </span>
            <span className="text-purple-400">{allocation.lockedTimestamp || 'Active'}</span>
          </div>
        )}
      </div>

      {/* Screen 2 Core Requirement: Unique 6-Box Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Phase Sell-Through Schedule
          </h2>
          <span className="text-[9px] font-mono-crypto text-fuchsia-300">
            6 Milestone Vectors
          </span>
        </div>

        {/* 6-Box Grid Container */}
        <div className="grid grid-cols-2 gap-2">
          {/* Box 1: P2 SELL */}
          <div className="rounded-xl bg-[#110722] border border-amber-500/30 p-2.5 hover:border-amber-400/60 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 font-rajdhani uppercase tracking-wider block">
                P2 SELL
              </span>
              <span className="text-[7.5px] font-mono-crypto px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                FIFO #5
              </span>
            </div>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-100 block">
                {showValues ? `${p2Tokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-amber-400/90 font-semibold">
                @ $0.10 Rate
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Est. Return:</span>
              <span className="text-emerald-400 font-bold">${showValues ? p2Val.toFixed(0) : '••'}</span>
            </div>
          </div>

          {/* Box 2: P3 SELL */}
          <div className="rounded-xl bg-[#110722] border border-amber-500/30 p-2.5 hover:border-amber-400/60 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 font-rajdhani uppercase tracking-wider block">
                P3 SELL
              </span>
              <span className="text-[7.5px] font-mono-crypto px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                FIFO #7
              </span>
            </div>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-100 block">
                {showValues ? `${p3Tokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-amber-400/90 font-semibold">
                @ $0.20 Rate
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Est. Return:</span>
              <span className="text-emerald-400 font-bold">${showValues ? p3Val.toFixed(0) : '••'}</span>
            </div>
          </div>

          {/* Box 3: P4 SELL */}
          <div className="rounded-xl bg-[#110722] border border-purple-500/30 p-2.5 hover:border-fuchsia-400/60 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-fuchsia-300 font-rajdhani uppercase tracking-wider block">
                P4 SELL
              </span>
              <span className="text-[7.5px] font-mono-crypto px-1 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold border border-fuchsia-500/30">
                FIFO #12
              </span>
            </div>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-100 block">
                {showValues ? `${p4Tokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-fuchsia-400/90 font-semibold">
                @ $0.30 Rate
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Est. Return:</span>
              <span className="text-emerald-400 font-bold">${showValues ? p4Val.toFixed(0) : '••'}</span>
            </div>
          </div>

          {/* Box 4: P5 SELL */}
          <div className="rounded-xl bg-[#110722] border border-purple-500/30 p-2.5 hover:border-fuchsia-400/60 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-fuchsia-300 font-rajdhani uppercase tracking-wider block">
                P5 SELL
              </span>
              <span className="text-[7.5px] font-mono-crypto px-1 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold border border-fuchsia-500/30">
                FIFO #15
              </span>
            </div>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-100 block">
                {showValues ? `${p5Tokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-fuchsia-400/90 font-semibold">
                @ $0.40 Rate
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Est. Return:</span>
              <span className="text-emerald-400 font-bold">${showValues ? p5Val.toFixed(0) : '••'}</span>
            </div>
          </div>

          {/* Box 5: Live DEX */}
          <div className="rounded-xl bg-[#110722] border border-fuchsia-500/30 p-2.5 hover:border-fuchsia-400/60 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-fuchsia-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-fuchsia-300 font-rajdhani uppercase tracking-wider block">
                Live DEX
              </span>
              <span className="text-[7.5px] font-mono-crypto px-1 py-0.2 rounded bg-fuchsia-500/25 text-fuchsia-200 font-bold border border-fuchsia-500/40">
                FIFO #18
              </span>
            </div>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-100 block whitespace-nowrap">
                {showValues ? `${dexTokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-semibold block whitespace-nowrap">
                @ $1,500 – $3,000 (DEX)
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Est. Pool:</span>
              <span className="text-emerald-400 font-bold">${showValues ? dexVal.toFixed(0) : '••'}</span>
            </div>
          </div>

          {/* Box 6: Unallocated */}
          <div className="rounded-xl bg-[#110722] border border-slate-700/60 p-2.5 hover:border-slate-500 transition-all shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-slate-500/10 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] font-bold text-slate-300 font-rajdhani uppercase tracking-wider block">
              Unallocated
            </span>
            <div className="my-1">
              <span className="text-xs font-black font-mono-crypto text-slate-300 block">
                {showValues ? `${unallocatedTokens.toLocaleString()} NXBC` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-slate-400 font-medium">
                Hold / Flexible
              </span>
            </div>
            <div className="text-[8px] text-purple-300/70 font-mono-crypto flex justify-between border-t border-purple-500/15 pt-1 mt-1">
              <span>Status:</span>
              <span className="text-amber-300 font-semibold">{allocation.unallocatedPercent}% Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen 2 Summary Card: Total Allocated Value */}
      <div className="rounded-2xl bg-gradient-to-r from-[#170a2f] via-[#1f0d3a] to-[#170a2f] border border-amber-400/40 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/90 font-rajdhani">
              Total Allocated Value
            </span>
            <div className="text-xl font-extrabold font-mono-crypto text-slate-100 flex items-center gap-1.5">
              <span>{showValues ? `$${totalAllocatedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}</span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono-crypto">
                USD Est.
              </span>
            </div>
            <p className="text-[9px] text-purple-300/70">
              Future cumulative sales projection across all 5 lock stages
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-fuchsia-600 p-[1.5px] shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#0e0720] rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Overview: Four Breakdown Cards */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider px-1">
          Community & Yield Analytics
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Card 1: Total Return */}
          <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Total Return</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-mono-crypto text-emerald-400">
                {showValues ? `+$${(totalAllocatedUsd - initialCostUsd).toLocaleString()}` : '••••'}
              </div>
            </div>
            
            {/* Mini Sparkline Chart SVG */}
            <div className="mt-2 pt-1 border-t border-purple-500/10">
              <svg className="w-full h-6 stroke-emerald-400 fill-emerald-500/10" viewBox="0 0 100 25">
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2 L100,25 L0,25 Z" />
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2" fill="none" strokeWidth="2" />
              </svg>
              <span className="text-[8px] text-purple-300/60 font-mono-crypto">Max 40x on P5</span>
            </div>
          </div>

          {/* Card 2: Team Structure */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 hover:border-amber-400/40 cursor-pointer transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-fuchsia-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Team Structure</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-mono-crypto text-slate-100">
                24 Directs / 148 Team
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-purple-500/10 flex items-center justify-between text-[8px] text-amber-300 font-medium">
              <span>View Hierarchy</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Level Income */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 hover:border-amber-400/40 cursor-pointer transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-amber-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Level Income</span>
                <Percent className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-mono-crypto gold-gradient-text">
                {showValues ? `$${levelIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-purple-500/10 flex items-center justify-between text-[8px] text-emerald-400 font-mono-crypto">
              <span>10-Level Active</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Matrix Income */}
          <div
            onClick={onOpenMatrixModal}
            className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 hover:border-fuchsia-400/40 cursor-pointer transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-fuchsia-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Matrix Income</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-bold font-mono-crypto magenta-gradient-text">
                {showValues ? `$${matrixIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-purple-500/10 flex items-center justify-between text-[8px] text-fuchsia-300 font-mono-crypto">
              <span>Placement + 10-Lvl</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
