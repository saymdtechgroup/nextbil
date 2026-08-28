import React from 'react';
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
  // Find current active phase (or fallback to Phase 1)
  const activePhase = phases.find((p) => p.status === 'active') || phases[0];
  const nextPhase = phases.find((p) => p.phaseNumber === activePhase.phaseNumber + 1);

  const tokensSold = activePhase.tokensSold;
  const totalSupply = activePhase.totalSupply;
  const tokensRemaining = Math.max(0, totalSupply - tokensSold);
  const progressPercent = Math.min(100, Math.max(0, (tokensSold / totalSupply) * 100));
  const usdRaised = tokensSold * activePhase.rate;
  const usdTarget = totalSupply * activePhase.rate;

  return (
    <div className="flex-1 p-3.5 space-y-4 relative">
      {/* Top Header: Logo + 3D Coin */}
      <div className="flex flex-col items-center justify-center py-4 border-b border-purple-500/10 gap-2">
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
            <p className="text-[9px] font-medium text-purple-300/70 uppercase">
              {nextPhase ? `Next (${nextPhase.shortName}) Rate` : 'Final Target'}
            </p>
            <p className="text-xs font-black text-fuchsia-400 font-mono-crypto mt-0.5 whitespace-nowrap">
              {nextPhase ? `${nextPhase.shortName}: ${nextPhase.rateLabel || '$' + nextPhase.rate.toFixed(2)} (${nextPhase.multiplier})` : 'DEX: $1,500 – $3,000'}
            </p>
            <span className="text-[9px] text-emerald-400 font-mono-crypto block whitespace-nowrap">
              100% Auto-Unlock
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
              <strong>P2P 80/20 & FIFO System:</strong> Coins you <strong>Sell</strong> in upcoming phases will enter a global <strong>FIFO (First-In, First-Out)</strong> queue. Orders placed first are executed first. Every new coin purchase allocates <strong>20% to clear the user sell queue</strong> and <strong>80% to the platform reserve</strong> (Instant USDT payout).
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
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 cursor-pointer font-rajdhani uppercase"
            >
              <Zap className="w-4 h-4 fill-black text-black" />
              <span>Buy in {activePhase.shortName} (@ ${activePhase.rate.toFixed(2)})</span>
            </button>
          )}

          {onSimulateFillPhase && (
            <button
              onClick={onSimulateFillPhase}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 hover:text-white text-[11px] font-mono-crypto transition-all active:scale-95"
              title="Click to fill current phase to 100% and test next phase activation"
            >
              <Play className="w-3 h-3 text-amber-400" />
              <span>Test 100% Phase Transition</span>
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
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between">
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
          <div className="bg-[#0b0518] p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between">
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

          {/* Phase 4, Phase 5, DEX Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* P4 */}
            <div className="bg-[#0b0518] p-2 rounded-xl border border-purple-500/20 text-center">
              <span className="text-[9px] font-bold text-purple-300 uppercase block font-rajdhani">
                P4 (@ $0.30)
              </span>
              <span className="text-xs font-black font-mono-crypto text-fuchsia-300 my-0.5 block">
                {allocation.p4Percent}%
              </span>
              <span className="text-[8px] font-mono-crypto text-purple-400">
                {Math.floor(allocation.totalTokensPurchased * (allocation.p4Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>

            {/* P5 */}
            <div className="bg-[#0b0518] p-2 rounded-xl border border-purple-500/20 text-center">
              <span className="text-[9px] font-bold text-purple-300 uppercase block font-rajdhani">
                P5 (@ $0.40)
              </span>
              <span className="text-xs font-black font-mono-crypto text-fuchsia-300 my-0.5 block">
                {allocation.p5Percent}%
              </span>
              <span className="text-[8px] font-mono-crypto text-purple-400">
                {Math.floor(allocation.totalTokensPurchased * (allocation.p5Percent / 100)).toLocaleString()} NXBC
              </span>
            </div>

            {/* DEX */}
            <div className="bg-[#0b0518] p-2 rounded-xl border border-purple-500/20 text-center">
              <span className="text-[9px] font-bold text-fuchsia-300 uppercase block font-rajdhani">
                Live DEX
              </span>
              <span className="text-xs font-black font-mono-crypto text-fuchsia-300 my-0.5 block">
                {allocation.dexPercent}%
              </span>
              <span className="text-[8px] font-mono-crypto text-purple-400">
                {Math.floor(allocation.totalTokensPurchased * (allocation.dexPercent / 100)).toLocaleString()} NXBC
              </span>
            </div>
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
