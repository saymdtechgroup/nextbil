import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Flame, Info, Sparkles, TrendingUp, ArrowRight, Wallet, DollarSign, Activity, ShieldCheck, CheckCircle2, Layers, Zap } from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry } from '../types/crypto';
import { DEFAULT_DEMO_QUEUE } from '../utils/fifoHelper';

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
  sellQueue = [],
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

  // Active presale running phase
  const currentRunningPhase = activePhase?.phaseNumber ?? 1;
  // Next phase whose queue is scheduled to execute
  const nextTargetPhase = Math.min(5, currentRunningPhase + 1);

  // Automatically default filter to the NEXT phase relative to the running presale
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number>(nextTargetPhase);

  useEffect(() => {
    setSelectedPhaseFilter(nextTargetPhase);
  }, [nextTargetPhase]);

  const rateMap: Record<number, number> = useMemo(() => {
    const map: Record<number, number> = {
      1: 0.01,
      2: 0.15,
      3: 0.20,
      4: 0.25,
      5: 0.30,
      6: 1500.0,
    };
    phases.forEach((p) => {
      if (p.phaseNumber && p.rate) {
        map[p.phaseNumber] = p.rate;
      }
    });
    return map;
  }, [phases]);

  // Token breakdown
  const p2Allocated = allocation.p2Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p2Percent || 20) / 100));
  const p2Sold = allocation.p2Tokens?.sold ?? 0;
  const p3Allocated = allocation.p3Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p3Percent || 30) / 100));
  const p3Sold = allocation.p3Tokens?.sold ?? 0;
  const p4Allocated = allocation.p4Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p4Percent || 20) / 100));
  const p4Sold = allocation.p4Tokens?.sold ?? 0;
  const p5Allocated = allocation.p5Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p5Percent || 15) / 100));
  const p5Sold = allocation.p5Tokens?.sold ?? 0;
  const dexAllocated = allocation.dexTokens?.allocated ?? Math.floor(totalTokens * ((allocation.dexPercent || 5) / 100));
  const dexSold = allocation.dexTokens?.sold ?? 0;

  // Effective Global Queue (combining live DB records with benchmark queue & user orders)
  const effectiveQueue: QueueEntry[] = useMemo(() => {
    const userAllocQueue: QueueEntry[] = [];
    const addr = walletAddress || '0x71c8...a89F';
    if (p2Allocated > 0) userAllocQueue.push({ id: 'my-p2', userId: addr, phaseNumber: 2, tokensRequested: p2Allocated, tokensSold: p2Sold });
    if (p3Allocated > 0) userAllocQueue.push({ id: 'my-p3', userId: addr, phaseNumber: 3, tokensRequested: p3Allocated, tokensSold: p3Sold });
    if (p4Allocated > 0) userAllocQueue.push({ id: 'my-p4', userId: addr, phaseNumber: 4, tokensRequested: p4Allocated, tokensSold: p4Sold });
    if (p5Allocated > 0) userAllocQueue.push({ id: 'my-p5', userId: addr, phaseNumber: 5, tokensRequested: p5Allocated, tokensSold: p5Sold });
    if (dexAllocated > 0) userAllocQueue.push({ id: 'my-dex', userId: addr, phaseNumber: 6, tokensRequested: dexAllocated, tokensSold: dexSold });

    if (sellQueue && sellQueue.length > 0) {
      const dbIds = new Set(sellQueue.map((o) => o.id));
      const userExtra = userAllocQueue.filter((u) => !dbIds.has(u.id));
      return [...userExtra, ...sellQueue];
    }

    if (userAllocQueue.length > 0) {
      return [...userAllocQueue, ...DEFAULT_DEMO_QUEUE];
    }
    return DEFAULT_DEMO_QUEUE;
  }, [sellQueue, walletAddress, p2Allocated, p2Sold, p3Allocated, p3Sold, p4Allocated, p4Sold, p5Allocated, p5Sold, dexAllocated, dexSold]);

  // Filter queue by phase (completed/settled orders automatically clear out)
  const filteredQueue = useMemo(() => {
    const list = effectiveQueue.filter((entry) => {
      const isCompleted = entry.tokensSold >= entry.tokensRequested && entry.tokensRequested > 0;
      return entry.phaseNumber === selectedPhaseFilter && !isCompleted;
    });
    // If no records in this phase yet, fallback to phase-specific demo queue
    if (list.length === 0) {
      return DEFAULT_DEMO_QUEUE.filter((entry) => entry.phaseNumber === selectedPhaseFilter);
    }
    return list;
  }, [effectiveQueue, selectedPhaseFilter]);

  // Top 10 records for Next Phase
  const top10Queue = useMemo(() => {
    return filteredQueue.slice(0, 10);
  }, [filteredQueue]);

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

      {/* GLOBAL FIFO ENGINE WIDGET: TOP 10 NEXT PHASE RECORDS */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#120824] border border-blue-500/25 p-4 sm:p-5 shadow-xl shadow-blue-950/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-rajdhani uppercase tracking-wider text-slate-100">
                  Global FIFO Sell Queue
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  10 Records
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-rajdhani">
                Target:{' '}
                <span className="text-emerald-400 font-bold">
                  {selectedPhaseFilter === 6 ? 'Phase 6 (Live DEX Launch)' : `Phase ${selectedPhaseFilter}`}
                </span>{' '}
                {selectedPhaseFilter !== 6 && `(Next after Running Phase ${currentRunningPhase})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-crypto flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              P{currentRunningPhase} Presale Running
            </span>
          </div>
        </div>

        {/* Phase Filter Quick Pills */}
        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          <button
            onClick={() => setSelectedPhaseFilter(nextTargetPhase)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedPhaseFilter === nextTargetPhase
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Next Phase (P{nextTargetPhase})</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-black/30 rounded text-emerald-300 font-mono-crypto">
              ${(rateMap[nextTargetPhase] ?? 0.15).toFixed(2)}
            </span>
          </button>

          {[2, 3, 4, 5].map((pNum) => {
            if (pNum === nextTargetPhase) return null;
            return (
              <button
                key={pNum}
                onClick={() => setSelectedPhaseFilter(pNum)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedPhaseFilter === pNum
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-700/50'
                }`}
              >
                <span>Phase {pNum}</span>
                <span className="text-[9px] opacity-70 font-mono-crypto">
                  ${(rateMap[pNum] ?? 0.15).toFixed(2)}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedPhaseFilter(6)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedPhaseFilter === 6
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}
          >
            <Zap className="w-3 h-3 text-purple-400" />
            <span>DEX Launch</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-black/30 rounded text-amber-300 font-mono-crypto">
              $1,500+
            </span>
          </button>
        </div>

        {/* Explain Rule Box */}
        <div className="mt-3 p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/15 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 font-rajdhani leading-relaxed">
            {selectedPhaseFilter === 6 ? (
              <>
                <span className="text-amber-300 font-bold">Phase 6 DEX Allocation:</span> Tokens reserved for public Decentralized Exchange launch ($1,500+ listing target). Settleable via FIFO liquidity pool upon DEX listing.
              </>
            ) : (
              <>
                Phase {currentRunningPhase} buyers queued auto-sales for{' '}
                <span className="text-amber-300 font-bold">Phase {selectedPhaseFilter}</span>. When target phase runs, incoming buyer volume settles queued sellers automatically in order (#1 first).
              </>
            )}
          </p>
        </div>

        {/* 10 Records Table */}
        <div className="mt-3.5 space-y-1.5">
          <div className="grid grid-cols-12 text-[10px] uppercase font-bold font-mono-crypto text-slate-400 px-2 py-1">
            <span className="col-span-2">Rank</span>
            <span className="col-span-4">Seller Wallet</span>
            <span className="col-span-3 text-right">Tokens</span>
            <span className="col-span-3 text-right">USDT Value</span>
          </div>

          {top10Queue.map((item, index) => {
            const isFirst = index === 0;
            const targetRate = rateMap[item.phaseNumber] ?? 0.15;
            const usdtVal = (item.tokensRequested || 0) * targetRate;
            const isMyWallet =
              walletAddress &&
              (item.userId.toLowerCase() === walletAddress.toLowerCase() ||
                item.userId.includes(walletAddress.slice(0, 6)));

            return (
              <div
                key={item.id || index}
                className={`grid grid-cols-12 items-center p-2 rounded-xl text-xs transition-all border ${
                  isFirst
                    ? 'bg-gradient-to-r from-emerald-950/40 via-blue-950/30 to-black/40 border-emerald-500/40 shadow-sm shadow-emerald-900/20'
                    : isMyWallet
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-black/30 hover:bg-slate-800/40 border-white/5'
                }`}
              >
                {/* Rank & FIFO Number */}
                <div className="col-span-2 flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono-crypto ${
                      isFirst
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                        : index < 3
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  {isFirst && (
                    <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>

                {/* Seller Wallet & Phase Badge */}
                <div className="col-span-4 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-mono-crypto truncate text-[11px] ${
                        isMyWallet ? 'text-amber-300 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {item.userId}
                    </span>
                    {isMyWallet && (
                      <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-rajdhani flex items-center gap-1">
                    <span className="text-blue-400 font-bold">P{item.phaseNumber}</span>
                    <span>@ ${targetRate.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tokens Amount */}
                <div className="col-span-3 text-right">
                  <span className="font-mono-crypto font-bold text-slate-200 text-xs">
                    {item.tokensRequested.toLocaleString()}
                  </span>
                  <div className="text-[9px] text-slate-400 font-rajdhani uppercase">NXBC</div>
                </div>

                {/* USDT Value & Status */}
                <div className="col-span-3 text-right">
                  <span className="font-mono-crypto font-bold text-emerald-400 text-xs">
                    ${usdtVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <div className="text-[9px] font-mono-crypto text-slate-400">
                    {isFirst ? (
                      <span className="text-emerald-400 font-bold uppercase">Next Settle</span>
                    ) : item.tokensSold > 0 ? (
                      <span className="text-blue-300">
                        {Math.round((item.tokensSold / item.tokensRequested) * 100)}% Fill
                      </span>
                    ) : (
                      <span>Queued</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-rajdhani">
          <span>
            Showing top {top10Queue.length} of {filteredQueue.length} FIFO sellers for Phase{' '}
            {selectedPhaseFilter === 'all' ? nextTargetPhase : selectedPhaseFilter}.
          </span>
          <span className="text-[10px] font-mono-crypto text-emerald-400/80">
            Auto-Updated
          </span>
        </div>
      </div>
    </div>
  );
};