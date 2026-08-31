import React, { useState } from 'react';
import {
  Bell,
  Wallet,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Sparkles,
  Coins,
  Clock,
  ShieldCheck,
  Check,
  Play,
  RotateCcw,
  RefreshCw,
  ListOrdered,
  Users,
  ArrowDownUp,
  SlidersHorizontal,
} from 'lucide-react';
import { AllocationState, PhaseConfig } from '../types/crypto';
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
  onResetPhases?: () => void;
  walletConnected: boolean;
  walletAddress: string;
}

export const ScreenOneAcquisition: React.FC<ScreenOneAcquisitionProps> = ({
  allocation,
  phases,
  onOpenBuyModal,
  onOpenWalletModal,
  onOpenTeamPlanModal,
  onOpenMatrixModal,
  onSimulateFillPhase,
  onResetPhases,
  walletConnected,
  walletAddress,
}) => {
  const [selectedQueuePhase, setSelectedQueuePhase] = useState<'all' | 'p2' | 'p3' | 'p4' | 'p5' | 'dex'>('all');

  // Find current active phase (or fallback to Phase 1)
  const activePhase = phases.find((p) => p.status === 'active') || phases[0];
  const nextPhase = phases.find((p) => p.phaseNumber === activePhase.phaseNumber + 1);

  const tokensSold = activePhase.tokensSold;
  const totalSupply = activePhase.totalSupply;
  const tokensRemaining = Math.max(0, totalSupply - tokensSold);
  const progressPercent = Math.min(100, Math.max(0, (tokensSold / totalSupply) * 100));
  const usdRaised = tokensSold * activePhase.rate;
  const usdTarget = totalSupply * activePhase.rate;

  const totalTokens = allocation.totalTokensPurchased;
  const p2Tokens = Math.floor(totalTokens * (allocation.p2Percent / 100));
  const p3Tokens = Math.floor(totalTokens * (allocation.p3Percent / 100));
  const p4Tokens = Math.floor(totalTokens * (allocation.p4Percent / 100));
  const p5Tokens = Math.floor(totalTokens * (allocation.p5Percent / 100));
  const dexTokens = Math.floor(totalTokens * (allocation.dexPercent / 100));
  const unallocatedTokens = Math.max(0, totalTokens - (p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens));

  const p2Val = p2Tokens * 0.10;
  const p3Val = p3Tokens * 0.20;
  const p4Val = p4Tokens * 0.30;
  const p5Val = p5Tokens * 0.40;
  const dexVal = dexTokens * 1500.00;
  const totalProjectedVal = p2Val + p3Val + p4Val + p5Val + dexVal;

  return (
    <div className="flex-1 p-3.5 space-y-4 relative">
      {/* Top Header: Logo + 3D Coin + Quick Connect Wallet Bar */}
      <div className="flex flex-col items-center justify-center py-3 border-b border-purple-500/10 gap-2">
        <div className="w-full flex items-center justify-between px-1 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-bold text-amber-300 font-mono-crypto uppercase">
              BSC Mainnet
            </span>
          </div>

          {walletConnected && walletAddress ? (
            <button
              onClick={onOpenWalletModal}
              className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono-crypto font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider font-rajdhani flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 fill-black text-black" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>

        <GoldCoinGraphic size="xl" animated={true} glow={true} showBadge={false} />
        <h1 className="text-2xl font-black tracking-widest text-slate-100 font-cinzel">
          NXBC<span className="text-amber-400"> COIN</span>
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* BOX 1: LIVE ACTIVE PHASE PROGRESS & SALES TRACKER BOX                      */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d0a36] via-[#140628] to-[#0a0316] border-2 border-amber-400/50 p-4 shadow-[0_10px_35px_rgba(245,158,11,0.2)]">
        {/* Glow ambient background highlights */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-fuchsia-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Phase Header & Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/30 to-amber-600/20 border border-amber-400 text-amber-300 font-rajdhani uppercase tracking-wider shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              {activePhase.name}: LIVE SELLING
            </span>
            <span className="text-[10px] text-fuchsia-300/80 font-mono-crypto flex items-center gap-1">
              <Clock className="w-3 h-3 text-fuchsia-400" />
              Step {activePhase.phaseNumber}/5
            </span>
          </div>
          <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow-sm">
            {activePhase.multiplier}
          </span>
        </div>

        {/* Main Price & Target Display */}
        <div className="bg-[#0c051a]/90 rounded-xl p-3 border border-amber-500/25 mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-purple-300/80 uppercase tracking-wider font-rajdhani">
              Current Live Coin Price
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono-crypto gold-gradient-text tracking-tight">
                ${activePhase.rate.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-amber-300 font-mono-crypto">
                USD/NXBC
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 ml-2">
            <p className="text-[9px] font-bold text-purple-300/80 uppercase tracking-wider font-rajdhani">
              {nextPhase ? `Next (${nextPhase.name})` : 'Target Listing Rate'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-sm font-black text-fuchsia-300 font-mono-crypto">
                {nextPhase ? (nextPhase.rateLabel || `$${nextPhase.rate.toFixed(2)}`) : '$1,500 – $3,000'}
              </span>
              {nextPhase?.multiplier && (
                <span className="text-[9px] text-emerald-400 font-bold font-mono-crypto bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  {nextPhase.multiplier}
                </span>
              )}
            </div>
            <span className="text-[8px] text-purple-300/70 font-mono-crypto block mt-0.5">
              Automated Next Stage Unlock
            </span>
          </div>
        </div>

        {/* Detailed 4-Metric Grid: Total Supply, Sold, Remaining, Value */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] font-medium text-purple-300/70 uppercase block font-rajdhani">
              Total Phase Supply
            </span>
            <span className="text-xs font-black font-mono-crypto text-slate-100 mt-0.5 block">
              {totalSupply.toLocaleString()} NXBC
            </span>
            <span className="text-[8px] text-purple-400 font-mono-crypto">
              Target: ${usdTarget.toLocaleString()} USD
            </span>
          </div>

          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-amber-500/30">
            <span className="text-[9px] font-medium text-amber-300/80 uppercase block font-rajdhani">
              Tokens Sold ({progressPercent.toFixed(1)}%)
            </span>
            <span className="text-xs font-black font-mono-crypto text-amber-300 mt-0.5 block">
              {tokensSold.toLocaleString()} NXBC
            </span>
            <span className="text-[8px] text-emerald-400 font-mono-crypto font-bold">
              Raised: ${usdRaised.toLocaleString()} USD
            </span>
          </div>

          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] font-medium text-purple-300/70 uppercase block font-rajdhani">
              Tokens Remaining
            </span>
            <span className="text-xs font-black font-mono-crypto text-fuchsia-300 mt-0.5 block">
              {tokensRemaining.toLocaleString()} NXBC
            </span>
            <span className="text-[8px] text-purple-400 font-mono-crypto">
              {((tokensRemaining / totalSupply) * 100).toFixed(1)}% Left in {activePhase.shortName}
            </span>
          </div>

          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20">
            <span className="text-[9px] font-medium text-purple-300/70 uppercase block font-rajdhani">
              Sequence Rule
            </span>
            <span className="text-[10px] font-bold font-mono-crypto text-emerald-300 mt-0.5 block leading-tight">
              Sequential 100%
            </span>
            <span className="text-[8px] text-purple-300 font-mono-crypto">
              {nextPhase ? `Opens ${nextPhase.shortName} next` : 'Final Stage'}
            </span>
          </div>
        </div>

        {/* Live Progress Bar with glowing indicator */}
        <div className="space-y-1.5 mb-3.5">
          <div className="flex justify-between items-center text-[10px] font-mono-crypto">
            <span className="text-purple-200/90 font-medium">
              Phase Sales Progress: <strong className="text-amber-300 font-bold">{progressPercent.toFixed(1)}%</strong>
            </span>
            <span className="text-amber-300 font-bold">
              {tokensSold.toLocaleString()} / {totalSupply.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-purple-950/90 border border-purple-700/50 overflow-hidden p-[1.5px] relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-amber-300 transition-all duration-500 shadow-[0_0_12px_#f59e0b] relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sequential Selling Smart Contract Rule Notification Banner */}
        <div className="flex flex-col gap-2 mb-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-200/90 leading-tight">
              <strong>Phase Sequence Rule:</strong> The next <strong>{nextPhase ? `${nextPhase.name} ($${nextPhase.rate.toFixed(2)})` : 'DEX Launch'}</strong> will automatically start only when 100% of the Phase {activePhase.phaseNumber} coins (<strong>{totalSupply.toLocaleString()} NXBC</strong>) are sold out.
            </p>
          </div>
          
          <div className="p-2.5 rounded-xl bg-fuchsia-900/20 border border-fuchsia-500/30 flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-fuchsia-200/90 leading-tight">
              <strong>P2P FIFO System:</strong> Coins you <strong>Sell</strong> in upcoming phases will enter a global <strong>FIFO (First-In, First-Out)</strong> queue. Orders placed first are executed first with automated instant USDT payout upon match.
            </p>
          </div>
        </div>

        {/* Action Controls: Buy Now & Demo Simulation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-purple-500/20">
          {activePhase.id === 'dex' ? (
            <button
              id="screen1-buy-now-btn"
              disabled
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-400 font-black text-xs tracking-wide cursor-not-allowed font-rajdhani uppercase"
            >
              <Zap className="w-4 h-4 opacity-50" />
              <span>Buy on DEX (Live)</span>
            </button>
          ) : (
            <button
              id="screen1-buy-now-btn"
              onClick={onOpenBuyModal}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 cursor-pointer font-rajdhani uppercase w-full"
            >
              <Zap className="w-4 h-4 fill-black text-black" />
              <span>Buy in {activePhase.shortName} (@ ${activePhase.rate.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOX 2: PHASE-WISE TOKEN PRICING & SEQUENCE SCHEDULE ROADMAP BOX           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-b from-[#14092b] via-[#0e051e] to-[#090316] border-2 border-purple-500/40 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-100 font-cinzel tracking-wide">
                PHASE-WISE COIN PRICE LIST
              </h2>
              <p className="text-[9px] text-purple-300/70 font-mono-crypto">
                Coin price & sequence status for every phase
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono-crypto px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300">
            6 Sequential Stages
          </span>
        </div>

        {/* Explanatory Banner for Phase Progression */}
        <div className="text-[10px] text-purple-200/80 bg-[#0c0419] p-2.5 rounded-xl border border-purple-500/20 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Every phase operates strictly in <strong>sequential order</strong>. 100% of Phase 1 coins must sell out before Phase 2 begins, followed by Phase 3, Phase 4, Phase 5, and finally the DEX Launch.
          </span>
        </div>

        {/* Phase List Cards */}
        <div className="space-y-2 pt-1">
          {phases.map((phase) => {
            const isCompleted = phase.status === 'completed';
            const isActive = phase.status === 'active';
            const isLocked = phase.status === 'locked';
            const currentPhasePct = Math.min(100, (phase.tokensSold / phase.totalSupply) * 100);

            return (
              <div
                key={phase.id}
                className={`p-3 rounded-xl border transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[#271048] via-[#1a0b33] to-[#271048] border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : isCompleted
                    ? 'bg-[#091515]/90 border-emerald-500/40 opacity-90'
                    : 'bg-[#0b0417]/80 border-purple-500/20 opacity-75'
                }`}
              >
                {/* Active Glowing Pulse Line */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-fuchsia-400 to-amber-500 animate-pulse" />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Phase Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-rajdhani text-xs border ${
                        isActive
                          ? 'bg-amber-500 text-black border-amber-300 shadow-md animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                          : 'bg-purple-950 text-purple-400 border-purple-800/40'
                      }`}
                    >
                      {phase.shortName}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 font-rajdhani">
                          {phase.name}
                        </span>

                        {/* Status Chip */}
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-400/60 animate-pulse">
                            ● ACTIVE NOW
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono-crypto bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> 100% SOLD
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-crypto bg-purple-950/80 text-purple-400 border border-purple-800/40 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-purple-300/80 font-mono-crypto block mt-0.5">
                        Supply: {phase.totalSupply.toLocaleString()} NXBC &bull; {phase.unlockRequirement}
                      </span>
                    </div>
                  </div>

                  {/* Token Price & Multiplier */}
                  <div className="text-right shrink-0 ml-2 flex flex-col items-end justify-center">
                    <span
                      className={`text-xs sm:text-sm font-black font-mono-crypto block whitespace-nowrap ${
                        isActive
                          ? 'text-amber-300 text-sm sm:text-base font-extrabold'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {phase.rateLabel || `$${phase.rate.toFixed(2)}`}
                      {!phase.rateLabel && <span className="text-[9px] font-normal text-purple-300/70 ml-1">USD</span>}
                    </span>
                    <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-semibold block whitespace-nowrap">
                      {phase.multiplier}
                    </span>
                  </div>
                </div>

                {/* Progress bar for Active and Completed Phases */}
                {(isActive || isCompleted) && (
                  <div className="mt-2 pt-1.5 border-t border-purple-500/15">
                    <div className="flex justify-between text-[9px] font-mono-crypto mb-1">
                      <span className="text-purple-300/80">
                        {isCompleted ? 'Sold Out:' : 'Sold:'} {phase.tokensSold.toLocaleString()} / {phase.totalSupply.toLocaleString()} NXBC
                      </span>
                      <span className={isActive ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'}>
                        {currentPhasePct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-amber-500 to-amber-300'
                        }`}
                        style={{ width: `${currentPhasePct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {onResetPhases && (
          <div className="pt-2 text-center">
            <button
              onClick={onResetPhases}
              className="text-[10px] font-mono-crypto text-purple-400/80 hover:text-purple-200 flex items-center justify-center gap-1 mx-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo Presale Simulation</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOX 3: USER'S LOCKED SELL-THROUGH SCHEDULE (READ-ONLY ON-SCREEN)          */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#130a27]/95 border border-amber-500/30 p-3.5 space-y-3 relative shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Your Phase Sell-Through Allocation
            </h2>
          </div>
          <span className="text-[10px] font-mono-crypto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            IMMUTABLE SMART LOCK
          </span>
        </div>

        <p className="text-[10px] text-purple-200/80 leading-tight">
          Total Purchased Tokens: <strong>{allocation.totalTokensPurchased.toLocaleString()} NXBC</strong>. Configured systematic percentage unlocks automatically as each phase is reached:
        </p>

        {/* Read-Only Phase Breakdown Display Cards */}
        <div className="space-y-2 pt-1">
          {/* Phase 2 */}
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between hover:border-amber-400/40 transition-colors">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 2 Target Unlock</span>
                <span className="text-[9px] font-mono-crypto text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                  @ $0.10 Rate
                </span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-mono-crypto block mt-0.5">
                Tokens: {Math.floor(allocation.totalTokensPurchased * (allocation.p2Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono-crypto text-amber-300">
                {allocation.p2Percent}%
              </span>
              <span className="text-[9px] font-mono-crypto text-emerald-400 block font-semibold">
                ${(Math.floor(allocation.totalTokensPurchased * (allocation.p2Percent / 100)) * 0.10).toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between hover:border-amber-400/40 transition-colors">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 3 Target Unlock</span>
                <span className="text-[9px] font-mono-crypto text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                  @ $0.20 Rate
                </span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-mono-crypto block mt-0.5">
                Tokens: {Math.floor(allocation.totalTokensPurchased * (allocation.p3Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono-crypto text-amber-300">
                {allocation.p3Percent}%
              </span>
              <span className="text-[9px] font-mono-crypto text-emerald-400 block font-semibold">
                ${(Math.floor(allocation.totalTokensPurchased * (allocation.p3Percent / 100)) * 0.20).toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between hover:border-fuchsia-400/40 transition-colors">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 4 Target Unlock</span>
                <span className="text-[9px] font-mono-crypto text-fuchsia-400 font-semibold bg-fuchsia-950/60 px-1.5 py-0.2 rounded border border-fuchsia-500/30">
                  @ $0.30 Rate
                </span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-mono-crypto block mt-0.5">
                Tokens: {Math.floor(allocation.totalTokensPurchased * (allocation.p4Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono-crypto text-fuchsia-300">
                {allocation.p4Percent}%
              </span>
              <span className="text-[9px] font-mono-crypto text-emerald-400 block font-semibold">
                ${(Math.floor(allocation.totalTokensPurchased * (allocation.p4Percent / 100)) * 0.30).toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Phase 5 */}
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between hover:border-fuchsia-400/40 transition-colors">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 5 Target Unlock</span>
                <span className="text-[9px] font-mono-crypto text-fuchsia-400 font-semibold bg-fuchsia-950/60 px-1.5 py-0.2 rounded border border-fuchsia-500/30">
                  @ $0.40 Rate
                </span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-mono-crypto block mt-0.5">
                Tokens: {Math.floor(allocation.totalTokensPurchased * (allocation.p5Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono-crypto text-fuchsia-300">
                {allocation.p5Percent}%
              </span>
              <span className="text-[9px] font-mono-crypto text-emerald-400 block font-semibold">
                ${(Math.floor(allocation.totalTokensPurchased * (allocation.p5Percent / 100)) * 0.40).toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Live DEX Target Unlock */}
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-fuchsia-500/30 flex items-center justify-between hover:border-fuchsia-400/60 transition-colors">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-rajdhani">Live DEX Target Unlock</span>
                <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-semibold bg-fuchsia-950/80 px-1.5 py-0.2 rounded border border-fuchsia-500/40">
                  @ $1,500 – $3,000 DEX
                </span>
              </div>
              <span className="text-[10px] text-purple-300/70 font-mono-crypto block mt-0.5">
                Tokens: {dexTokens.toLocaleString()} NXBC
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black font-mono-crypto text-fuchsia-300">
                {allocation.dexPercent}%
              </span>
              <span className="text-[9px] font-mono-crypto text-emerald-400 block font-semibold">
                ${dexVal.toLocaleString()} USD (Est.)
              </span>
            </div>
          </div>
        </div>

        {/* Total Projected Return Summary */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-fuchsia-950/40 to-amber-500/15 border border-amber-400/40 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[9px] font-bold text-amber-300 font-rajdhani uppercase tracking-wider block">
              Total Projected Milestone Return
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black font-mono-crypto gold-gradient-text">
                ${totalProjectedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <span className="text-[8px] text-purple-300/80 font-mono-crypto">
              From {totalTokens.toLocaleString()} NXBC across all 5 milestones
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-emerald-400 font-bold font-mono-crypto block">
              +${(totalProjectedVal - (totalTokens * 0.01)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Profit
            </span>
            <span className="text-[8px] text-amber-400/90 font-mono-crypto">
              {totalTokens > 0 ? `${((totalProjectedVal / Math.max(1, totalTokens * 0.01))).toFixed(0)}x ROI Potential` : '0x'}
            </span>
          </div>
        </div>

        {/* Lock Summary Footnote & Call to Action */}
        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Lock Status: Immutably Saved</span>
          </div>
          <button
            onClick={onOpenBuyModal}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 font-bold text-[10px] uppercase font-rajdhani tracking-wider hover:opacity-90"
          >
            Buy & Allocate
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* NEW: FIFO AUTOMATIC SELL QUEUE & POSITION TRACKER BOX         */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-2xl bg-gradient-to-b from-[#16092c] via-[#100622] to-[#0b0318] border border-amber-500/30 p-3 space-y-3 shadow-lg relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-fuchsia-600/20 border border-amber-500/40 text-amber-300">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase tracking-wide">
                    FIFO Sell Queue Tracker
                  </h3>
                  <span className="text-[8px] font-mono-crypto px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                    LIVE QUEUE 🟢
                  </span>
                </div>
                <p className="text-[9px] text-purple-300/70 font-mono-crypto">
                  First-In, First-Out Community Execution Order
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] font-bold text-purple-300 font-rajdhani uppercase block">
                Queue Ticket
              </span>
              <span className="text-[10px] font-black font-mono-crypto gold-gradient-text">
                #FIFO-NXBC-005
              </span>
            </div>
          </div>

          {/* Top 3 Metric Highlight Pills */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Total Community Queued */}
            <div className="p-2 rounded-xl bg-[#0b0518] border border-purple-500/20 text-center">
              <span className="text-[8px] font-bold text-purple-300/80 uppercase block font-rajdhani">
                Global Queued
              </span>
              <span className="text-xs font-black font-mono-crypto text-amber-300 block my-0.5">
                {(4250 + (totalTokens - unallocatedTokens)).toLocaleString()} NXBC
              </span>
              <span className="text-[8px] font-mono-crypto text-purple-400">
                {totalTokens > 0 ? '8 Active Sellers' : '7 Active Sellers'}
              </span>
            </div>

            {/* User Queued Tokens */}
            <div className="p-2 rounded-xl bg-[#0b0518] border border-amber-500/30 text-center">
              <span className="text-[8px] font-bold text-amber-300 uppercase block font-rajdhani">
                Your Queued
              </span>
              <span className="text-xs font-black font-mono-crypto text-slate-100 block my-0.5">
                {(totalTokens - unallocatedTokens).toLocaleString()} NXBC
              </span>
              <span className="text-[8px] font-mono-crypto text-emerald-400 font-semibold">
                {totalTokens > 0 ? 'Active in Queue 🟢' : '0 Allocated'}
              </span>
            </div>

            {/* User Priority Position */}
            <div className="p-2 rounded-xl bg-[#0b0518] border border-fuchsia-500/30 text-center">
              <span className="text-[8px] font-bold text-fuchsia-300 uppercase block font-rajdhani">
                Priority Rank
              </span>
              <span className="text-xs font-black font-mono-crypto text-fuchsia-300 block my-0.5">
                {totalTokens > 0 ? 'Slot #5' : 'Pending Buy'}
              </span>
              <span className="text-[8px] font-mono-crypto text-purple-300/80">
                {totalTokens > 0 ? 'Early Batch 1' : 'Join Queue'}
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[9px] font-mono-crypto">
            <button
              onClick={() => setSelectedQueuePhase('all')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              All Phases
            </button>
            <button
              onClick={() => setSelectedQueuePhase('p2')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'p2'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              Phase 2 ($0.10)
            </button>
            <button
              onClick={() => setSelectedQueuePhase('p3')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'p3'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              Phase 3 ($0.20)
            </button>
            <button
              onClick={() => setSelectedQueuePhase('p4')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'p4'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              Phase 4 ($0.30)
            </button>
            <button
              onClick={() => setSelectedQueuePhase('p5')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'p5'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              Phase 5 ($0.40)
            </button>
            <button
              onClick={() => setSelectedQueuePhase('dex')}
              className={`px-2 py-1 rounded-lg border transition-all shrink-0 ${
                selectedQueuePhase === 'dex'
                  ? 'bg-fuchsia-600 text-slate-100 font-bold border-fuchsia-400'
                  : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              Live DEX
            </button>
          </div>

          {/* Phase-Wise Queue Details List */}
          <div className="space-y-2">
            {/* Phase 2 Queue Card */}
            {(selectedQueuePhase === 'all' || selectedQueuePhase === 'p2') && (
              <div className="bg-[#0b0416] p-2.5 rounded-xl border border-amber-500/30 hover:border-amber-400/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 2 Queue</span>
                    <span className="text-[9px] font-mono-crypto text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                      @ $0.10 Target
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black">
                      {p2Tokens > 0 ? 'Your Turn: Slot #5 in Line' : 'No Order Placed'}
                    </span>
                  </div>
                </div>

                {/* Queue Metrics Grid */}
                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono-crypto">
                  <div>
                    <span className="text-purple-300/70 block text-[8px] uppercase">Total Queued in Pool</span>
                    <span className="text-amber-300 font-bold">{(1400 + p2Tokens).toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-purple-400 block">({7 + (p2Tokens > 0 ? 1 : 0)} Sellers Total)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Your Sell Allocation</span>
                    <span className="text-slate-100 font-bold">{p2Tokens.toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-emerald-400 block">${p2Val.toFixed(2)} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Ahead of You</span>
                    <span className="text-fuchsia-300 font-bold">4 Orders (800 NXBC)</span>
                    <span className="text-[7.5px] text-emerald-400 block">Priority Group A</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-crypto text-purple-300/80">
                    <span>FIFO Execution Queue: {7 + (p2Tokens > 0 ? 1 : 0)} Sellers</span>
                    <span className="text-amber-300 font-semibold">{p2Tokens > 0 ? 'User #5 Position' : 'Standby'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: p2Tokens > 0 ? '62%' : '20%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Phase 3 Queue Card */}
            {(selectedQueuePhase === 'all' || selectedQueuePhase === 'p3') && (
              <div className="bg-[#0b0416] p-2.5 rounded-xl border border-amber-500/25 hover:border-amber-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 3 Queue</span>
                    <span className="text-[9px] font-mono-crypto text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                      @ $0.20 Target
                    </span>
                  </div>
                  <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black">
                    {p3Tokens > 0 ? 'Your Turn: Slot #7 in Line' : 'No Order Placed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono-crypto">
                  <div>
                    <span className="text-purple-300/70 block text-[8px] uppercase">Total Queued in Pool</span>
                    <span className="text-amber-300 font-bold">{(1000 + p3Tokens).toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-purple-400 block">({5 + (p3Tokens > 0 ? 1 : 0)} Sellers Total)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Your Sell Allocation</span>
                    <span className="text-slate-100 font-bold">{p3Tokens.toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-emerald-400 block">${p3Val.toFixed(2)} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Ahead of You</span>
                    <span className="text-fuchsia-300 font-bold">6 Orders (1,000 NXBC)</span>
                    <span className="text-[7.5px] text-amber-400 block">Next Unlock Batch</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-crypto text-purple-300/80">
                    <span>FIFO Execution Queue: {5 + (p3Tokens > 0 ? 1 : 0)} Sellers</span>
                    <span className="text-amber-300 font-semibold">{p3Tokens > 0 ? 'User #7 Position' : 'Standby'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-500 rounded-full" style={{ width: p3Tokens > 0 ? '45%' : '15%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Phase 4 Queue Card */}
            {(selectedQueuePhase === 'all' || selectedQueuePhase === 'p4') && (
              <div className="bg-[#0b0416] p-2.5 rounded-xl border border-purple-500/25 hover:border-fuchsia-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 4 Queue</span>
                    <span className="text-[9px] font-mono-crypto text-fuchsia-400 font-semibold bg-fuchsia-950/60 px-1.5 py-0.2 rounded border border-fuchsia-500/30">
                      @ $0.30 Target
                    </span>
                  </div>
                  <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 font-black">
                    {p4Tokens > 0 ? 'Your Turn: Slot #12 in Line' : 'No Order Placed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono-crypto">
                  <div>
                    <span className="text-purple-300/70 block text-[8px] uppercase">Total Queued in Pool</span>
                    <span className="text-fuchsia-300 font-bold">{(750 + p4Tokens).toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-purple-400 block">({4 + (p4Tokens > 0 ? 1 : 0)} Sellers Total)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Your Sell Allocation</span>
                    <span className="text-slate-100 font-bold">{p4Tokens.toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-emerald-400 block">${p4Val.toFixed(2)} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Ahead of You</span>
                    <span className="text-purple-300 font-bold">11 Orders</span>
                    <span className="text-[7.5px] text-purple-400 block">P4 Phase Order</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-crypto text-purple-300/80">
                    <span>FIFO Execution Queue: {4 + (p4Tokens > 0 ? 1 : 0)} Sellers</span>
                    <span className="text-fuchsia-300 font-semibold">{p4Tokens > 0 ? 'User #12 Position' : 'Standby'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                    <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full" style={{ width: p4Tokens > 0 ? '30%' : '10%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Phase 5 Queue Card */}
            {(selectedQueuePhase === 'all' || selectedQueuePhase === 'p5') && (
              <div className="bg-[#0b0416] p-2.5 rounded-xl border border-purple-500/25 hover:border-fuchsia-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-rajdhani">Phase 5 Queue</span>
                    <span className="text-[9px] font-mono-crypto text-fuchsia-400 font-semibold bg-fuchsia-950/60 px-1.5 py-0.2 rounded border border-fuchsia-500/30">
                      @ $0.40 Target
                    </span>
                  </div>
                  <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 font-black">
                    {p5Tokens > 0 ? 'Your Turn: Slot #15 in Line' : 'No Order Placed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono-crypto">
                  <div>
                    <span className="text-purple-300/70 block text-[8px] uppercase">Total Queued in Pool</span>
                    <span className="text-fuchsia-300 font-bold">{(600 + p5Tokens).toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-purple-400 block">({3 + (p5Tokens > 0 ? 1 : 0)} Sellers Total)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Your Sell Allocation</span>
                    <span className="text-slate-100 font-bold">{p5Tokens.toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-emerald-400 block">${p5Val.toFixed(2)} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Ahead of You</span>
                    <span className="text-purple-300 font-bold">14 Orders</span>
                    <span className="text-[7.5px] text-purple-400 block">P5 Phase Order</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-crypto text-purple-300/80">
                    <span>FIFO Execution Queue: {3 + (p5Tokens > 0 ? 1 : 0)} Sellers</span>
                    <span className="text-fuchsia-300 font-semibold">{p5Tokens > 0 ? 'User #15 Position' : 'Standby'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                    <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full" style={{ width: p5Tokens > 0 ? '20%' : '5%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Live DEX Queue Card */}
            {(selectedQueuePhase === 'all' || selectedQueuePhase === 'dex') && (
              <div className="bg-[#0b0416] p-2.5 rounded-xl border border-fuchsia-500/35 hover:border-fuchsia-400/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-rajdhani">Live DEX Liquidity Auto-Bridge</span>
                    <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-semibold bg-fuchsia-950/80 px-1.5 py-0.2 rounded border border-fuchsia-500/40">
                      @ $1,500 – $3,000 DEX
                    </span>
                  </div>
                  <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-md bg-fuchsia-500/25 border border-fuchsia-400/50 text-fuchsia-200 font-black">
                    {dexTokens > 0 ? 'Your Turn: Slot #18 in Line' : 'No Order Placed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-purple-500/15 text-[9px] font-mono-crypto">
                  <div>
                    <span className="text-purple-300/70 block text-[8px] uppercase">Total Queued in Pool</span>
                    <span className="text-fuchsia-300 font-bold">{(500 + dexTokens).toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-purple-400 block">({3 + (dexTokens > 0 ? 1 : 0)} Sellers Total)</span>
                  </div>
                  <div className="text-center">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Your Sell Allocation</span>
                    <span className="text-slate-100 font-bold">{dexTokens.toLocaleString()} NXBC</span>
                    <span className="text-[7.5px] text-emerald-400 block">${dexVal.toLocaleString()} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300/70 block text-[8px] uppercase">Execution Method</span>
                    <span className="text-emerald-400 font-bold">Auto-PancakeSwap</span>
                    <span className="text-[7.5px] text-purple-300 block">LP Smart Contract</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-crypto text-purple-300/80">
                    <span>DEX Priority Execution Queue</span>
                    <span className="text-fuchsia-300 font-semibold">{dexTokens > 0 ? 'Slot #18 (Smart Pair)' : 'Standby'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                    <div className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 rounded-full" style={{ width: dexTokens > 0 ? '85%' : '10%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FIFO Rule Explanation Footer */}
          <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-start gap-2 text-[8.5px] text-purple-300/90 font-mono-crypto">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-100 font-bold font-rajdhani text-[9.5px]">FIFO Execution Rule:</strong> All orders are timestamped on-chain. When Phase 2 unlocked buying volume enters, earlier buyers (<span className="text-amber-300">#1 to #4</span>) execute first, and your order (<span className="text-emerald-400 font-bold">#5</span>) automatically receives instant USDT payout to your wallet!
            </p>
          </div>
        </div>
      </div>

      {/* Plan Overviews: 10-Level Plan & 2x2 Matrix Plan Snapshots */}
      <div className="grid grid-cols-2 gap-2">
        {/* 10-Level Plan Card */}
        <div
          onClick={onOpenTeamPlanModal}
          className="p-2.5 rounded-2xl bg-gradient-to-b from-[#180e30] to-[#0f0720] border border-purple-500/20 hover:border-amber-400/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-300">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <Info className="w-3.5 h-3.5 text-purple-400 group-hover:text-amber-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase">
              10-Level Plan
            </h3>
            <p className="text-[9px] text-purple-300/70 font-mono-crypto">
              Earn up to 25% Multi-Tier
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-amber-300 font-medium pt-1 border-t border-purple-500/10">
            <span>View Rates</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 2x2 Matrix Plan Card */}
        <div
          onClick={onOpenMatrixModal}
          className="p-2.5 rounded-2xl bg-gradient-to-b from-[#180e30] to-[#0f0720] border border-purple-500/20 hover:border-fuchsia-400/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="p-1 rounded-lg bg-fuchsia-500/15 text-fuchsia-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-fuchsia-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase">
              2x2 Matrix Plan
            </h3>
            <p className="text-[9px] text-purple-300/70 font-mono-crypto">
              Auto Spillover Engine
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-fuchsia-300 font-medium pt-1 border-t border-purple-500/10">
            <span>Matrix Tree</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
