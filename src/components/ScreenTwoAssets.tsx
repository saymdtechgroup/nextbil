import React, { useEffect, useState } from 'react';
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

import { UserEarnings } from '../types/crypto';

interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
  walletAddress?: string | null;
}

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  userEarnings,
  allocation,
  onOpenTeamPlanModal,
  onOpenMatrixModal,
  levelIncomeUsd,
  matrixIncomeUsd,
  walletAddress,
}) => {
  const [showValues, setShowValues] = useState<boolean>(true);
  const [saleOrders, setSaleOrders] = useState<Array<{
    id: number; phaseNumber: number; amountTokens: number; soldTokens: number;
    remainingTokens: number; tokenPrice: number; expectedUsdt: number;
    realizedUsdt: number; remainingUsdt: number; status: string; createdAt?: string;
  }>>([]);
  const [globalFifo, setGlobalFifo] = useState<Array<{
    phaseNumber: number; totalOrders: number; totalQueuedTokens: number;
    orders: Array<{ id: number; userId: number; walletAddress: string; amountTokens: number;
      remainingTokens: number; tokenPrice: number; status: string; position: number;
      aheadTokens: number; expectedRemainingUsdt: number; createdAt?: string; }>;
  }>>([]);
  const [fifoLoading, setFifoLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) { setSaleOrders([]); return; }
    let cancelled = false;
    const loadOrders = async () => {
      try {
        const r = await fetch(`/api/presale/sale-orders/${walletAddress}`);
        const data = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && data.success) setSaleOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (e) {
        console.error('Failed to load personal phase sale orders:', e);
      }
    };
    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [walletAddress]);

  // Load the complete public FIFO queue. This is server-derived data, not localStorage.
  useEffect(() => {
    let cancelled = false;
    const loadGlobalFifo = async () => {
      try {
        const r = await fetch('/api/presale/fifo-global');
        const data = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && data.success) {
          setGlobalFifo(Array.isArray(data.phases) ? data.phases : []);
        }
      } catch (e) {
        console.error('Failed to load global FIFO queue:', e);
      } finally {
        if (!cancelled) setFifoLoading(false);
      }
    };
    loadGlobalFifo();
    const timer = setInterval(loadGlobalFifo, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Compute token amounts for each box based on user allocation state
  const totalTokens = allocation.totalTokensPurchased;
  const p1Tokens = Math.round(totalTokens * ((allocation.p1Percent || 0) / 100));
  const p2Tokens = Math.round(totalTokens * (allocation.p2Percent / 100));
  const p3Tokens = Math.round(totalTokens * (allocation.p3Percent / 100));
  const p4Tokens = Math.round(totalTokens * (allocation.p4Percent / 100));
  const p5Tokens = Math.round(totalTokens * (allocation.p5Percent / 100));
  const dexTokens = Math.round(totalTokens * (allocation.dexPercent / 100));
  const unallocatedTokens = Math.max(
    0,
    totalTokens - (p1Tokens + p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens)
  );

  // Projected value calculation:
  // P2: $0.10, P3: $1.00, P4: $10.00, P5: $100.00, DEX: est $1500.00, Unallocated at Phase 1 rate $0.01
  const p1Val = p1Tokens * 0.01;
  const p2Val = p2Tokens * 0.10;
  const p3Val = p3Tokens * 1.00;
  const p4Val = p4Tokens * 10.00;
  const p5Val = p5Tokens * 100.00;
  const dexVal = dexTokens * 1500.00;
  const unallocatedVal = unallocatedTokens * 0.01;

  const totalAllocatedUsd = p2Val + p3Val + p4Val + p5Val + dexVal;
  const initialCostUsd = totalTokens * 0.01;

  return (
    <div className="nxbc-home-theme flex-1 p-3.5 space-y-3.5 relative">
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
              Connected Wallet Balance (NXBC)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono-crypto gold-gradient-text">
                {showValues ? `${totalTokens.toLocaleString()} NXBC` : '••••••••'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono-crypto font-medium">
              100% held safely in your Trust Wallet
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
              FIFO Queue Virtually Registered
            </span>
            <span className="text-purple-400">{allocation.lockedTimestamp || 'Active'}</span>
          </div>
        )}
      </div>

      {/* Global FIFO Queue — live server data for all active users */}
      <div className="rounded-xl bg-[#0b0518] border border-cyan-500/20 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-bold text-cyan-300 font-rajdhani uppercase">Global FIFO Execution Queue</span>
            <p className="text-[8px] text-purple-300/70 font-mono-crypto">One live FIFO head per phase • next user appears after completion</p>
          </div>
          <span className="text-[8px] text-emerald-300 font-mono-crypto">LIVE • 5s</span>
        </div>
        {fifoLoading ? (
          <div className="py-3 text-center text-[9px] text-purple-300 font-mono-crypto">Loading global queue...</div>
        ) : globalFifo.length === 0 ? (
          <div className="py-3 text-center text-[9px] text-purple-300/70 font-mono-crypto">No active FIFO orders.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {globalFifo.map((phase) => (
              <div key={phase.phaseNumber} className="rounded-lg border border-cyan-500/15 bg-purple-950/30 p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-cyan-300 font-rajdhani">PHASE {phase.phaseNumber}</span>
                  <span className="text-[8px] text-purple-300 font-mono-crypto">
                    {phase.totalOrders} orders • {phase.totalQueuedTokens.toLocaleString()} NXBC queued
                  </span>
                </div>
                <div className="space-y-1">
                  {phase.orders.slice(0, 1).map((o) => {
                    const isMine = !!walletAddress && o.walletAddress.toLowerCase() === `${walletAddress.slice(0, 6).toLowerCase()}...${walletAddress.slice(-4).toLowerCase()}`;
                    return (
                      <div key={o.id} className={`rounded-md px-2 py-1.5 border ${isMine ? 'border-amber-400/40 bg-amber-500/10' : 'border-purple-500/10 bg-[#090317]/60'}`}>
                        <div className="flex items-center justify-between gap-2 text-[8px] font-mono-crypto">
                          <span className="text-slate-100 font-bold">#{o.position} {o.walletAddress}</span>
                          <span className="text-amber-300">{o.remainingTokens.toLocaleString()} NXBC</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5 text-[7px] font-mono-crypto">
                          <span className="text-purple-400">Ahead: <b className="text-fuchsia-300">{o.aheadTokens.toLocaleString()} NXBC</b></span>
                          <span className="text-purple-300">@ ${o.tokenPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {phase.totalOrders > 1 && (
                  <div className="mt-1 text-[7px] text-purple-300/70 font-mono-crypto text-center">
                    {phase.totalOrders - 1} more order(s) waiting in FIFO sequence
                  </div>
                )}
              </div>
            ))}
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

        {/* User-selected Phase 1 / Phase 2 allocation summary */}
        <div className="rounded-xl bg-[#0b0518] border border-amber-500/30 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-300 font-rajdhani uppercase">Your Phase Sale Allocation</span>
            <span className="text-[8px] text-emerald-300 font-mono-crypto">Saved to account</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-purple-950/50 border border-amber-500/20 p-2">
              <div className="text-[9px] text-purple-300">Phase 1 Sell</div>
              <div className="text-sm font-black text-amber-300 font-mono-crypto">{showValues ? `${(allocation.p1Tokens?.allocated || p1Tokens).toLocaleString()} NXBC` : '••••'}</div>
              <div className="text-[8px] text-purple-400">Sold: {showValues ? (allocation.p1Tokens?.sold || 0).toLocaleString() : '••'}</div>
            </div>
            <div className="rounded-lg bg-purple-950/50 border border-emerald-500/20 p-2">
              <div className="text-[9px] text-purple-300">Phase 2 Sell</div>
              <div className="text-sm font-black text-emerald-300 font-mono-crypto">{showValues ? `${(allocation.p2Tokens?.allocated || p2Tokens).toLocaleString()} NXBC` : '••••'}</div>
              <div className="text-[8px] text-purple-400">Sold: {showValues ? (allocation.p2Tokens?.sold || 0).toLocaleString() : '••'}</div>
            </div>
          </div>
        </div>

        {/* Persistent personal FIFO sale orders */}
        <div className="rounded-xl bg-[#0b0518] border border-purple-500/20 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-100 font-rajdhani uppercase">Your FIFO Sale Orders</span>
            <span className="text-[8px] text-purple-300 font-mono-crypto">20% buyer flow • 80% admin</span>
          </div>
          {saleOrders.length === 0 ? (
            <div className="text-[9px] text-purple-300/70 font-mono-crypto py-2">No phase sale orders yet.</div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {saleOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-purple-500/15 bg-purple-950/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold text-amber-300 font-rajdhani">PHASE {o.phaseNumber}</span>
                    <span className={`text-[8px] uppercase font-bold ${o.status === 'completed' ? 'text-emerald-300' : o.status === 'partially_filled' ? 'text-amber-300' : 'text-cyan-300'}`}>{o.status.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1.5 text-[8px] font-mono-crypto">
                    <div><span className="text-purple-400 block">ORDER</span><span className="text-slate-100">{o.amountTokens.toLocaleString()} NXBC</span></div>
                    <div><span className="text-purple-400 block">SOLD</span><span className="text-emerald-300">{o.soldTokens.toLocaleString()}</span></div>
                    <div><span className="text-purple-400 block">LEFT</span><span className="text-amber-300">{o.remainingTokens.toLocaleString()}</span></div>
                  </div>
                  <div className="flex justify-between mt-1.5 pt-1 border-t border-purple-500/10 text-[8px] font-mono-crypto">
                    <span className="text-purple-300">@ ${o.tokenPrice.toFixed(4)} • Expected ${o.expectedUsdt.toFixed(2)}</span>
                    <span className="text-emerald-300">Received ${o.realizedUsdt.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                {showValues ? `${(allocation.p2Tokens?.allocated || p2Tokens).toLocaleString()} NXBC (Sold: ${allocation.p2Tokens?.sold || 0})` : '••••'}
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
                {showValues ? `${(allocation.p3Tokens?.allocated || p3Tokens).toLocaleString()} NXBC (Sold: ${allocation.p3Tokens?.sold || 0})` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-amber-400/90 font-semibold">
                @ $1.00 Rate
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
                {showValues ? `${(allocation.p4Tokens?.allocated || p4Tokens).toLocaleString()} NXBC (Sold: ${allocation.p4Tokens?.sold || 0})` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-fuchsia-400/90 font-semibold">
                @ $10.00 Rate
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
                {showValues ? `${(allocation.p5Tokens?.allocated || p5Tokens).toLocaleString()} NXBC (Sold: ${allocation.p5Tokens?.sold || 0})` : '••••'}
              </span>
              <span className="text-[9px] font-mono-crypto text-fuchsia-400/90 font-semibold">
                @ $100.00 Rate
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
                0 Directs / 0 Team
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
