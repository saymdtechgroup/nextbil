import React, { useEffect, useState } from 'react';
import { Coins, Eye, EyeOff, ListOrdered, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { AllocationState, UserEarnings } from '../types/crypto';

interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
  walletAddress?: string | null;
}

type PersonalOrder = {
  id: number;
  phaseNumber: number;
  amountTokens: number;
  soldTokens: number;
  remainingTokens: number;
  tokenPrice: number;
  realizedUsdt: number;
  status: string;
  position?: number;
};

type GlobalOrder = {
  id: number;
  walletAddress: string;
  remainingTokens: number;
  tokenPrice: number;
  position: number;
  aheadTokens: number;
};

type GlobalPhase = {
  phaseNumber: number;
  totalOrders: number;
  totalQueuedTokens: number;
  orders: GlobalOrder[];
};

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const shortAddress = (address: string) => {
  if (!address) return 'Unknown wallet';
  if (address.includes('...')) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({ allocation, walletAddress }) => {
  const [showValues, setShowValues] = useState(true);
  const [globalFifo, setGlobalFifo] = useState<GlobalPhase[]>([]);
  const [saleOrders, setSaleOrders] = useState<PersonalOrder[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const totalTokens = asNumber(allocation.totalTokensPurchased);

  useEffect(() => {
    let cancelled = false;
    const loadGlobalQueue = async () => {
      try {
        const response = await fetch('/api/presale/fifo-global');
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && data.success) {
          setGlobalFifo(Array.isArray(data.phases) ? data.phases : []);
        }
      } catch (error) {
        console.error('Failed to load global FIFO:', error);
      } finally {
        if (!cancelled) setLoadingGlobal(false);
      }
    };
    loadGlobalQueue();
    const timer = window.setInterval(loadGlobalQueue, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setSaleOrders([]);
      setLoadingPersonal(false);
      return;
    }
    let cancelled = false;
    const loadPersonalQueue = async () => {
      setLoadingPersonal(true);
      try {
        const response = await fetch(`/api/presale/sale-orders/${encodeURIComponent(walletAddress)}`);
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && data.success) {
          setSaleOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (error) {
        console.error('Failed to load individual FIFO:', error);
      } finally {
        if (!cancelled) setLoadingPersonal(false);
      }
    };
    loadPersonalQueue();
    const timer = window.setInterval(loadPersonalQueue, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [walletAddress]);

  return (
    <div className="flex-1 min-w-0 p-3.5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-amber-300"><Coins className="w-5 h-5" /></div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-rajdhani">Assets & FIFO</h1>
            <p className="text-[10px] text-purple-300/70 font-mono-crypto">One live FIFO source: global queue + your position</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowValues((value) => !value)} className="rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-purple-300 hover:text-amber-300" aria-label="Toggle balance visibility">
          {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1d0c38] via-[#140828] to-[#0a0414] p-4">
        <p className="text-[10px] uppercase tracking-wider text-purple-300/80">Connected wallet balance</p>
        <p className="mt-1 text-3xl font-black text-amber-300 font-mono-crypto">{showValues ? `${totalTokens.toLocaleString()} NXBC` : '••••••••'}</p>
        <p className="mt-1 text-[10px] text-emerald-400 font-mono-crypto">Wallet allocation</p>
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] text-amber-200/80 font-mono-crypto">FIFO is displayed only in this Assets section. The queue below is the live server data.</div>
      </section>

      <section className="rounded-2xl border border-cyan-500/25 bg-[#0b0518] p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2"><ListOrdered className="w-5 h-5 text-cyan-300" /><div><h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-rajdhani">Global FIFO Queue</h2><p className="text-[9px] text-purple-300/70 font-mono-crypto">All users • grouped by phase • oldest order first</p></div></div>
          <span className="whitespace-nowrap text-[9px] text-emerald-300 font-mono-crypto">LIVE • 5s</span>
        </div>
        {loadingGlobal ? <p className="py-5 text-center text-xs text-purple-300 font-mono-crypto">Loading global queue...</p> : globalFifo.length === 0 ? <p className="py-5 text-center text-xs text-purple-300/70 font-mono-crypto">No active FIFO orders.</p> : <div className="space-y-3">{globalFifo.map((phase) => <div key={phase.phaseNumber} className="rounded-xl border border-cyan-500/20 bg-purple-950/35 p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-bold text-cyan-300 font-rajdhani">PHASE {phase.phaseNumber}</span><span className="text-[10px] text-purple-200 font-mono-crypto">{phase.totalOrders} orders • {asNumber(phase.totalQueuedTokens).toLocaleString()} NXBC queued</span></div><div className="space-y-2">{(phase.orders || []).map((order) => <div key={order.id} className="rounded-lg border border-purple-500/20 bg-[#090317]/70 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-100 font-mono-crypto">#{order.position} {shortAddress(order.walletAddress)}</span><span className="text-xs font-bold text-amber-300 font-mono-crypto">{asNumber(order.remainingTokens).toLocaleString()} NXBC</span></div><div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-mono-crypto"><span className="text-fuchsia-300">Ahead: {asNumber(order.aheadTokens).toLocaleString()} NXBC</span><span className="text-purple-200">@ ${asNumber(order.tokenPrice).toFixed(4)}</span></div></div>)}</div></div>)}</div>}
      </section>

      <section className="rounded-2xl border border-fuchsia-500/25 bg-[#0b0518] p-3">
        <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><UserRound className="w-5 h-5 text-fuchsia-300" /><div><h2 className="text-xs font-bold uppercase tracking-wider text-fuchsia-300 font-rajdhani">Your FIFO Position</h2><p className="text-[9px] text-purple-300/70 font-mono-crypto">Only your own sale orders and progress</p></div></div><RefreshCw className={`w-4 h-4 text-emerald-300 ${loadingPersonal ? 'animate-spin' : ''}`} /></div>
        {!walletAddress ? <p className="py-5 text-center text-xs text-purple-300/70 font-mono-crypto">Connect your wallet to view your FIFO position.</p> : loadingPersonal && saleOrders.length === 0 ? <p className="py-5 text-center text-xs text-purple-300 font-mono-crypto">Loading your FIFO orders...</p> : saleOrders.length === 0 ? <p className="py-5 text-center text-xs text-purple-300/70 font-mono-crypto">No individual FIFO orders yet.</p> : <div className="space-y-2">{saleOrders.map((order) => <div key={order.id} className="rounded-xl border border-fuchsia-500/20 bg-purple-950/30 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-amber-300 font-rajdhani">PHASE {order.phaseNumber}</span><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] uppercase text-emerald-300">{String(order.status || 'open').replace(/_/g, ' ')}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono-crypto"><div><p className="text-purple-400">ORDERED</p><p className="mt-1 text-slate-100">{asNumber(order.amountTokens).toLocaleString()}</p></div><div><p className="text-purple-400">SOLD</p><p className="mt-1 text-emerald-300">{asNumber(order.soldTokens).toLocaleString()}</p></div><div><p className="text-purple-400">LEFT</p><p className="mt-1 text-amber-300">{asNumber(order.remainingTokens).toLocaleString()}</p></div></div><div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-purple-500/15 pt-2 text-[10px] font-mono-crypto"><span className="text-purple-200">Rate: ${asNumber(order.tokenPrice).toFixed(4)}</span><span className="text-emerald-300">Received: ${asNumber(order.realizedUsdt).toFixed(2)}</span></div></div>)}</div>}
      </section>
    </div>
  );
};
