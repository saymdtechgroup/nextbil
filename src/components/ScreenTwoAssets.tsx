import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Wallet,
  DollarSign,
  ArrowRight,
  Info
} from 'lucide-react';
import { AllocationState, UserEarnings, PhaseConfig, QueueEntry } from '../types/crypto';

export interface ScreenTwoAssetsProps {
  initialTab?: string;
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

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  userEarnings,
  allocation,
  phases = [],
  sellQueue = [],
  onOpenBuyModal,
  walletAddress,
}) => {
  const [showValues, setShowValues] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState<number | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  useEffect(() => {
    if (!walletAddress) { setLiveOrders([]); return; }
    let cancelled=false;
    const load=async()=>{try{const r=await fetch(`/api/presale/sale-orders/${encodeURIComponent(walletAddress)}`);const d=await r.json();if(!cancelled&&r.ok)setLiveOrders(Array.isArray(d.orders)?d.orders:[]);}catch{}};
    load(); const t=window.setInterval(load,5000); return()=>{cancelled=true;window.clearInterval(t);};
  },[walletAddress]);
  const createDirectInvite=async(orderId:number)=>{
    if(!walletAddress)return; setInviteLoading(orderId); setInviteUrl('');
    try{const r=await fetch('/api/presale/direct-buyer/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({walletAddress,orderId})});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Unable to create buyer link');setInviteUrl(d.shareUrl);try{await navigator.clipboard.writeText(d.shareUrl);}catch{}}
    catch(e:any){window.alert(e?.message||'Unable to create buyer link.');}finally{setInviteLoading(null);}
  };

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

  // Token breakdown calculations for the connected user
  const p1Allocated = allocation.p1Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p1Percent || 10) / 100));
  const p1Sold = allocation.p1Tokens?.sold ?? 0;

  const p2Allocated = allocation.p2Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p2Percent || 20) / 100));
  const p2Sold = allocation.p2Tokens?.sold ?? 0;

  const p3Allocated = allocation.p3Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p3Percent || 30) / 100));
  const p3Sold = allocation.p3Tokens?.sold ?? 0;

  const p4Allocated = allocation.p4Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p4Percent || 20) / 100));
  const p4Sold = allocation.p4Tokens?.sold ?? 0;

  const p5Allocated = allocation.p5Tokens?.allocated ?? Math.floor(totalTokens * ((allocation.p5Percent || 15) / 100));
  const p5Sold = allocation.p5Tokens?.sold ?? 0;

  const dexAllocated = allocation.dexTokens?.allocated ?? Math.floor(totalTokens * ((allocation.dexPercent || 5) / 100));

  // User's total sold tokens across all phases
  const totalSoldTokens = p1Sold + p2Sold + p3Sold + p4Sold + p5Sold;
  const remainingTokens = Math.max(0, totalTokens - totalSoldTokens);
  const overallProgress = totalTokens > 0 ? Math.min(100, (totalSoldTokens / totalTokens) * 100) : 0;

  // Expected Total Return on 100% Token Sale for FIFO phases (Phase 2 to 5)
  const p2Expected = p2Allocated * (rateMap[2] ?? 0.15);
  const p3Expected = p3Allocated * (rateMap[3] ?? 0.20);
  const p4Expected = p4Allocated * (rateMap[4] ?? 0.25);
  const p5Expected = p5Allocated * (rateMap[5] ?? 0.30);
  const totalExpectedFifoIncome = p2Expected + p3Expected + p4Expected + p5Expected;

  // Realized income already received
  const p2Realized = p2Sold * (rateMap[2] ?? 0.15);
  const p3Realized = p3Sold * (rateMap[3] ?? 0.20);
  const p4Realized = p4Sold * (rateMap[4] ?? 0.25);
  const p5Realized = p5Sold * (rateMap[5] ?? 0.30);
  const totalRealizedUsdt = p2Realized + p3Realized + p4Realized + p5Realized;

  // Pending expected income remaining to receive
  const remainingExpectedUsdt = Math.max(0, totalExpectedFifoIncome - totalRealizedUsdt);

  // Effective Queue (Live DB queue or benchmark queue)
  const effectiveQueue = useMemo(() => sellQueue || [], [sellQueue]);

  // Find user's exact active FIFO queue entries and queue position
  const myQueueEntries = useMemo(() => {
    const normalizedUser = (walletAddress || '').toLowerCase();
    return effectiveQueue.map((entry, index) => ({
      ...entry,
      globalPosition: index + 1,
    })).filter((entry) => {
      if (!normalizedUser) return false;
      return entry.userId.toLowerCase() === normalizedUser || entry.userId.toLowerCase().includes(normalizedUser.slice(0, 6));
    });
  }, [effectiveQueue, walletAddress]);

  // Primary active FIFO order for this user
  const primaryEntry = myQueueEntries[0];
  const userFifoNumber = primaryEntry?.globalPosition ?? 0;
  const ordersAhead = Math.max(0, userFifoNumber - 1);

  const displayWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const copyWallet = () => {
    if (walletAddress) {
      void navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="nxbc-screen flex-1 min-w-0 p-3 sm:p-4 max-w-4xl mx-auto w-full">
      {liveOrders.filter(o=>[2,3,4,5].includes(Number(o.phaseNumber))&&['open','partially_filled'].includes(String(o.status))&&Number(o.remainingTokens)>0).length>0&&(<div className="mb-4 rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-[#0c241d] via-[#101c24] to-[#0a1118] shadow-xl p-4 sm:p-5"><div className="flex items-center justify-between gap-3 mb-3"><div><div className="text-sm font-black uppercase tracking-wider text-emerald-300 font-rajdhani">Direct Buyer Match</div><div className="text-[10px] text-emerald-100/70 font-mono-crypto mt-1">Bring a real buyer in your phase. Their 20% buyer-share is routed to your order before normal FIFO.</div></div><span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-[9px] text-emerald-300 font-bold">PRIORITY</span></div><div className="space-y-2">{liveOrders.filter(o=>[2,3,4,5].includes(Number(o.phaseNumber))&&['open','partially_filled'].includes(String(o.status))&&Number(o.remainingTokens)>0).slice(0,5).map(o=><div key={o.id} className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="text-xs"><div className="font-bold text-slate-100">Phase {o.phaseNumber} · Order #{o.id}</div><div className="text-[10px] text-slate-400 mt-1">Remaining: <strong className="text-emerald-300">{Number(o.remainingTokens).toLocaleString()} NXBC</strong> · Rate: ${Number(o.tokenPrice).toFixed(4)}</div></div><button type="button" disabled={inviteLoading===o.id} onClick={()=>createDirectInvite(Number(o.id))} className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50">{inviteLoading===o.id?'Creating…':'Create Buyer Link'}</button></div>)}</div>{inviteUrl&&<div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-[10px] text-amber-100 break-all"><strong>Buyer Link (copied):</strong> {inviteUrl}</div>}</div>)}

      {/* SINGLE UNIFIED MASTER BOX */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1b0a33] via-[#120724] to-[#0a0316] shadow-2xl p-4 sm:p-6 space-y-5 relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Bar: Wallet & Identity */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-fuchsia-600/20 border border-amber-400/40 p-2.5 text-amber-300 shadow-md">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-100 font-rajdhani">
                  My Personal FIFO Vault
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono-crypto flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Live Contract
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-purple-300/80 font-mono-crypto">
                  Wallet: <button onClick={copyWallet} className="text-amber-300 font-bold hover:underline">{displayWallet}</button>
                </span>
                {copied && <span className="text-[9px] text-emerald-400 font-mono-crypto">Copied!</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowValues((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/60 px-3 py-1.5 text-xs text-purple-300 hover:text-amber-300 transition-colors shadow-sm"
              title="Toggle numbers visibility"
            >
              {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-mono-crypto">{showValues ? 'Hide' : 'Show'}</span>
            </button>

            {onOpenBuyModal && (
              <button
                onClick={onOpenBuyModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-rajdhani uppercase text-xs tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Add Tokens</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. CORE HERO: LIVE FIFO QUEUE TICKET & QUEUE POSITION TRACKER */}
        <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-[#2a124a] via-[#1a0c30] to-[#120722] p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 font-mono-crypto flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Your Live FIFO Queue Ticket
              </span>
              
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                <span className="text-3xl sm:text-4xl font-black font-mono-crypto text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                  Ticket #{userFifoNumber}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono-crypto border shadow-sm ${
                  ordersAhead === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-blue-500/20 text-blue-300 border-blue-400/50'
                }`}>
                  {ordersAhead === 0 ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      <span>Next in Line to Settle</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-blue-300" />
                      <span>Position #{userFifoNumber} in Line</span>
                    </>
                  )}
                </span>
              </div>

              {/* Exact queue distance explanation */}
              <div className="pt-0.5">
                {ordersAhead === 0 ? (
                  <p className="text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You are #1 at the front of the queue. Next incoming buyer volume will settle your tokens!</span>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-semibold text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>There {ordersAhead === 1 ? 'is' : 'are'} <strong>{ordersAhead} order{ordersAhead > 1 ? 's' : ''}</strong> ahead of you. Next to settle once cleared!</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Visual Step-by-Step Queue Turn Tracker */}
          <div className="mt-4 pt-3.5 border-t border-purple-500/25 grid grid-cols-3 gap-2 text-center font-mono-crypto">
            {/* Box 1: Queue Position */}
            <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              ordersAhead === 0
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-sm'
                : 'bg-purple-950/40 border-purple-500/20 text-purple-300/80'
            }`}>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold opacity-75">
                Queue Position
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-100">
                Ticket #{userFifoNumber}
              </span>
              <span className={`text-[10px] font-bold ${ordersAhead === 0 ? 'text-emerald-300' : 'text-purple-300/70'}`}>
                {ordersAhead === 0 ? '⭐ You are #1' : 'Waiting Turn'}
              </span>
            </div>

            {/* Box 2: Orders Ahead */}
            <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              ordersAhead > 0
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
            }`}>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold opacity-75">
                Orders Ahead
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-100">
                {ordersAhead} {ordersAhead === 1 ? 'Order' : 'Orders'}
              </span>
              <span className={`text-[10px] font-bold ${ordersAhead === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {ordersAhead === 0 ? 'First to Settle' : 'In Front of You'}
              </span>
            </div>

            {/* Box 3: Next Settlement */}
            <div className="p-2.5 sm:p-3 rounded-xl border bg-purple-950/40 border-purple-500/20 text-purple-200 flex flex-col items-center justify-center gap-1">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold opacity-75 text-purple-300">
                Next Settlement
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-300">
                Phase 2 @ $0.15
              </span>
              <span className="text-[10px] font-bold text-purple-300/70">
                Auto-Sell Settlement Pool
              </span>
            </div>
          </div>
        </div>

        {/* 3. EXPECTED TOTAL AMOUNT ON 100% SALE */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#0d261e] via-[#091f19] to-[#071713] p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 font-mono-crypto flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Total Expected Income on 100% Token Sale
              </span>
              
              <div className="mt-1">
                <span className="text-3xl sm:text-4xl font-black font-mono-crypto text-emerald-300 tracking-tight">
                  {showValues ? `$${totalExpectedFifoIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '•••••••• USDT'}
                </span>
              </div>
              
              <p className="text-[11px] text-emerald-200/80 font-mono-crypto mt-1">
                Total projected USDT returns once all your Phase 2 to Phase 5 auto-sell allocations are 100% fulfilled in the FIFO queue.
              </p>
            </div>

            {/* Already Realized vs Pending */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <div className="bg-[#051410] px-3.5 py-2 rounded-xl border border-emerald-500/30 text-left">
                <span className="text-[9px] uppercase text-emerald-300/80 block font-mono-crypto">Already Received</span>
                <span className="text-sm font-black text-emerald-400 font-mono-crypto">
                  {showValues ? `$${totalRealizedUsdt.toFixed(2)} USDT` : '•••'}
                </span>
              </div>

              <div className="bg-[#051410] px-3.5 py-2 rounded-xl border border-amber-500/30 text-left">
                <span className="text-[9px] uppercase text-amber-300/80 block font-mono-crypto">Pending to Receive</span>
                <span className="text-sm font-black text-amber-300 font-mono-crypto">
                  {showValues ? `$${remainingExpectedUsdt.toFixed(2)} USDT` : '•••'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress to 100% Liquidation */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono-crypto text-emerald-300/80">
              <span>Overall FIFO Payout Progress</span>
              <span className="text-emerald-400 font-bold">
                {totalExpectedFifoIncome > 0 ? ((totalRealizedUsdt / totalExpectedFifoIncome) * 100).toFixed(1) : 0}% Received
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#051410] overflow-hidden border border-emerald-500/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${totalExpectedFifoIncome > 0 ? (totalRealizedUsdt / totalExpectedFifoIncome) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. PHASE-BY-PHASE CLEAR EARNINGS BREAKDOWN (Inside same box - No extra confusing boxes) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200 font-rajdhani">
              Phase-wise Auto-Sell Allocation Breakdown
            </span>
            <span className="text-[10px] text-purple-400 font-mono-crypto">
              Purchased: {showValues ? `${totalTokens.toLocaleString()} NXBC` : '••••'}
            </span>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-[#0f0520] divide-y divide-purple-500/15 overflow-hidden">
            {/* Phase 2 */}
            <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 font-mono-crypto font-bold text-xs flex items-center justify-center border border-blue-500/30">
                  P2
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-100 font-rajdhani flex items-center gap-2">
                    <span>Phase 2 Auto-Sell</span>
                    <span className="text-[10px] text-amber-300 font-mono-crypto font-bold">@ $0.15 Rate</span>
                  </div>
                  <div className="text-[10px] text-purple-300/70 font-mono-crypto">
                    Tokens: {showValues ? `${p2Allocated.toLocaleString()} NXBC` : '••••'} &bull; Sold: {showValues ? `${p2Sold.toLocaleString()}` : '•••'} ({p2Allocated > 0 ? ((p2Sold / p2Allocated) * 100).toFixed(0) : 0}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono-crypto block">
                    {showValues ? `$${p2Expected.toFixed(2)} USDT` : '•••'}
                  </span>
                  <span className="text-[9px] text-emerald-300/70 font-mono-crypto">
                    Earned: ${showValues ? p2Realized.toFixed(2) : '•••'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono-crypto border shrink-0 ${
                  p2Sold >= p2Allocated && p2Allocated > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                }`}>
                  {p2Sold >= p2Allocated && p2Allocated > 0 ? '✓ 100% Settled' : 'Active in FIFO'}
                </span>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono-crypto font-bold text-xs flex items-center justify-center border border-purple-500/30">
                  P3
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-100 font-rajdhani flex items-center gap-2">
                    <span>Phase 3 Auto-Sell</span>
                    <span className="text-[10px] text-amber-300 font-mono-crypto font-bold">@ $0.20 Rate</span>
                  </div>
                  <div className="text-[10px] text-purple-300/70 font-mono-crypto">
                    Tokens: {showValues ? `${p3Allocated.toLocaleString()} NXBC` : '••••'} &bull; Queued for settlement
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono-crypto block">
                    {showValues ? `$${p3Expected.toFixed(2)} USDT` : '•••'}
                  </span>
                  <span className="text-[9px] text-purple-300/60 font-mono-crypto">Expected Return</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono-crypto bg-purple-500/20 text-purple-300 border border-purple-400/40 shrink-0">
                  Queued (Phase 3)
                </span>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono-crypto font-bold text-xs flex items-center justify-center border border-purple-500/30">
                  P4
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-100 font-rajdhani flex items-center gap-2">
                    <span>Phase 4 Auto-Sell</span>
                    <span className="text-[10px] text-amber-300 font-mono-crypto font-bold">@ $0.25 Rate</span>
                  </div>
                  <div className="text-[10px] text-purple-300/70 font-mono-crypto">
                    Tokens: {showValues ? `${p4Allocated.toLocaleString()} NXBC` : '••••'} &bull; Queued for settlement
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono-crypto block">
                    {showValues ? `$${p4Expected.toFixed(2)} USDT` : '•••'}
                  </span>
                  <span className="text-[9px] text-purple-300/60 font-mono-crypto">Expected Return</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono-crypto bg-purple-500/20 text-purple-300 border border-purple-400/40 shrink-0">
                  Queued (Phase 4)
                </span>
              </div>
            </div>

            {/* Phase 5 */}
            <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono-crypto font-bold text-xs flex items-center justify-center border border-purple-500/30">
                  P5
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-100 font-rajdhani flex items-center gap-2">
                    <span>Phase 5 Auto-Sell</span>
                    <span className="text-[10px] text-amber-300 font-mono-crypto font-bold">@ $0.30 Rate</span>
                  </div>
                  <div className="text-[10px] text-purple-300/70 font-mono-crypto">
                    Tokens: {showValues ? `${p5Allocated.toLocaleString()} NXBC` : '••••'} &bull; Queued for settlement
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono-crypto block">
                    {showValues ? `$${p5Expected.toFixed(2)} USDT` : '•••'}
                  </span>
                  <span className="text-[9px] text-purple-300/60 font-mono-crypto">Expected Return</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono-crypto bg-purple-500/20 text-purple-300 border border-purple-400/40 shrink-0">
                  Queued (Phase 5)
                </span>
              </div>
            </div>

            {/* Phase 1 Hold & Phase 6 DEX Summary */}
            <div className="p-3 sm:p-3.5 bg-purple-950/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-crypto text-purple-300/80">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Phase 1 Hold: <strong>{showValues ? `${p1Allocated.toLocaleString()} NXBC` : '••••'}</strong> in Private Wallet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Phase 6 DEX: <strong>{showValues ? `${dexAllocated.toLocaleString()} NXBC` : '••••'}</strong> Locked for $1,500+ Launch
              </span>
            </div>
          </div>
        </div>

        {/* 5. Total Expected Return on 100% Token Sale Footer */}
        <div className="pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-crypto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300/80 block uppercase tracking-wider font-bold">
                Total Payout on 100% Token Sale
              </span>
              <strong className="text-sm sm:text-base font-black text-emerald-400 font-mono-crypto">
                ${showValues ? totalExpectedFifoIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '••••••••'} USDT
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300/70 font-mono-crypto">
              USDT automatically credited directly to your connected wallet as phases settle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
