import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Search,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  Sliders,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { AllocationState, UserEarnings, PhaseConfig, QueueEntry } from '../types/crypto';

export interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  phases?: PhaseConfig[];
  sellQueue?: QueueEntry[];
  onUpdateSellQueue?: (newQueue: QueueEntry[]) => void;
  onSimulateExternalBuy?: (amount: number) => void;
  onOpenTeamPlanModal?: () => void;
  onOpenMatrixModal?: () => void;
  onOpenBuyModal?: () => void;
  levelIncomeUsd?: number;
  matrixIncomeUsd?: number;
  walletAddress?: string | null;
  walletConnected?: boolean;
}

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Benchmark demonstration queue entries if the fresh database has zero orders yet
const DEFAULT_DEMO_QUEUE: QueueEntry[] = [
  // Phase 2 Orders (Users who bought Phase 1 and placed sales for Phase 2, ordered strictly FIFO)
  { id: 'fifo-p2-1', userId: '0x71c8...a89F', phaseNumber: 2, tokensRequested: 10000, tokensSold: 4200 },
  { id: 'fifo-p2-2', userId: '0x94B2...e3C1', phaseNumber: 2, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p2-3', userId: '0x3a9B...74F1', phaseNumber: 2, tokensRequested: 8500, tokensSold: 0 },
  { id: 'fifo-p2-4', userId: '0x88F0...C194', phaseNumber: 2, tokensRequested: 12000, tokensSold: 0 },
  { id: 'fifo-p2-5', userId: '0x5C21...98B2', phaseNumber: 2, tokensRequested: 20000, tokensSold: 0 },
  { id: 'fifo-p2-6', userId: '0x12E4...884A', phaseNumber: 2, tokensRequested: 14500, tokensSold: 0 },
  { id: 'fifo-p2-7', userId: '0x43D9...22A1', phaseNumber: 2, tokensRequested: 9800, tokensSold: 0 },
  { id: 'fifo-p2-8', userId: '0x66B7...5F02', phaseNumber: 2, tokensRequested: 16000, tokensSold: 0 },
  { id: 'fifo-p2-9', userId: '0x81C3...9E10', phaseNumber: 2, tokensRequested: 11200, tokensSold: 0 },
  { id: 'fifo-p2-10', userId: '0x90F4...33D8', phaseNumber: 2, tokensRequested: 25000, tokensSold: 0 },
  { id: 'fifo-p2-11', userId: '0x14A2...BC71', phaseNumber: 2, tokensRequested: 7500, tokensSold: 0 },
  { id: 'fifo-p2-12', userId: '0x78E9...41DA', phaseNumber: 2, tokensRequested: 18000, tokensSold: 0 },

  // Phase 3 Orders (Next Phase after P2)
  { id: 'fifo-p3-1', userId: '0x71c8...a89F', phaseNumber: 3, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p3-2', userId: '0x94B2...e3C1', phaseNumber: 3, tokensRequested: 22500, tokensSold: 0 },
  { id: 'fifo-p3-3', userId: '0x3a9B...74F1', phaseNumber: 3, tokensRequested: 12750, tokensSold: 0 },
  { id: 'fifo-p3-4', userId: '0x88F0...C194', phaseNumber: 3, tokensRequested: 18000, tokensSold: 0 },
  { id: 'fifo-p3-5', userId: '0x5C21...98B2', phaseNumber: 3, tokensRequested: 30000, tokensSold: 0 },
  { id: 'fifo-p3-6', userId: '0x12E4...884A', phaseNumber: 3, tokensRequested: 21750, tokensSold: 0 },
  { id: 'fifo-p3-7', userId: '0x43D9...22A1', phaseNumber: 3, tokensRequested: 14700, tokensSold: 0 },
  { id: 'fifo-p3-8', userId: '0x66B7...5F02', phaseNumber: 3, tokensRequested: 24000, tokensSold: 0 },
  { id: 'fifo-p3-9', userId: '0x81C3...9E10', phaseNumber: 3, tokensRequested: 16800, tokensSold: 0 },
  { id: 'fifo-p3-10', userId: '0x90F4...33D8', phaseNumber: 3, tokensRequested: 37500, tokensSold: 0 },

  // Phase 4 Orders
  { id: 'fifo-p4-1', userId: '0x71c8...a89F', phaseNumber: 4, tokensRequested: 10000, tokensSold: 0 },
  { id: 'fifo-p4-2', userId: '0x94B2...e3C1', phaseNumber: 4, tokensRequested: 15000, tokensSold: 0 },
  { id: 'fifo-p4-3', userId: '0x3a9B...74F1', phaseNumber: 4, tokensRequested: 8500, tokensSold: 0 },
  { id: 'fifo-p4-4', userId: '0x88F0...C194', phaseNumber: 4, tokensRequested: 12000, tokensSold: 0 },
  { id: 'fifo-p4-5', userId: '0x5C21...98B2', phaseNumber: 4, tokensRequested: 20000, tokensSold: 0 },

  // Phase 5 Orders
  { id: 'fifo-p5-1', userId: '0x71c8...a89F', phaseNumber: 5, tokensRequested: 7500, tokensSold: 0 },
  { id: 'fifo-p5-2', userId: '0x94B2...e3C1', phaseNumber: 5, tokensRequested: 11250, tokensSold: 0 },
  { id: 'fifo-p5-3', userId: '0x3a9B...74F1', phaseNumber: 5, tokensRequested: 6375, tokensSold: 0 },
  { id: 'fifo-p5-4', userId: '0x88F0...C194', phaseNumber: 5, tokensRequested: 9000, tokensSold: 0 },
  { id: 'fifo-p5-5', userId: '0x5C21...98B2', phaseNumber: 5, tokensRequested: 15000, tokensSold: 0 },
];

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  userEarnings,
  allocation,
  phases = [],
  sellQueue = [],
  onSimulateExternalBuy,
  onOpenBuyModal,
  walletAddress,
  walletConnected = false,
}) => {
  const [showValues, setShowValues] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'my-fifo' | 'global-fifo'>('grid');

  // Find the currently active running phase (default phase 1 if none marked active)
  const currentRunningPhase = useMemo(() => {
    const active = phases.find((p) => p.status === 'active');
    return active ? active.phaseNumber : 1;
  }, [phases]);

  // Next phase whose queue is queued to sell when that phase runs
  const nextTargetPhase = useMemo(() => {
    return Math.min(5, currentRunningPhase + 1);
  }, [currentRunningPhase]);

  // Default Global FIFO filter to the NEXT phase relative to current running phase
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>(nextTargetPhase);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [limitTo10, setLimitTo10] = useState(true);

  // Synchronize filter when active phase changes if user was on next phase default
  useEffect(() => {
    if (phaseFilter !== 'all') {
      setPhaseFilter(nextTargetPhase);
    }
  }, [nextTargetPhase]);

  const totalTokens = asNumber(allocation.totalTokensPurchased);

  // Derive phase rate map
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

  // Token breakdown calculations
  const p1Allocated = allocation.p1Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p1Percent || 0) / 100));
  const p1Sold = allocation.p1Tokens?.sold ?? 0;

  const p2Allocated = allocation.p2Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p2Percent || 20) / 100));
  const p2Sold = allocation.p2Tokens?.sold ?? 0;

  const p3Allocated = allocation.p3Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p3Percent || 30) / 100));
  const p3Sold = allocation.p3Tokens?.sold ?? 0;

  const p4Allocated = allocation.p4Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p4Percent || 20) / 100));
  const p4Sold = allocation.p4Tokens?.sold ?? 0;

  const p5Allocated = allocation.p5Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p5Percent || 15) / 100));
  const p5Sold = allocation.p5Tokens?.sold ?? 0;

  const dexAllocated = allocation.dexTokens?.allocated ?? Math.floor(totalTokens * ((allocation.dexPercent || 15) / 100));

  // The 6 Milestone Vectors (6-Box Grid)
  const milestoneBoxes = useMemo(() => [
    {
      phaseNumber: 1,
      title: 'Phase 1: Base Hold',
      badge: 'Acquired Hold',
      rate: rateMap[1] ?? 0.01,
      rateLabel: `$${(rateMap[1] ?? 0.01).toFixed(2)}`,
      allocated: p1Allocated,
      sold: p1Sold,
      type: 'hold',
      desc: 'Base holding in private wallet'
    },
    {
      phaseNumber: 2,
      title: 'Phase 2: FIFO Vector #1',
      badge: 'Target $0.15',
      rate: rateMap[2] ?? 0.15,
      rateLabel: `$${(rateMap[2] ?? 0.15).toFixed(2)}`,
      allocated: p2Allocated,
      sold: p2Sold,
      type: 'fifo',
      desc: 'Auto-sells at Phase 2 via FIFO queue'
    },
    {
      phaseNumber: 3,
      title: 'Phase 3: FIFO Vector #2',
      badge: 'Target $0.20',
      rate: rateMap[3] ?? 0.20,
      rateLabel: `$${(rateMap[3] ?? 0.20).toFixed(2)}`,
      allocated: p3Allocated,
      sold: p3Sold,
      type: 'fifo',
      desc: 'Auto-sells at Phase 3 via FIFO queue'
    },
    {
      phaseNumber: 4,
      title: 'Phase 4: FIFO Vector #3',
      badge: 'Target $0.25',
      rate: rateMap[4] ?? 0.25,
      rateLabel: `$${(rateMap[4] ?? 0.25).toFixed(2)}`,
      allocated: p4Allocated,
      sold: p4Sold,
      type: 'fifo',
      desc: 'Auto-sells at Phase 4 via FIFO queue'
    },
    {
      phaseNumber: 5,
      title: 'Phase 5: FIFO Vector #4',
      badge: 'Target $0.30',
      rate: rateMap[5] ?? 0.30,
      rateLabel: `$${(rateMap[5] ?? 0.30).toFixed(2)}`,
      allocated: p5Allocated,
      sold: p5Sold,
      type: 'fifo',
      desc: 'Auto-sells at Phase 5 via FIFO queue'
    },
    {
      phaseNumber: 6,
      title: 'Phase 6: DEX Listing',
      badge: 'DEX $1,500+',
      rate: rateMap[6] ?? 1500.0,
      rateLabel: `$${(rateMap[6] ?? 1500.0).toLocaleString()}`,
      allocated: dexAllocated,
      sold: 0,
      type: 'dex',
      desc: 'Locked for Decentralized Exchange launch'
    },
  ], [rateMap, p1Allocated, p1Sold, p2Allocated, p2Sold, p3Allocated, p3Sold, p4Allocated, p4Sold, p5Allocated, p5Sold, dexAllocated]);

  // Combine live sell queue or fallback to demo entries
  const effectiveQueue: QueueEntry[] = useMemo(() => {
    if (sellQueue && sellQueue.length > 0) {
      return sellQueue;
    }
    // If the user has allocated tokens, inject their orders at the front of demo queue
    const userAllocQueue: QueueEntry[] = [];
    const addr = walletAddress || '0x71c8...a89F';
    if (p2Allocated > 0) userAllocQueue.push({ id: 'my-p2', userId: addr, phaseNumber: 2, tokensRequested: p2Allocated, tokensSold: p2Sold });
    if (p3Allocated > 0) userAllocQueue.push({ id: 'my-p3', userId: addr, phaseNumber: 3, tokensRequested: p3Allocated, tokensSold: p3Sold });
    if (p4Allocated > 0) userAllocQueue.push({ id: 'my-p4', userId: addr, phaseNumber: 4, tokensRequested: p4Allocated, tokensSold: p4Sold });
    if (p5Allocated > 0) userAllocQueue.push({ id: 'my-p5', userId: addr, phaseNumber: 5, tokensRequested: p5Allocated, tokensSold: p5Sold });

    if (userAllocQueue.length > 0) {
      return [...userAllocQueue, ...DEFAULT_DEMO_QUEUE];
    }
    return DEFAULT_DEMO_QUEUE;
  }, [sellQueue, walletAddress, p2Allocated, p2Sold, p3Allocated, p3Sold, p4Allocated, p4Sold, p5Allocated, p5Sold]);

  // Filtered queue for Global Tab
  const filteredQueue = useMemo(() => {
    return effectiveQueue.filter((entry) => {
      const matchPhase = phaseFilter === 'all' || entry.phaseNumber === phaseFilter;
      const matchSearch = !searchQuery || entry.userId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPhase && matchSearch;
    });
  }, [effectiveQueue, phaseFilter, searchQuery]);

  // Global FIFO displayed records (defaults to 10 records as requested by user)
  const displayedQueue = useMemo(() => {
    if (limitTo10) {
      return filteredQueue.slice(0, 10);
    }
    return filteredQueue;
  }, [filteredQueue, limitTo10]);

  // User's own FIFO entries
  const myQueueEntries = useMemo(() => {
    const normalizedUser = (walletAddress || '').toLowerCase();
    return effectiveQueue.map((entry, index) => ({
      ...entry,
      globalPosition: index + 1,
    })).filter((entry) => {
      if (!normalizedUser) return entry.userId.toLowerCase().includes('0x71c8') || entry.userId.toLowerCase().includes('me');
      return entry.userId.toLowerCase() === normalizedUser || entry.userId.toLowerCase().includes(normalizedUser.slice(0, 6));
    });
  }, [effectiveQueue, walletAddress]);

  const handleSimulateClick = () => {
    setIsSimulating(true);
    if (onSimulateExternalBuy) {
      onSimulateExternalBuy(10000);
    }
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="flex-1 min-w-0 p-3 sm:p-4 space-y-4 relative">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-fuchsia-600/20 border border-amber-500/30 p-2 text-amber-300 shadow-md">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold uppercase tracking-wider text-slate-100 font-rajdhani">
                Assets &amp; FIFO Queue
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono-crypto">
                6 Phase Vectors
              </span>
            </div>
            <p className="text-[10px] text-purple-300/70 font-mono-crypto">
              Milestone 6-Box Grid &bull; Live FIFO Smart Contract Orderbook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowValues((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/60 px-2.5 py-1.5 text-xs text-purple-300 hover:text-amber-300 transition-colors"
            title="Toggle sensitive balance visibility"
          >
            {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-mono-crypto hidden sm:inline">{showValues ? 'Hide' : 'Show'}</span>
          </button>
        </div>
      </div>

      {/* Main Asset Balance Banner */}
      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1d0c38] via-[#140828] to-[#0a0414] p-4 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-purple-300/80 font-mono-crypto">
                Total Wallet Allocation
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold font-mono-crypto">
                {allocation.isLocked ? '🔒 Smart Contract Locked' : '🟢 Active Allocation'}
              </span>
            </div>
            <p className="mt-1 text-2xl sm:text-3xl font-black text-amber-300 font-mono-crypto tracking-tight">
              {showValues ? `${totalTokens.toLocaleString()} NXBC` : '•••••••• NXBC'}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-purple-300/80 font-mono-crypto">
              <span>Token Sell USDT: <strong className="text-emerald-400 font-bold">${showValues ? ((userEarnings?.availableUsdt || 0).toFixed(2)) : '•••'}</strong></span>
              <span>&bull;</span>
              <span>Withdrawn: <strong className="text-fuchsia-300">${showValues ? ((userEarnings?.withdrawnUsdt || 0).toFixed(2)) : '•••'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBuyModal}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 text-xs font-bold font-rajdhani uppercase tracking-wider hover:opacity-90 shadow-md transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy &amp; Allocate</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0d051e] border border-purple-500/20 rounded-xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-rajdhani font-bold whitespace-nowrap transition-all ${
            activeTab === 'grid'
              ? 'bg-gradient-to-r from-amber-500/30 to-fuchsia-600/30 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-purple-300/70 hover:text-purple-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>6-Box Phase Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('my-fifo')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-rajdhani font-bold whitespace-nowrap transition-all ${
            activeTab === 'my-fifo'
              ? 'bg-gradient-to-r from-amber-500/30 to-fuchsia-600/30 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-purple-300/70 hover:text-purple-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My FIFO Queue ({myQueueEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('global-fifo')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-rajdhani font-bold whitespace-nowrap transition-all ${
            activeTab === 'global-fifo'
              ? 'bg-gradient-to-r from-amber-500/30 to-fuchsia-600/30 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-purple-300/70 hover:text-purple-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live Global FIFO ({effectiveQueue.length})</span>
        </button>
      </div>

      {/* TAB 1: 6-BOX MILESTONE GRID */}
      {activeTab === 'grid' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-rajdhani">
                6 Phase Vectors (Milestone Sell Schedule)
              </span>
            </div>
            <span className="text-[10px] text-purple-300/70 font-mono-crypto">
              Target rate fulfillment via Smart Contract FIFO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {milestoneBoxes.map((box) => {
              const remaining = Math.max(0, box.allocated - box.sold);
              const progress = box.allocated > 0 ? Math.min(100, (box.sold / box.allocated) * 100) : 0;
              const grossUsdt = box.sold * box.rate;
              const expectedTotalUsdt = box.allocated * box.rate;

              return (
                <div
                  key={box.phaseNumber}
                  className="rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#140828] to-[#0c0418] p-3.5 flex flex-col justify-between relative hover:border-amber-500/40 transition-all shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100 font-rajdhani flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:animate-ping" />
                        {box.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {box.badge}
                      </span>
                    </div>

                    <p className="text-[10px] text-purple-300/70 leading-tight font-mono-crypto">
                      {box.desc}
                    </p>

                    <div className="bg-[#0a0314] rounded-xl p-2.5 border border-purple-500/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono-crypto">
                        <span className="text-purple-300/80">Allocated:</span>
                        <strong className="text-slate-100 font-bold">
                          {showValues ? `${box.allocated.toLocaleString()} NXBC` : '••••'}
                        </strong>
                      </div>

                      {box.type === 'fifo' && (
                        <>
                          <div className="flex items-center justify-between text-[11px] font-mono-crypto">
                            <span className="text-purple-300/80">Sold / Fulfilled:</span>
                            <strong className="text-emerald-400 font-bold">
                              {showValues ? `${box.sold.toLocaleString()} NXBC` : '••••'}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono-crypto">
                            <span className="text-purple-300/80">In Queue Remaining:</span>
                            <strong className="text-amber-300 font-bold">
                              {showValues ? `${remaining.toLocaleString()} NXBC` : '••••'}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono-crypto pt-1 border-t border-purple-500/15">
                            <span className="text-purple-300/80">Earned USDT:</span>
                            <strong className="text-emerald-300 font-bold">
                              {showValues ? `$${grossUsdt.toFixed(2)}` : '••••'}
                            </strong>
                          </div>
                        </>
                      )}

                      {box.type === 'dex' && (
                        <div className="flex items-center justify-between text-[11px] font-mono-crypto pt-1 border-t border-purple-500/15">
                          <span className="text-purple-300/80">Est. Listing Value:</span>
                          <strong className="text-fuchsia-300 font-bold">
                            {showValues ? `$${expectedTotalUsdt.toLocaleString()}` : '••••'}
                          </strong>
                        </div>
                      )}

                      {box.type === 'hold' && (
                        <div className="flex items-center justify-between text-[11px] font-mono-crypto pt-1 border-t border-purple-500/15">
                          <span className="text-purple-300/80">Holding Status:</span>
                          <strong className="text-amber-300 font-bold">Self-Custody Hold</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {box.type === 'fifo' && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[9px] font-mono-crypto text-purple-300">
                        <span>FIFO Progress</span>
                        <span className="text-emerald-400 font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#080210] rounded-full overflow-hidden border border-purple-500/20">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: MY INDIVIDUAL FIFO QUEUE */}
      {activeTab === 'my-fifo' && (
        <section className="space-y-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-slate-100">Individual FIFO Position Tracker</p>
                <p className="text-[10px] text-blue-300/80 font-mono-crypto">
                  Connected wallet orders waiting in the FIFO line for incoming buyer volume.
                </p>
              </div>
            </div>

            {onSimulateExternalBuy && (
              <button
                onClick={handleSimulateClick}
                disabled={isSimulating}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-all text-xs font-mono-crypto font-bold flex items-center gap-1.5 shrink-0"
                title="Simulate 10,000 token buyer volume on BSC"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>Test 10K Buy Fill</span>
              </button>
            )}
          </div>

          {myQueueEntries.length > 0 ? (
            <div className="space-y-3">
              {myQueueEntries.map((entry, idx) => {
                const progress = entry.tokensRequested > 0
                  ? Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100)
                  : 0;
                const remaining = Math.max(0, entry.tokensRequested - entry.tokensSold);
                const isSettled = entry.tokensSold >= entry.tokensRequested && entry.tokensRequested > 0;
                const phasePrice = rateMap[entry.phaseNumber] || 0.15;
                const earnedUsdt = entry.tokensSold * phasePrice;
                const remainingUsdt = remaining * phasePrice;

                return (
                  <div
                    key={entry.id || idx}
                    className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#190a30] to-[#0c0418] p-4 space-y-3 shadow-lg hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono-crypto bg-gradient-to-r from-amber-500/30 to-fuchsia-600/30 text-amber-300 border border-amber-400/50">
                          Position #{entry.globalPosition} in Line
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-crypto bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Phase {entry.phaseNumber} Target (${phasePrice.toFixed(2)})
                        </span>
                      </div>

                      {isSettled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>100% Settled</span>
                        </span>
                      ) : entry.tokensSold > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Fulfilling Now ({progress.toFixed(0)}%)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Waiting in Line</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0a0314] p-3 rounded-xl border border-purple-500/15 text-xs font-mono-crypto">
                      <div>
                        <span className="text-[9px] text-purple-300/70 block uppercase">Requested</span>
                        <strong className="text-slate-100 font-bold">{entry.tokensRequested.toLocaleString()} NXBC</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-300/70 block uppercase">Tokens Sold</span>
                        <strong className="text-emerald-400 font-bold">{entry.tokensSold.toLocaleString()} NXBC</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-300/70 block uppercase">Remaining</span>
                        <strong className="text-amber-300 font-bold">{remaining.toLocaleString()} NXBC</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-purple-300/70 block uppercase">Earned Payout</span>
                        <strong className="text-emerald-300 font-bold">${earnedUsdt.toFixed(2)} USDT</strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono-crypto">
                        <span className="text-purple-300/80">FIFO Fulfillment Progress</span>
                        <span className="text-emerald-400 font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#080210] rounded-full overflow-hidden border border-purple-500/20">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-purple-300/70 font-mono-crypto pt-1">
                      <span>Target Price: ${phasePrice.toFixed(2)} USDT / NXBC</span>
                      <span>Expected Remaining: ${remainingUsdt.toFixed(2)} USDT</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#110624] border border-purple-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-rajdhani">No Active Queue Orders</h3>
                <p className="text-xs text-purple-300/70 font-mono-crypto max-w-md mx-auto mt-1">
                  Purchase NXBC during the presale and configure your phase sell schedule to automatically enter the FIFO smart contract line.
                </p>
              </div>
              <button
                onClick={onOpenBuyModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 text-xs font-bold font-rajdhani uppercase tracking-wider"
              >
                Join Presale &amp; Enter FIFO
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: LIVE GLOBAL FIFO QUEUE */}
      {activeTab === 'global-fifo' && (
        <section className="space-y-3">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Phase Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono-crypto text-purple-300/70 uppercase mr-1">Phase:</span>
              <button
                onClick={() => setPhaseFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-crypto font-bold transition-all ${
                  phaseFilter === 'all'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50'
                    : 'bg-purple-950/40 text-purple-300 hover:text-purple-100 border border-purple-500/20'
                }`}
              >
                All
              </button>
              {[2, 3, 4, 5].map((pNum) => {
                const isNextTarget = pNum === nextTargetPhase;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPhaseFilter(pNum)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-crypto font-bold transition-all relative ${
                      phaseFilter === pNum
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 shadow-sm'
                        : 'bg-purple-950/40 text-purple-300 hover:text-purple-100 border border-purple-500/20'
                    }`}
                  >
                    P{pNum}
                    {isNextTarget && (
                      <span className="ml-1 px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold uppercase">
                        Next
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search, Limit Toggle & Simulation */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-400" />
                <input
                  type="text"
                  placeholder="Search wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#0d051e] border border-purple-500/30 rounded-xl text-xs text-slate-100 font-mono-crypto placeholder:text-purple-400/50 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* 10 Records toggle */}
              <button
                onClick={() => setLimitTo10(!limitTo10)}
                className={`px-2 py-1.5 rounded-xl border text-[11px] font-mono-crypto font-bold flex items-center gap-1 transition-all ${
                  limitTo10
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-purple-950/40 text-purple-300 border-purple-500/20 hover:text-purple-100'
                }`}
                title={limitTo10 ? 'Currently showing Top 10 FIFO queue entries' : 'Showing all queue entries'}
              >
                <span>{limitTo10 ? 'Top 10' : 'All Rows'}</span>
              </button>

              {onSimulateExternalBuy && (
                <button
                  onClick={handleSimulateClick}
                  disabled={isSimulating}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 text-xs font-mono-crypto font-bold flex items-center gap-1 shrink-0"
                  title="Simulate 10,000 Token Buy on BSC to advance FIFO queue"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isSimulating ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">Fill 10K</span>
                </button>
              )}
            </div>
          </div>

          {/* FIFO Status Alert with Next Phase & Rules Information */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-amber-950/20 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-[11px] font-mono-crypto leading-relaxed">
                <span className="text-amber-300 font-bold">Phase {currentRunningPhase} Active:</span>{' '}
                Current presale is in Phase {currentRunningPhase}. Global FIFO automatically showcases{' '}
                <strong className="text-emerald-300">Phase {phaseFilter === 'all' ? 'All' : phaseFilter}</strong> queue (Next phase auto-selected). First buyer in line is settled first by smart contract order matching.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[10px] text-purple-300 font-mono-crypto bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
                Showing {displayedQueue.length} of {filteredQueue.length}
              </span>
              <span className={`text-[10px] font-mono-crypto font-bold px-2 py-0.5 rounded border shrink-0 ${
                sellQueue && sellQueue.length > 0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
              }`}>
                {sellQueue && sellQueue.length > 0 ? '● DB Connected (Live)' : '● DB Ready (Strict FIFO)'}
              </span>
            </div>
          </div>

          {/* Queue Orders List */}
          <div className="space-y-2.5">
            {displayedQueue.map((entry, idx) => {
              const progress = entry.tokensRequested > 0
                ? Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100)
                : 0;
              const isSettled = entry.tokensSold >= entry.tokensRequested && entry.tokensRequested > 0;
              const isUserOrder = walletAddress && entry.userId.toLowerCase().includes(walletAddress.slice(0, 6).toLowerCase());
              const phasePrice = rateMap[entry.phaseNumber] || 0.15;

              return (
                <div
                  key={entry.id || idx}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isUserOrder
                      ? 'bg-[#1e0d3d] border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-[#110624] border-purple-500/20 hover:border-purple-400/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-mono-crypto text-slate-100 font-bold truncate">
                        {entry.userId}
                      </span>
                      {isUserOrder && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black font-mono-crypto uppercase">
                          You
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-crypto bg-blue-500/20 text-blue-300">
                        Phase {entry.phaseNumber} (${phasePrice.toFixed(2)})
                      </span>
                      {isSettled && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono-crypto bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Settled
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-purple-300/70 font-mono-crypto">
                      <span>Requested: <strong className="text-slate-200">{entry.tokensRequested.toLocaleString()}</strong></span>
                      <span>Sold: <strong className="text-emerald-400">{entry.tokensSold.toLocaleString()}</strong></span>
                      <span>Remaining: <strong className="text-amber-300">{(entry.tokensRequested - entry.tokensSold).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="w-full sm:w-44 shrink-0 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono-crypto">
                      <span className="text-purple-300/70">Filled</span>
                      <span className="text-emerald-400 font-bold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#080210] rounded-full overflow-hidden border border-purple-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedQueue.length === 0 && (
              <div className="p-6 text-center text-xs text-purple-300/60 font-mono-crypto bg-[#0d051e] rounded-xl border border-purple-500/20">
                No FIFO orders match the current filter.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
