import React, { useEffect, useMemo, useState } from 'react';
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

type FifoOrder = {
  id?: number | string;
  orderId?: number | string;
  position?: number;
  rank?: number;
  globalPosition?: number;
  phase?: number | string;
  phaseNumber?: number;
  tokens?: number;
  tokenAmount?: number;
  amountTokens?: number;
  remainingTokens?: number;
  walletAddress?: string;
  wallet?: string;
  status?: string;
  createdAt?: string;
};

type FifoSnapshot = {
  totalQueuedTokens?: number;
  totalOrders?: number;
  orders?: FifoOrder[];
  phaseTotals?: Array<{
    phase?: number | string;
    phaseNumber?: number;
    tokens?: number;
    totalTokens?: number;
    tokenAmount?: number;
    amountTokens?: number;
    orders?: number;
    totalOrders?: number;
  }>;
};

const numberValue = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

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
  const [fifoSnapshot, setFifoSnapshot] = useState<FifoSnapshot | null>(null);
  const [fifoLoading, setFifoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadGlobalFifo = async () => {
      try {
        const response = await fetch('/api/presale/fifo-global', { credentials: 'include' });
        if (!response.ok) throw new Error(`FIFO API ${response.status}`);
        const payload = await response.json();
        if (!cancelled) {
          const data = payload?.data ?? payload;
          setFifoSnapshot(data);
        }
      } catch (error) {
        console.warn('[FIFO] Could not load global queue:', error);
      } finally {
        if (!cancelled) setFifoLoading(false);
      }
    };
    loadGlobalFifo();
    const interval = window.setInterval(loadGlobalFifo, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const activePhase = phases.find((phase) => phase.status === 'active') ?? phases[0];
  const totalTokens = numberValue(allocation.totalTokensPurchased);
  const p2Tokens = Math.floor(totalTokens * (numberValue(allocation.p2Percent) / 100));
  const p3Tokens = Math.floor(totalTokens * (numberValue(allocation.p3Percent) / 100));
  const p4Tokens = Math.floor(totalTokens * (numberValue(allocation.p4Percent) / 100));
  const p5Tokens = Math.floor(totalTokens * (numberValue(allocation.p5Percent) / 100));
  const dexTokens = Math.floor(totalTokens * (numberValue(allocation.dexPercent) / 100));
  const allocatedTokens = p2Tokens + p3Tokens + p4Tokens + p5Tokens + dexTokens;
  const unallocatedTokens = Math.max(0, totalTokens - allocatedTokens);

  const tokensSold = numberValue(activePhase?.tokensSold);
  const totalSupply = numberValue(activePhase?.totalSupply);
  const tokensRemaining = Math.max(0, totalSupply - tokensSold);
  const progressPercent = totalSupply > 0 ? Math.min(100, (tokensSold / totalSupply) * 100) : 0;
  const currentRate = numberValue(activePhase?.rate);
  const nextPhase = activePhase ? phases.find((phase) => phase.phaseNumber === (activePhase.phaseNumber ?? 1) + 1) : undefined;

  const fifoOrders = fifoSnapshot?.orders ?? [];
  const sortedFifoOrders = useMemo(() => {
    return [...fifoOrders].sort((a, b) => {
      const aPosition = numberValue(a.globalPosition, a.position, a.rank);
      const bPosition = numberValue(b.globalPosition, b.position, b.rank);
      if (aPosition > 0 && bPosition > 0 && aPosition !== bPosition) return aPosition - bPosition;
      if (aPosition > 0 && bPosition === 0) return -1;
      if (aPosition === 0 && bPosition > 0) return 1;
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aDate - bDate;
    });
  }, [fifoOrders]);

  const userOrders = useMemo(() => {
    const normalizedWallet = walletAddress.toLowerCase();
    return sortedFifoOrders.filter((order) => {
      const orderWallet = String(order.walletAddress ?? order.wallet ?? '').toLowerCase();
      return Boolean(normalizedWallet) && orderWallet === normalizedWallet;
    });
  }, [sortedFifoOrders, walletAddress]);

  const userFifoPosition = useMemo(() => {
    if (userOrders.length === 0) return 0;
    const first = userOrders[0];
    const explicit = numberValue(first.globalPosition, first.position, first.rank);
    if (explicit > 0) return explicit;
    return sortedFifoOrders.findIndex((order) => order === first) + 1;
  }, [sortedFifoOrders, userOrders]);

  const userQueuedTokens = userOrders.reduce(
    (sum, order) => sum + numberValue(order.remainingTokens, order.tokens, order.tokenAmount, order.amountTokens),
    0,
  );

  const globalQueuedTokens = numberValue(
    fifoSnapshot?.totalQueuedTokens,
    fifoOrders.reduce((sum, order) => sum + numberValue(order.remainingTokens, order.tokens, order.tokenAmount, order.amountTokens), 0),
    allocatedTokens,
  );
  const globalOrderCount = numberValue(fifoSnapshot?.totalOrders, fifoOrders.length);

  const phasePositionForUser = (phaseNumber: number): number => {
    const phaseOrders = sortedFifoOrders.filter((order) => Number(order.phaseNumber ?? order.phase) === phaseNumber);
    const index = phaseOrders.findIndex((order) => {
      const orderWallet = String(order.walletAddress ?? order.wallet ?? '').toLowerCase();
      return Boolean(walletAddress) && orderWallet === walletAddress.toLowerCase();
    });
    return index >= 0 ? index + 1 : 0;
  };

  const personalRows = useMemo(() => [
    { label: 'P2 FIFO', phaseNumber: 2, tokens: p2Tokens, rate: 0.1 },
    { label: 'P3 FIFO', phaseNumber: 3, tokens: p3Tokens, rate: 1 },
    { label: 'P4 FIFO', phaseNumber: 4, tokens: p4Tokens, rate: 10 },
    { label: 'P5 FIFO', phaseNumber: 5, tokens: p5Tokens, rate: 100 },
    { label: 'DEX FIFO', phaseNumber: 6, tokens: dexTokens, rate: 1500 },
  ].map((phase) => ({ ...phase, position: phasePositionForUser(phase.phaseNumber) })), [p2Tokens, p3Tokens, p4Tokens, p5Tokens, dexTokens, sortedFifoOrders, walletAddress]);

  const globalPhaseRows = useMemo(() => {
    const totals = new Map<string, { phaseNumber: number; tokens: number; orders: number }>();
    const phaseTotals = fifoSnapshot?.phaseTotals ?? [];

    // phaseTotals is the authoritative historical aggregate when the API sends it.
    // Do not add the individual orders again, otherwise totals and order counts get doubled.
    if (phaseTotals.length > 0) {
      phaseTotals.forEach((phase) => {
        const phaseNumber = Number(phase.phaseNumber ?? phase.phase);
        if (!Number.isFinite(phaseNumber)) return;
        totals.set(String(phaseNumber), {
          phaseNumber,
          tokens: numberValue(phase.tokens, phase.totalTokens, phase.tokenAmount, phase.amountTokens),
          orders: numberValue(phase.orders, phase.totalOrders),
        });
      });
    } else {
      sortedFifoOrders.forEach((order) => {
        const phaseNumber = Number(order.phaseNumber ?? order.phase);
        if (!Number.isFinite(phaseNumber)) return;
        const key = String(phaseNumber);
        const current = totals.get(key) ?? { phaseNumber, tokens: 0, orders: 0 };
        current.tokens += numberValue(order.remainingTokens, order.tokens, order.tokenAmount, order.amountTokens);
        current.orders += 1;
        totals.set(key, current);
      });
    }

    return Array.from(totals.values())
      .sort((a, b) => a.phaseNumber - b.phaseNumber)
      .map((phase) => ({
        label: `P${phase.phaseNumber} FIFO`,
        tokens: phase.tokens,
        orders: phase.orders,
      }));
  }, [fifoSnapshot?.phaseTotals, sortedFifoOrders]);

  return (
    <div className="flex-1 p-3.5 space-y-4 relative">
      <div className="flex flex-col items-center justify-center py-3 border-b border-purple-500/10 gap-2">
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /><span className="text-[11px] font-bold text-amber-300 font-mono-crypto uppercase">BSC Mainnet</span></div>
          {walletConnected && walletAddress ? <div className="px-2 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[9px] font-mono-crypto text-emerald-300">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div> : <button onClick={onOpenWalletModal} className="px-2 py-1 bg-purple-950/50 border border-purple-500/30 rounded-lg text-[9px] font-mono-crypto text-purple-300">Connect Wallet</button>}
        </div>
        <div className="w-full px-2 flex items-center gap-1 text-[10px] font-black uppercase font-rajdhani text-amber-300"><Sparkles className="w-3.5 h-3.5 text-amber-400" />1-Token Ecosystem Matrix</div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="bg-[#0b0318] p-2 rounded-xl border border-emerald-500/30 text-center"><span className="text-[8px] text-purple-300/70 font-mono-crypto block">Total Earnings</span><span className="text-sm font-black font-mono-crypto text-emerald-300 block">${totalEarningUsdt.toFixed(2)}</span></div>
          <div className="bg-[#0b0318] p-2 rounded-xl border border-fuchsia-500/30 text-center"><span className="text-[8px] text-purple-300/70 font-mono-crypto block">Total Withdrawn</span><span className="text-sm font-black font-mono-crypto text-fuchsia-300 block">${totalWithdrawnUsdt.toFixed(2)}</span></div>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d0a36] via-[#140628] to-[#0a0316] border-2 border-amber-400/50 p-4 shadow-[0_10px_35px_rgba(245,158,11,0.2)]">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 gap-2"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 border border-amber-400 text-amber-300 font-rajdhani uppercase"><Flame className="w-3.5 h-3.5" />{activePhase?.name ?? 'Phase'}: LIVE SELLING</span><span className="text-[10px] text-fuchsia-300 font-mono-crypto flex items-center gap-1"><Clock className="w-3 h-3" />Step {activePhase?.phaseNumber ?? 1}/5</span></div>
        <div className="bg-[#0c051a]/90 rounded-xl p-3 border border-amber-500/25 mb-3 flex items-center justify-between gap-2"><div><p className="text-[10px] font-bold text-purple-300/80 uppercase font-rajdhani">Current Live Coin Price</p><span className="text-3xl font-black font-mono-crypto text-amber-300">${currentRate.toFixed(2)}</span><span className="text-xs font-bold text-amber-300 font-mono-crypto ml-1">USD/NXBC</span></div><div className="text-right"><p className="text-[9px] font-bold text-purple-300/80 uppercase font-rajdhani">{nextPhase ? `Next (${nextPhase.name})` : 'Target Listing Rate'}</p><span className="text-sm font-black text-fuchsia-300 font-mono-crypto">{nextPhase?.rateLabel ?? '$1,500 – $3,000'}</span></div></div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20"><span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Total Phase Supply</span><span className="text-xs font-black font-mono-crypto text-slate-100 block">{totalSupply.toLocaleString()} NXBC</span></div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-amber-500/30"><span className="text-[9px] text-amber-300/80 uppercase block font-rajdhani">Tokens Sold ({progressPercent.toFixed(1)}%)</span><span className="text-xs font-black font-mono-crypto text-amber-300 block">{tokensSold.toLocaleString()} NXBC</span></div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20"><span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Tokens Remaining</span><span className="text-xs font-black font-mono-crypto text-fuchsia-300 block">{tokensRemaining.toLocaleString()} NXBC</span></div>
          <div className="bg-[#110624]/90 p-2.5 rounded-xl border border-purple-500/20"><span className="text-[9px] text-purple-300/70 uppercase block font-rajdhani">Your Allocation</span><span className="text-xs font-black font-mono-crypto text-emerald-300 block">{totalTokens.toLocaleString()} NXBC</span></div>
        </div>
        <div className="space-y-1.5 mb-3"><div className="flex justify-between text-[10px] font-mono-crypto"><span className="text-purple-200/90">Phase Sales Progress</span><span className="text-amber-300 font-bold">{progressPercent.toFixed(1)}%</span></div><div className="w-full h-3 rounded-full bg-purple-950/90 border border-purple-700/50 overflow-hidden p-[1.5px]"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-amber-300" style={{ width: `${progressPercent}%` }} /></div></div>
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 mb-3"><Info className="w-4 h-4 text-amber-400 shrink-0" /><p className="text-[10px] text-amber-200/90 leading-tight">The next phase opens automatically after the current phase reaches 100% sold.</p></div>
        <button onClick={onOpenBuyModal} className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 text-slate-950 font-bold text-[11px] uppercase font-rajdhani tracking-wider">Buy &amp; Allocate</button>
      </section>

      <section className="rounded-2xl bg-gradient-to-b from-[#16092c] via-[#100622] to-[#0b0318] border border-amber-500/30 p-3 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 gap-2"><div className="flex items-center gap-2"><div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300"><ListOrdered className="w-4 h-4" /></div><div><h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase">Global FIFO Queue</h3><p className="text-[9px] text-purple-300/70 font-mono-crypto">All users · chronological execution order</p></div></div><span className="text-[8px] font-mono-crypto px-1.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">LIVE</span></div>
        <div className="grid grid-cols-2 gap-2"><div className="p-2 rounded-xl bg-[#0b0518] border border-purple-500/20 text-center"><span className="text-[8px] text-purple-300/80 uppercase block font-rajdhani">Global Queued</span><span className="text-sm font-black font-mono-crypto text-amber-300 block">{globalQueuedTokens.toLocaleString()} NXBC</span><span className="text-[8px] text-purple-400 font-mono-crypto">{globalOrderCount.toLocaleString()} Active Orders</span></div><div className="p-2 rounded-xl bg-[#0b0518] border border-amber-500/30 text-center"><span className="text-[8px] text-amber-300 uppercase block font-rajdhani">Queue Status</span><span className="text-sm font-black font-mono-crypto text-emerald-300 block">{globalOrderCount > 0 ? 'ACTIVE' : 'STANDBY'}</span><span className="text-[8px] text-purple-400 font-mono-crypto">Oldest order first</span></div></div>

        <div className="border-t border-purple-500/20 pt-3"><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase">Your FIFO Position</h3><span className="text-[9px] text-fuchsia-300 font-mono-crypto">{userFifoPosition > 0 ? `Queue #${userFifoPosition}` : totalTokens > 0 ? 'Position pending sync' : 'Not queued'}</span></div><div className="p-2 rounded-xl bg-[#0b0518] border border-fuchsia-500/30 mb-2 flex items-center justify-between"><div><span className="text-[8px] text-purple-300/80 uppercase block font-rajdhani">Your Queued Tokens</span><span className="text-lg font-black font-mono-crypto text-slate-100">{userQueuedTokens.toLocaleString()} NXBC</span></div><span className="text-[9px] text-emerald-300 font-mono-crypto">{unallocatedTokens.toLocaleString()} unallocated</span></div><div className="space-y-1.5">{personalRows.map((phase) => <div key={phase.label} className="flex items-center justify-between rounded-lg bg-[#0b0518] border border-purple-500/20 px-2 py-1.5"><div><span className="text-[10px] text-purple-200 font-mono-crypto block">{phase.label}</span><span className="text-[8px] text-purple-400 font-mono-crypto">{phase.position > 0 ? `Queue #${phase.position}` : 'No active order'}</span></div><span className="text-[10px] text-amber-300 font-mono-crypto">{phase.tokens.toLocaleString()} NXBC @ ${phase.rate.toLocaleString()}</span></div>)}</div></div>

        <div className="border-t border-purple-500/20 pt-3"><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-black text-slate-100 font-rajdhani uppercase">Global Phase-wise Sale Queue</h3><span className="text-[8px] text-purple-300/70 font-mono-crypto">Historical/API data</span></div>{globalPhaseRows.length > 0 ? <div className="space-y-1.5">{globalPhaseRows.map((phase) => <div key={phase.label} className="flex items-center justify-between rounded-lg bg-[#0b0518] border border-amber-500/20 px-2 py-2"><div><span className="text-[10px] text-purple-200 font-mono-crypto block">{phase.label}</span><span className="text-[8px] text-purple-400 font-mono-crypto">{phase.orders.toLocaleString()} orders</span></div><span className="text-[10px] text-amber-300 font-mono-crypto">{phase.tokens.toLocaleString()} NXBC</span></div>)}</div> : <div className="rounded-lg bg-[#0b0518] border border-purple-500/20 px-2 py-2 text-[9px] text-purple-300/80 font-mono-crypto">{fifoLoading ? 'Loading global phase history…' : 'Phase-wise historical totals are not included by the FIFO API yet.'}</div>}</div>

        <div className="p-2 rounded-xl bg-fuchsia-900/20 border border-fuchsia-500/30 flex items-start gap-2"><RefreshCw className="w-4 h-4 text-fuchsia-400 shrink-0" /><p className="text-[10px] text-fuchsia-200/90 leading-tight">Global FIFO data refreshes automatically every 15 seconds. Orders are shown in chronological execution order.</p></div><div className="flex items-center gap-1.5 text-[9px] text-purple-300/80 font-mono-crypto"><ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Queue data is read from the server FIFO endpoint.</div>
      </section>
    </div>
  );
};