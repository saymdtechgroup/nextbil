import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Users,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  ChevronRight,
  Eye,
  EyeOff,
  Percent,
  Clock,
  Rocket,
  Sparkles,
  Calculator,
  Zap,
  RefreshCw,
  Activity,
  CheckCircle2,
  Flame,
  Trophy,
  Copy,
} from 'lucide-react';
import { AllocationState, PhaseConfig, QueueEntry, UserEarnings } from '../types/crypto';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  phases?: PhaseConfig[];
  sellQueue?: QueueEntry[];
  onUpdateSellQueue?: (queue: QueueEntry[]) => void;
  onSimulateExternalBuy?: (amount?: number) => void;
  onOpenBuyModal?: () => void;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
  walletAddress?: string | null;
  walletConnected?: boolean;
  sellQueueSharePercent?: number;
}

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({
  allocation,
  onOpenBuyModal,
  onOpenTeamPlanModal,
  onOpenMatrixModal,
  levelIncomeUsd,
  matrixIncomeUsd,
  walletAddress,
  sellQueueSharePercent = 20,
}) => {
  const [showValues, setShowValues] = useState<boolean>(true);
  const [simTarget, setSimTarget] = useState<'p2' | 'p3' | 'p4' | 'p5' | 'live'>('p3');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveSellerShare, setLiveSellerShare] = useState<number>(sellQueueSharePercent ?? 20);
  const [teamStats, setTeamStats] = useState<{ directCount: number; totalTeamCount: number }>({
    directCount: 0,
    totalTeamCount: 0,
  });
  const [specialOffer, setSpecialOffer] = useState<{
    id?: string;
    active: boolean;
    title: string;
    subtitle: string;
    targetDirectVolume: number;
    rewardUsdt: number;
    badgeText: string;
  }>({
    id: "offer_daily_500",
    active: true,
    title: "🔥 DAILY DIRECT SALE CHALLENGE",
    subtitle: "Achieve $500 in Direct Sales & Claim $50 Instant USDT Cash Bonus!",
    targetDirectVolume: 500,
    rewardUsdt: 50,
    badgeText: "LIMITED TIME ADMIN OFFER",
  });
  const [userDirectVol, setUserDirectVol] = useState<number>(0);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Always fetch active special offer challenge on mount regardless of wallet connection
  useEffect(() => {
    const loadOffer = async () => {
      try {
        const res = await fetch('/api/public/special-offer', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.offer) {
            setSpecialOffer(data.offer);
          }
        }
      } catch (e) {
        console.warn('Failed to load special offer on mount:', e);
      }
    };
    loadOffer();
  }, []);
  const [dbAllocation, setDbAllocation] = useState<{
    totalPurchasedTokens: number;
    liveHoldTokens: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
  }>({
    totalPurchasedTokens: 0,
    liveHoldTokens: 0,
    p2: 0,
    p3: 0,
    p4: 0,
    p5: 0,
  });
  const [saleOrders, setSaleOrders] = useState<Array<{
    id: number; phaseNumber: number; amountTokens: number; soldTokens: number;
    remainingTokens: number; tokenPrice: number; expectedUsdt: number;
    realizedUsdt: number; remainingUsdt: number; status: string; fifoNumber?: number; currentRunningFifoNumber?: number | null; positionsAhead?: number; createdAt?: string;
  }>>([]);
  const [globalFifo, setGlobalFifo] = useState<Array<{
    phaseNumber: number; totalOrders: number; totalQueuedTokens: number;
    orders: Array<{ id: number; userId: number; walletAddress: string; amountTokens: number;
      remainingTokens: number; tokenPrice: number; status: string; position: number;
      aheadTokens: number; expectedRemainingUsdt: number; createdAt?: string; }>;
  }>>([]);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [inviteByOrder, setInviteByOrder] = useState<Record<number, { url: string; expiresAt: string }>>({});
  const [inviteLoading, setInviteLoading] = useState<number | null>(null);

  const generateDirectBuyerLink = async (orderId: number) => {
    if (!walletAddress) return;
    setInviteLoading(orderId);
    try {
      const r = await fetch('/api/presale/direct-buyer/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, orderId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) throw new Error(data.error || 'Could not create Direct Buyer Link.');
      setInviteByOrder(prev => ({ ...prev, [orderId]: { url: data.shareUrl, expiresAt: data.expiresAt } }));
      await navigator.clipboard?.writeText(data.shareUrl);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || 'Could not create Direct Buyer Link.');
    } finally { setInviteLoading(null); }
  };

  const fetchOrders = async () => {
    if (!walletAddress) { 
      setSaleOrders([]);
      setTeamStats({ directCount: 0, totalTeamCount: 0 });
      return; 
    }
    try {
      // 1. Fetch sale orders
      const r = await fetch(`/api/presale/sale-orders/${walletAddress}`, { cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) setSaleOrders(Array.isArray(data.orders) ? data.orders : []);

      // 2. Fetch live team stats & direct volume
      try {
        const teamRes = await fetch(`/api/team/${walletAddress}`, { cache: 'no-store' });
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          const directs = Number(teamData.totalDirectMembers ?? teamData.leader?.directCount ?? (Array.isArray(teamData.directMembers) ? teamData.directMembers.length : 0));
          let totalTeam = Number(teamData.totalUnilevelMembers ?? teamData.leader?.totalTeamCount ?? 0);
          if (totalTeam === 0 && teamData.unilevelCounts) {
            totalTeam = Object.values(teamData.unilevelCounts).reduce<number>((a, b) => a + Number(b || 0), 0);
          }
          if (totalTeam === 0 && directs > 0) totalTeam = directs;
          setTeamStats({ directCount: directs, totalTeamCount: totalTeam });
          setUserDirectVol(Number(teamData.leader?.totalDirectVolume || 0));
        }
      } catch (err) {
        console.warn('Failed to fetch team count for assets:', err);
      }

      // Fetch active special offer challenge
      try {
        const offerRes = await fetch('/api/public/special-offer', { cache: 'no-store' });
        if (offerRes.ok) {
          const offerData = await offerRes.json();
          if (offerData.success && offerData.offer) {
            setSpecialOffer(offerData.offer);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch special offer:', err);
      }

      // 3. Fetch user allocation & purchased tokens from DB
      try {
        const allocRes = await fetch(`/api/presale/allocation/${walletAddress}`, { cache: 'no-store' });
        if (allocRes.ok) {
          const allocData = await allocRes.json();
          if (allocData.success) {
            setDbAllocation({
              totalPurchasedTokens: Number(allocData.totalPurchasedTokens || 0),
              liveHoldTokens: Number(allocData.liveHoldTokens || allocData.allocations?.[6]?.allocated || 0),
              p2: Number(allocData.allocations?.[2]?.allocated || 0),
              p3: Number(allocData.allocations?.[3]?.allocated || 0),
              p4: Number(allocData.allocations?.[4]?.allocated || 0),
              p5: Number(allocData.allocations?.[5]?.allocated || 0),
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch allocation from DB:', err);
      }
    } catch (e) {
      console.error('Failed to load personal phase sale orders:', e);
    }
  };

  const fetchGlobalFifo = async () => {
    try {
      const r = await fetch('/api/presale/fifo-global', { cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) {
        setGlobalFifo(Array.isArray(data.phases) ? data.phases : []);
        if (typeof data.sellerSharePercent === 'number' && Number.isFinite(data.sellerSharePercent)) {
          setLiveSellerShare(data.sellerSharePercent);
        }
      }
    } catch (e) {
      console.error('Failed to load global FIFO queue:', e);
    } finally {
      setFifoLoading(false);
    }
  };

  useEffect(() => {
    if (typeof sellQueueSharePercent === 'number' && Number.isFinite(sellQueueSharePercent)) {
      setLiveSellerShare(sellQueueSharePercent);
    }
  }, [sellQueueSharePercent]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, [walletAddress]);

  useEffect(() => {
    fetchGlobalFifo();
    const timer = setInterval(fetchGlobalFifo, 5000);
    const onRefresh = () => { fetchGlobalFifo(); fetchOrders(); };
    window.addEventListener('nxbc:refresh-presale', onRefresh);
    window.addEventListener('nxbc:refresh-sale-orders', onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('nxbc:refresh-presale', onRefresh);
      window.removeEventListener('nxbc:refresh-sale-orders', onRefresh);
    };
  }, [walletAddress]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(), fetchGlobalFifo()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // 1. Calculate orders per phase from personal saleOrders
  const ordersP2 = saleOrders.filter((o) => Number(o.phaseNumber) === 2).reduce((s, o) => s + Number(o.amountTokens || 0), 0);
  const ordersP3 = saleOrders.filter((o) => Number(o.phaseNumber) === 3).reduce((s, o) => s + Number(o.amountTokens || 0), 0);
  const ordersP4 = saleOrders.filter((o) => Number(o.phaseNumber) === 4).reduce((s, o) => s + Number(o.amountTokens || 0), 0);
  const ordersP5 = saleOrders.filter((o) => Number(o.phaseNumber) === 5).reduce((s, o) => s + Number(o.amountTokens || 0), 0);
  const ordersTotalTokens = ordersP2 + ordersP3 + ordersP4 + ordersP5;

  // 2. Compute authoritative total token amount
  const propTotalTokens = Math.max(0, Number(allocation?.totalTokensPurchased || 0));
  const dbTotalTokens = Math.max(0, Number(dbAllocation?.totalPurchasedTokens || 0));
  const totalTokens = Math.max(propTotalTokens, dbTotalTokens, ordersTotalTokens);

  // 3. Compute per-phase token quantities realistically:
  // If user has created sale orders, use their exact orders (no ghost allocation in unchosen phases).
  // If user has not created any orders yet, show their pre-sale distribution percentages.
  const hasOrders = ordersTotalTokens > 0;

  const p2Tokens = hasOrders
    ? ordersP2
    : (dbAllocation.p2 > 0 
      ? dbAllocation.p2 
      : Number(allocation?.p2Tokens?.allocated ?? Math.round(totalTokens * ((allocation?.p2Percent || 20) / 100))));

  const p3Tokens = hasOrders
    ? ordersP3
    : (dbAllocation.p3 > 0 
      ? dbAllocation.p3 
      : Number(allocation?.p3Tokens?.allocated ?? Math.round(totalTokens * ((allocation?.p3Percent || 30) / 100))));

  const p4Tokens = hasOrders
    ? ordersP4
    : (dbAllocation.p4 > 0 
      ? dbAllocation.p4 
      : Number(allocation?.p4Tokens?.allocated ?? Math.round(totalTokens * ((allocation?.p4Percent || 20) / 100))));

  const p5Tokens = hasOrders
    ? ordersP5
    : (dbAllocation.p5 > 0 
      ? dbAllocation.p5 
      : Number(allocation?.p5Tokens?.allocated ?? Math.round(totalTokens * ((allocation?.p5Percent || 15) / 100))));

  const liveTokens = dbAllocation.liveHoldTokens > 0
    ? dbAllocation.liveHoldTokens
    : (hasOrders
      ? Math.max(0, totalTokens - ordersTotalTokens)
      : Number(allocation?.liveTokens ?? Math.round(totalTokens * ((allocation?.dexPercent || 15) / 100))));

  // 4. Accurate Phase & DEX Projected Valuations ($1,500.00 Target DEX Price)
  const DEX_TARGET_PRICE = 1500.00;
  const p2Val = p2Tokens * 0.10;
  const p3Val = p3Tokens * 1.00;
  const p4Val = p4Tokens * 10.00;
  const p5Val = p5Tokens * 100.00;
  const liveVal = liveTokens * DEX_TARGET_PRICE;

  const totalAllocatedUsd = p2Val + p3Val + p4Val + p5Val + liveVal;
  const initialCostUsd = totalTokens * 0.01;
  const projectedReturnUsd = totalAllocatedUsd;

  // Simulator rates & projected holding value
  const simRates: Record<string, { rate: number; label: string; multiplier: string }> = {
    p2: { rate: 0.10, label: 'Phase 2 ($0.10)', multiplier: '10x' },
    p3: { rate: 1.00, label: 'Phase 3 ($1.00)', multiplier: '100x' },
    p4: { rate: 10.00, label: 'Phase 4 ($10.00)', multiplier: '1,000x' },
    p5: { rate: 100.00, label: 'Phase 5 ($100.00)', multiplier: '10,000x' },
    live: { rate: 1500.00, label: 'DEX / LIVE ($1,500.00)', multiplier: '150,000x' },
  };

  const simCurrent = simRates[simTarget] || simRates.p3;
  const simValuation = totalTokens * simCurrent.rate;
  const simGain = Math.max(0, simValuation - initialCostUsd);
  const simRoiPercent = initialCostUsd > 0 ? ((simValuation - initialCostUsd) / initialCostUsd) * 100 : 0;

  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2.5 pb-2">
      {/* 1. ASSET PORTFOLIO COMMAND CENTER HEADER */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#120b19_100%)] shadow-[0_0_28px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-[14px] bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
                <PieChart className="w-5.5 h-5.5 text-amber-300" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">
                    Asset Portfolio
                  </h1>
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-0.5 truncate">
                  Decentralized Vector Roadmap & Live FIFO Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleManualRefresh}
                className={`p-1.5 sm:p-2 rounded-xl border border-white/10 bg-[#050b16]/80 text-slate-300 hover:text-amber-300 hover:border-amber-400/40 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Real-time Queue"
                aria-label="Refresh asset data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowValues(!showValues)}
                className="p-1.5 sm:p-2 rounded-xl border border-amber-400/25 bg-[#050b16]/80 text-amber-300 hover:border-amber-400/60 hover:text-amber-200 transition-all"
                title="Toggle Values Visibility"
                aria-label="Toggle portfolio visibility"
              >
                {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
              </button>

              <div className="px-2.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-[15px] border border-white/10 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-slate-300">Total Holdings</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-white">
                {showValues ? `${totalTokens.toLocaleString()}` : '••••'}
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">NXBC</div>
            </div>

            <div className="min-w-0 rounded-[15px] border border-amber-400/20 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-amber-300/90">Asset Buckets</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-amber-300">
                05 VECTORS
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">Buckets</div>
            </div>

            <div className="min-w-0 rounded-[15px] border border-cyan-400/20 bg-[#050b16]/65 px-1.5 py-2 sm:px-2.5 sm:py-2.5 text-center flex flex-col justify-center">
              <div className="text-[7px] sm:text-[8px] font-rajdhani uppercase tracking-wider text-cyan-300/90">Target Cap</div>
              <div className="mt-0.5 text-sm sm:text-base leading-none font-black font-mono-crypto text-cyan-300">
                $1,500+
              </div>
              <div className="text-[8px] sm:text-[9px] font-rajdhani text-slate-300 mt-0.5">DEX / LIVE</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONNECTED WALLET BALANCE & INSTANT ACTIONS */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className="w-4 h-4 text-amber-300" />
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-rajdhani uppercase tracking-wider">
                  Connected Wallet Balance (NXBC)
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[30px] sm:text-[38px] leading-none font-black font-mono-crypto text-white">
                  {showValues ? totalTokens.toLocaleString() : '••••••••'}
                </span>
                <span className="text-sm sm:text-base font-rajdhani text-amber-300 font-bold">NXBC</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[9px] sm:text-[10px] text-emerald-300 font-mono-crypto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <span>100% held safely in your Trust Wallet</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <GoldCoinGraphic size="sm" glow={true} animated={false} />
              {onOpenBuyModal && (
                <button
                  type="button"
                  onClick={onOpenBuyModal}
                  className="mt-2 px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-[10px] uppercase font-rajdhani tracking-wider transition-all shadow-[0_0_12px_rgba(251,191,36,0.2)] flex items-center gap-1"
                >
                  <Rocket className="w-3.5 h-3.5" fill="currentColor" /> BUY
                </button>
              )}
            </div>
          </div>

          {/* UNIQUE FEATURE 1: CYBER ALLOCATION DISTRIBUTION BAR */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-rajdhani uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                Vector Portfolio Distribution Strip
              </span>
              <span className="font-mono-crypto text-amber-300">100% Allocated</span>
            </div>

            <div className="h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden flex p-[1px]">
              <div style={{ width: `${allocation.p2Percent ?? 20}%` }} title={`Phase 2: ${allocation.p2Percent ?? 20}%`} className="h-full bg-amber-400 transition-all" />
              <div style={{ width: `${allocation.p3Percent ?? 30}%` }} title={`Phase 3: ${allocation.p3Percent ?? 30}%`} className="h-full bg-yellow-300 transition-all" />
              <div style={{ width: `${allocation.p4Percent ?? 20}%` }} title={`Phase 4: ${allocation.p4Percent ?? 20}%`} className="h-full bg-cyan-400 transition-all" />
              <div style={{ width: `${allocation.p5Percent ?? 15}%` }} title={`Phase 5: ${allocation.p5Percent ?? 15}%`} className="h-full bg-purple-400 transition-all" />
              <div style={{ width: `${allocation.dexPercent ?? 15}%` }} title={`DEX / LIVE: ${allocation.dexPercent ?? 15}%`} className="h-full bg-emerald-400 transition-all" />
            </div>

            <div className="mt-1.5 grid grid-cols-5 gap-1 text-[7px] sm:text-[8px] font-mono-crypto text-center">
              <div className="text-amber-300">P2 {allocation.p2Percent ?? 20}%</div>
              <div className="text-yellow-300">P3 {allocation.p3Percent ?? 30}%</div>
              <div className="text-cyan-300">P4 {allocation.p4Percent ?? 20}%</div>
              <div className="text-purple-300">P5 {allocation.p5Percent ?? 15}%</div>
              <div className="text-emerald-300">DEX / LIVE {allocation.dexPercent ?? 15}%</div>
            </div>
          </div>

          {allocation.isLocked && (
            <div className="mt-2.5 pt-2.5 border-t border-amber-300/10 flex items-center justify-between text-[8px] sm:text-[9px] font-mono-crypto">
              <span className="text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>FIFO Queue Registered</span>
              </span>
              <span className="text-slate-300">{allocation.lockedTimestamp || 'Active'}</span>
            </div>
          )}
        </div>
      </section>

      {/* UNIQUE FEATURE 2: INTERACTIVE "WHAT-IF" ROI & GROWTH SIMULATOR */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/35 bg-[radial-gradient(circle_at_15%_25%,rgba(245,158,11,0.09),transparent_35%),linear-gradient(135deg,#071529_0%,#09111e_65%,#120c1a_100%)] shadow-[0_0_24px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-300/30 flex items-center justify-center text-amber-300">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300">
                  Growth & Holding Valuation Simulator
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  Simulate portfolio worth if held to future milestone targets
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-mono-crypto font-bold">
              {simCurrent.multiplier}
            </span>
          </div>

          {/* Simulator Target Selector Pills */}
          <div className="grid grid-cols-5 gap-1.5 p-1 rounded-[14px] bg-[#050b16]/80 border border-white/10 mb-3">
            {(['p2', 'p3', 'p4', 'p5', 'live'] as const).map((key) => {
              const active = simTarget === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSimTarget(key)}
                  className={`py-1.5 rounded-[10px] text-[8px] sm:text-[9px] font-rajdhani font-bold uppercase transition-all ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {key === 'live' ? 'DEX / LIVE' : key.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Simulator Results Display */}
          <div className="rounded-[16px] border border-amber-400/25 bg-[#050b16]/75 p-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-rajdhani uppercase tracking-wider">
                  Target Price
                </p>
                <div className="text-sm sm:text-base font-black font-mono-crypto text-amber-300">
                  {simCurrent.label}
                </div>
                <p className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto mt-0.5">
                  Multiplier: <span className="text-emerald-300 font-bold">{simCurrent.multiplier}</span>
                </p>
              </div>

              <div className="text-right border-l border-white/10 pl-2.5">
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-rajdhani uppercase tracking-wider">
                  Projected Portfolio Value
                </p>
                <div className="text-lg sm:text-xl font-black font-mono-crypto text-white">
                  {showValues ? `$${simValuation.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '••••••••'}
                </div>
                <p className="text-[7.5px] sm:text-[8px] text-emerald-300 font-mono-crypto mt-0.5">
                  +{simRoiPercent.toLocaleString(undefined, { maximumFractionDigits: 0 })}% ROI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PHASE SELL-THROUGH SCHEDULE WITH INTERACTIVE VECTOR INSPECTOR */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-300" />
              <div>
                <h2 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300">
                  Phase Sell-Through Schedule
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  Phase 2-5 FIFO + DEX reserve
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[8px] sm:text-[9px] font-mono-crypto font-bold">
              5 Asset Buckets
            </span>
          </div>

          {/* REAL PERSONAL FIFO REPORT — same card design, backend-driven values only */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {([
              { key: 'p2', phase: 2, label: 'P2 SELL', rate: 0.10, color: 'amber', tokens: p2Tokens },
              { key: 'p3', phase: 3, label: 'P3 SELL', rate: 1.00, color: 'amber', tokens: p3Tokens },
              { key: 'p4', phase: 4, label: 'P4 SELL', rate: 10.00, color: 'cyan', tokens: p4Tokens },
              { key: 'p5', phase: 5, label: 'P5 SELL', rate: 100.00, color: 'purple', tokens: p5Tokens },
            ] as const).map((item) => {
              const orders = saleOrders.filter((o) => Number(o.phaseNumber) === item.phase);
              const allocated = Math.max(0, Number(item.tokens || 0));
              const sold = Math.max(0, orders.reduce((sum, o) => sum + Number(o.soldTokens || 0), 0));
              const orderRemaining = Math.max(0, orders.reduce((sum, o) => sum + Number(o.remainingTokens || 0), 0));
              const remaining = orders.length > 0 ? orderRemaining : allocated;
              const realized = Math.max(0, orders.reduce((sum, o) => sum + Number(o.realizedUsdt || 0), 0));
              const pending = Math.max(0, remaining * item.rate);
              const fifoNumbers = orders
                .map((o) => Number(o.fifoNumber || 0))
                .filter((n) => n > 0)
                .sort((a, b) => a - b);
              const fifoText = fifoNumbers.length ? fifoNumbers.map((n) => `#${n}`).join(', ') : '0';
              const status = allocated <= 0
                ? 'NO ALLOCATION'
                : remaining <= 0 && sold > 0
                  ? 'SOLD'
                  : sold > 0
                    ? 'PARTIALLY SOLD'
                    : fifoNumbers.length
                      ? 'WAITING FIFO'
                      : 'WAITING FIFO';
              const border = item.color === 'cyan' ? 'border-cyan-400/30' : item.color === 'purple' ? 'border-purple-400/30' : 'border-amber-400/30';
              const text = item.color === 'cyan' ? 'text-cyan-300' : item.color === 'purple' ? 'text-purple-300' : 'text-amber-300';
              const badgeBg = item.color === 'cyan' ? 'bg-cyan-400/15 border-cyan-400/30' : item.color === 'purple' ? 'bg-purple-400/15 border-purple-400/30' : 'bg-amber-400/15 border-amber-400/30';
              const soldColor = status === 'SOLD' ? 'text-emerald-300' : status === 'PARTIALLY SOLD' ? 'text-amber-300' : 'text-slate-300';

              return (
                <div key={item.key} className={`rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 border ${border} shadow-[0_0_15px_rgba(6,182,212,0.04)]`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] sm:text-[11px] font-black ${text} font-rajdhani uppercase tracking-wider block`}>
                      {item.label}
                    </span>
                    <span className={`text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full ${badgeBg} ${text} font-bold`}>
                      FIFO {fifoText}
                    </span>
                  </div>

                  <div className="my-1 sm:my-1.5">
                    <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block">
                      {showValues ? `${allocated.toLocaleString()} NXBC` : '••••'}
                    </span>
                    <span className={`text-[8.5px] sm:text-[9.5px] font-mono-crypto ${text} font-semibold`}>
                      @ ${item.rate.toFixed(2)} Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-white/10 pt-1.5 mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto">
                    <span className="text-slate-400">Sold: <b className="text-white">{showValues ? sold.toLocaleString() : '••'}</b></span>
                    <span className="text-slate-400 text-right">Remain: <b className="text-white">{showValues ? remaining.toLocaleString() : '••'}</b></span>
                    <span className={`${soldColor} font-bold col-span-2`}>{status}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-1 mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto">
                    <span className="text-slate-400">Realized: <b className="text-emerald-300">${showValues ? realized.toFixed(2) : '••'}</b></span>
                    <span className="text-slate-400">Pending: <b className="text-amber-300">${showValues ? pending.toFixed(2) : '••'}</b></span>
                  </div>
                </div>
              );
            })}

            {/* DEX / LIVE — never part of FIFO */}
            <div className="rounded-[16px] bg-[#050b16]/80 text-left p-2.5 sm:p-3 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-300 font-rajdhani uppercase tracking-wider block">
                    DEX / LIVE
                  </span>
                  <span className="text-[7.5px] font-mono-crypto px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 font-bold border border-emerald-400/30">
                    NO FIFO
                  </span>
                </div>
                <div className="my-1 sm:my-1.5">
                  <span className="text-xs sm:text-sm font-black font-mono-crypto text-white block truncate">
                    {showValues ? `${liveTokens.toLocaleString()} NXBC` : '••••'}
                  </span>
                  <span className="text-[8.5px] sm:text-[9.5px] font-mono-crypto text-emerald-300 font-semibold block truncate">
                    @ $1,500.00 DEX Target Rate
                  </span>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-1 border-t border-white/10 pt-1.5 mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto">
                  <span className="text-slate-400">FIFO: <b className="text-emerald-300">—</b></span>
                  <span className="text-slate-400 text-right">Status: <b className="text-emerald-300">RESERVE</b></span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-1 mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto">
                  <span className="text-slate-400">Est. Target: <b className="text-emerald-300">${showValues ? liveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '••'}</b></span>
                  <span className="text-cyan-300 font-bold">DEX Launch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 🔥 DAILY DIRECT SALE CHALLENGE & OFFER WALL */}
      {specialOffer && specialOffer.active && (
        <section className="relative overflow-hidden rounded-[24px] border-2 border-amber-400/50 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.22),transparent_50%),linear-gradient(135deg,#091526_0%,#07101e_60%,#180e04_100%)] p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full bg-[#081220] rounded-[14px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-300 fill-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-950 font-rajdhani bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 rounded-full shadow-sm font-bold">
                    {specialOffer.badgeText || "DAILY DIRECT CHALLENGE"}
                  </span>
                  <span className="text-[8px] text-emerald-300 font-mono-crypto font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" /> AUTO-CREDIT ACTIVE
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black font-rajdhani uppercase tracking-wider text-white mt-1">
                  {specialOffer.title}
                </h2>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right bg-[#050b16]/70 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <span className="text-[8px] sm:text-[8.5px] text-slate-400 font-mono-crypto uppercase block">
                INSTANT CASH REWARD
              </span>
              <span className="text-base sm:text-lg font-black font-mono-crypto text-emerald-300 gold-gradient-text">
                +${specialOffer.rewardUsdt.toFixed(2)} USDT
              </span>
            </div>
          </div>

          <p className="text-[9px] sm:text-[10px] text-slate-300 font-mono-crypto my-3 leading-relaxed">
            {specialOffer.subtitle}
          </p>

          {/* Interactive Progress Box */}
          <div className="rounded-2xl bg-[#040813]/90 border border-amber-400/30 p-3 sm:p-3.5 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] font-mono-crypto">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Direct Sales Volume:</span>
              </span>
              <span className="text-amber-300 font-black text-xs">
                ${userDirectVol.toFixed(2)} / ${specialOffer.targetDirectVolume.toFixed(2)} USD
              </span>
            </div>

            {/* Glowing Custom Bar */}
            <div className="w-full h-3.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400 transition-all duration-700 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                style={{
                  width: `${Math.min(100, (userDirectVol / Math.max(1, specialOffer.targetDirectVolume)) * 100)}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[8.5px] sm:text-[9px] font-mono-crypto pt-0.5">
              <span className="text-slate-400">
                Target Progress: <strong className="text-white">{Math.min(100, Math.round((userDirectVol / Math.max(1, specialOffer.targetDirectVolume)) * 100))}%</strong>
              </span>

              {userDirectVol >= specialOffer.targetDirectVolume ? (
                <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-400/15 px-2.5 py-1 rounded-lg border border-emerald-400/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> TARGET ACHIEVED & $50 CREDITED TO WALLET!
                </span>
              ) : (
                <span className="text-amber-300 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30">
                  ⚡ Need ${(specialOffer.targetDirectVolume - userDirectVol).toFixed(2)} more sales to unlock $50 USDT!
                </span>
              )}
            </div>
          </div>

          {/* Quick Share Link Call-to-Action */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[8.5px] font-mono-crypto">
            <span className="text-slate-300">
              💡 Share your referral link with new buyers to achieve this target today!
            </span>
            <button
              type="button"
              onClick={() => {
                const link = walletAddress ? `${window.location.origin}/?ref=${walletAddress}` : window.location.href;
                navigator.clipboard?.writeText(link);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[9px] font-mono-crypto uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Copy className="w-3 h-3" />
              <span>{linkCopied ? "Link Copied!" : "Copy Referral Link"}</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. GLOBAL FIFO EXECUTION QUEUE & TELEMETRY HUD */}
      <section className="relative overflow-hidden rounded-[22px] border border-cyan-400/25 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.06),transparent_30%),linear-gradient(135deg,#071426_0%,#06101c_65%,#050b16_100%)] shadow-[0_0_24px_rgba(6,182,212,0.06)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-300" />
              <div>
                <h2 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-cyan-300">
                  Global FIFO Execution Queue
                </h2>
                <p className="text-[7.5px] sm:text-[8.5px] text-slate-300/80 font-mono-crypto">
                  Algorithmic auto-matching on BSC • {liveSellerShare}% buyer flow absorption
                </p>
              </div>
            </div>
            <div className="px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live • 5s Sync
            </div>
          </div>

          {/* FIFO Status Telemetry Badges */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-[12px] bg-[#050b16]/70 border border-white/10 p-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[7px] text-slate-400 uppercase font-rajdhani">Buyer Absorption</div>
                <div className="text-[9px] font-bold text-amber-300 font-mono-crypto">{liveSellerShare}% Immediate Pool</div>
              </div>
            </div>
            <div className="rounded-[12px] bg-[#050b16]/70 border border-white/10 p-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[7px] text-slate-400 uppercase font-rajdhani">Reserve Pool Match</div>
                <div className="text-[9px] font-bold text-emerald-300 font-mono-crypto">{Math.max(0, 100 - Number(liveSellerShare))}% Contract Pool</div>
              </div>
            </div>
          </div>

          {fifoLoading ? (
            <div className="py-4 text-center text-[10px] text-slate-400 font-mono-crypto">Loading global queue...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {[2, 3, 4, 5].map((phaseNumber) => {
                const phase = globalFifo.find((p) => Number(p.phaseNumber) === phaseNumber);
                const orders = phase?.orders || [];
                const totalOrders = Number(phase?.totalOrders || 0);
                const totalQueuedTokens = Number(phase?.totalQueuedTokens || 0);
                return (
                <div key={phaseNumber} className="rounded-[15px] border border-white/10 bg-[#050b16]/75 p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 font-rajdhani uppercase tracking-wider">
                      PHASE {phaseNumber}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-300 font-mono-crypto">
                      {totalOrders} orders • {totalQueuedTokens.toLocaleString()} NXBC queued
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {orders.length === 0 ? (
                      <div className="rounded-[12px] px-2.5 py-2 border border-white/10 bg-[#071426]/50 text-center text-[8px] text-slate-500 font-mono-crypto">
                        No active FIFO orders
                      </div>
                    ) : orders.slice(0, 1).map((o) => {
                      const isMine = !!walletAddress && o.walletAddress.toLowerCase() === `${walletAddress.slice(0, 6).toLowerCase()}...${walletAddress.slice(-4).toLowerCase()}`;
                      return (
                        <div
                          key={o.id}
                          className={`rounded-[12px] px-2.5 py-2 border ${
                            isMine
                              ? 'border-amber-400/40 bg-amber-400/10'
                              : 'border-white/10 bg-[#071426]/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[8px] sm:text-[9px] font-mono-crypto">
                            <span className="text-white font-bold">#{o.position} {o.walletAddress}</span>
                            <span className="text-amber-300 font-bold">{o.remainingTokens.toLocaleString()} NXBC</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[7.5px] sm:text-[8px] font-mono-crypto text-slate-300">
                            <span>Ahead: <strong className="text-cyan-300">{o.aheadTokens.toLocaleString()} NXBC</strong></span>
                            <span className="text-emerald-300 font-bold">@ ${o.tokenPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalOrders > 1 && (
                    <div className="mt-1.5 text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto text-center">
                      +{totalOrders - 1} more order(s) waiting in FIFO sequence
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}

          {/* User's Personal FIFO Orders (if any) */}
          {saleOrders.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-[9px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider mb-2">
                Your Queued Orders ({saleOrders.length})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {saleOrders.map((o) => {
                  const invite = inviteByOrder[o.id];
                  const canInvite = o.phaseNumber >= 2 && o.phaseNumber <= 5 && Number(o.remainingTokens) > 0;
                  return (
                    <div key={o.id} className="rounded-[12px] border border-white/10 bg-[#071426]/60 p-2.5 text-[8px] font-mono-crypto space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-amber-300 font-bold">Phase {o.phaseNumber}</span> · FIFO #{o.fifoNumber || o.id}
                        </div>
                        <span className="text-emerald-300 font-bold">{o.status.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-slate-300">
                        <span>Allocation: <b className="text-white">{o.amountTokens.toLocaleString()}</b></span>
                        <span>Remaining: <b className="text-amber-300">{o.remainingTokens.toLocaleString()}</b></span>
                        <span>Running: <b className="text-cyan-300">#{o.currentRunningFifoNumber || '—'}</b></span>
                        <span>Ahead: <b className="text-cyan-300">{o.positionsAhead ?? 0} orders</b></span>
                        <span>Price: <b className="text-emerald-300">${o.tokenPrice.toFixed(2)}</b></span>
                      </div>
                      {canInvite && (
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => generateDirectBuyerLink(o.id)} disabled={inviteLoading === o.id}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 border border-amber-300/30 text-amber-200 font-bold hover:bg-amber-400/25 disabled:opacity-50">
                            {inviteLoading === o.id ? 'Creating...' : 'Generate Direct Buyer Link'}
                          </button>
                          {invite && <button type="button" onClick={() => navigator.clipboard?.writeText(invite.url)} className="px-2 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-300/20 text-cyan-200">Copy</button>}
                        </div>
                      )}
                      {invite && <div className="break-all text-[7px] text-cyan-300/80">{invite.url}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🔥 ADMIN SPECIAL OFFER / DIRECT SALE CHALLENGE WALL */}
      {specialOffer && specialOffer.active && (
        <section className="relative overflow-hidden rounded-[22px] border border-amber-400/40 bg-[radial-gradient(circle_at_10%_20%,rgba(245,158,11,0.15),transparent_40%),linear-gradient(135deg,#0e1a2e_0%,#091221_60%,#1a0f05_100%)] p-3.5 sm:p-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <Flame className="w-5 h-5 fill-slate-950 animate-bounce" />
              </div>
              <div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-300 font-rajdhani bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {specialOffer.badgeText || "DIRECT SALE CHALLENGE"}
                </span>
                <h3 className="text-xs sm:text-sm font-black font-rajdhani uppercase tracking-wider text-white mt-0.5">
                  {specialOffer.title}
                </h3>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[8px] text-slate-400 font-mono-crypto block">CASH REWARD</span>
              <span className="text-sm sm:text-base font-black font-mono-crypto text-emerald-300">
                +${specialOffer.rewardUsdt.toFixed(2)} USDT
              </span>
            </div>
          </div>

          <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 font-mono-crypto mb-3">
            {specialOffer.subtitle}
          </p>

          {/* Progress Bar & Target Tracker */}
          <div className="rounded-xl bg-[#050b16]/80 border border-amber-400/20 p-2.5 sm:p-3 space-y-2">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono-crypto">
              <span className="text-slate-300 font-bold">Your Direct Sales Volume:</span>
              <span className="text-amber-300 font-black">
                ${userDirectVol.toFixed(2)} / ${specialOffer.targetDirectVolume.toFixed(2)} USD
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{
                  width: `${Math.min(100, (userDirectVol / Math.max(1, specialOffer.targetDirectVolume)) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-mono-crypto pt-0.5">
              <span className="text-slate-400">
                Progress: <strong className="text-white">{Math.min(100, Math.round((userDirectVol / Math.max(1, specialOffer.targetDirectVolume)) * 100))}%</strong>
              </span>
              {userDirectVol >= specialOffer.targetDirectVolume ? (
                <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" /> TARGET COMPLETED & REWARD CREDITED!
                </span>
              ) : (
                <span className="text-amber-300 font-bold">
                  Need ${(specialOffer.targetDirectVolume - userDirectVol).toFixed(2)} more sales to unlock bonus!
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. COMMUNITY & YIELD ANALYTICS */}
      <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,#081426_0%,#07101c_65%,#050b16_100%)] p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-black text-amber-300 font-rajdhani uppercase tracking-wider">
            Community & Yield Analytics
          </h3>
          <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono-crypto">Real-time stats</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* Card 1: Total Return */}
          <div className="p-3 rounded-[15px] bg-[#050b16]/80 border border-emerald-400/25 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Projected Total Return</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-emerald-300">
                {showValues ? `+$${projectedReturnUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••'}
              </div>
            </div>
            
            {/* Mini Sparkline Chart SVG */}
            <div className="mt-2 pt-1 border-t border-white/10">
              <svg className="w-full h-5 stroke-emerald-400 fill-emerald-500/10" viewBox="0 0 100 25">
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2 L100,25 L0,25 Z" />
                <path d="M0,20 Q25,18 45,10 T80,5 T100,2" fill="none" strokeWidth="2" />
              </svg>
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 font-mono-crypto">Total gross USDT return from phase sales</span>
            </div>
          </div>

          {/* Card 2: Team Structure */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-purple-400/25 hover:border-purple-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-purple-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Team Structure</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-white">
                {teamStats.directCount} Directs / {teamStats.totalTeamCount} Team
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-amber-300 font-medium">
              <span>View Hierarchy</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Level Income */}
          <div
            onClick={onOpenTeamPlanModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-amber-400/25 hover:border-amber-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-amber-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Level Income</span>
                <Percent className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-amber-300">
                {showValues ? `$${levelIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-emerald-300 font-mono-crypto">
              <span>10-Level Active</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Matrix Income */}
          <div
            onClick={onOpenMatrixModal}
            className="p-3 rounded-[15px] bg-[#050b16]/80 border border-cyan-400/25 hover:border-cyan-300/50 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-300 mb-1">
                <span className="text-[10px] font-bold uppercase font-rajdhani">Matrix Income</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm sm:text-base font-black font-mono-crypto text-cyan-300">
                {showValues ? `$${matrixIncomeUsd.toFixed(2)}` : '••••'}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] text-cyan-300 font-mono-crypto">
              <span>Placement + 10-Lvl</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


