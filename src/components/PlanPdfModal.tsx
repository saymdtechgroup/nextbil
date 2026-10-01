import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Coins,
  ShieldCheck,
  TrendingUp,
  Users,
  Award,
  Flame,
  CheckCircle2,
  Layers,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Rocket,
  Lock,
  Globe,
  Zap,
} from 'lucide-react';
import { ReferralLevel, RankReward } from '../types/crypto';

interface PlanPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels?: ReferralLevel[];
  rankRewards?: RankReward[];
  directSponsorPercent?: number;
}

const DEFAULT_DB_LEVELS: ReferralLevel[] = [
  { level: 1, commissionPercent: 3, directRequirement: 1, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 2, commissionPercent: 2, directRequirement: 2, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 3, commissionPercent: 1, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 4, commissionPercent: 1, directRequirement: 4, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 5, commissionPercent: 0.5, directRequirement: 5, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 6, commissionPercent: 0.5, directRequirement: 6, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 7, commissionPercent: 0.5, directRequirement: 7, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 8, commissionPercent: 0.5, directRequirement: 8, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 9, commissionPercent: 0.5, directRequirement: 9, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  { level: 10, commissionPercent: 0.5, directRequirement: 10, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
];

const DEFAULT_DB_RANKS: RankReward[] = [
  {
    rankNumber: 1,
    name: 'Team Development Fund',
    rewardTitle: '$100 Team Development',
    requiredDirectVolume: 1000,
    requiredTeamVolume: 3000,
    requiredDirects: 0,
    oneTimeBonusUsd: 100,
  },
  {
    rankNumber: 2,
    name: 'Charity Fund',
    rewardTitle: '$500 Charity Fund',
    requiredDirectVolume: 5000,
    requiredTeamVolume: 50000,
    requiredDirects: 0,
    oneTimeBonusUsd: 500,
  },
  {
    rankNumber: 3,
    name: 'Travel Tour Fund',
    rewardTitle: '$1,000 International Travel Tour',
    requiredDirectVolume: 20000,
    requiredTeamVolume: 150000,
    requiredDirects: 0,
    oneTimeBonusUsd: 1000,
  },
  {
    rankNumber: 4,
    name: 'Dream Car Fund',
    rewardTitle: 'Dream Car Fund ($40,000 USD)',
    requiredDirectVolume: 250000,
    requiredTeamVolume: 2000000,
    requiredDirects: 0,
    oneTimeBonusUsd: 40000,
  },
  {
    rankNumber: 5,
    name: 'Luxury House Fund',
    rewardTitle: 'Luxury House Fund ($100,000 USD)',
    requiredDirectVolume: 500000,
    requiredTeamVolume: 3000000,
    requiredDirects: 0,
    oneTimeBonusUsd: 100000,
  },
];

export const PlanPdfModal: React.FC<PlanPdfModalProps> = ({
  isOpen,
  onClose,
  levels: propLevels,
  rankRewards: propRanks,
  directSponsorPercent: propDirectPercent,
}) => {
  const [liveLevels, setLiveLevels] = useState<ReferralLevel[]>(propLevels && propLevels.length > 0 ? propLevels : DEFAULT_DB_LEVELS);
  const [liveRanks, setLiveRanks] = useState<RankReward[]>(propRanks && propRanks.length > 0 ? propRanks : DEFAULT_DB_RANKS);
  const [liveDirectPercent, setLiveDirectPercent] = useState<number>(propDirectPercent ?? 10);

  // Synchronize with database on mount and when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    if (propLevels && propLevels.length > 0) {
      setLiveLevels(propLevels);
    }
    if (propRanks && propRanks.length > 0) {
      setLiveRanks(propRanks);
    }
    if (propDirectPercent !== undefined) {
      setLiveDirectPercent(propDirectPercent);
    }

    // Always fetch latest authoritative database configs
    const fetchDbConfig = async () => {
      try {
        const res = await fetch('/api/presale/config', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.referralLevels) && data.referralLevels.length > 0) {
            setLiveLevels(data.referralLevels);
          }
          if (Array.isArray(data.rankRewards) && data.rankRewards.length > 0) {
            setLiveRanks(data.rankRewards);
          }
          if (data.systemConfig?.directSponsorPercent !== undefined) {
            setLiveDirectPercent(Number(data.systemConfig.directSponsorPercent));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live database referral levels for Plan PDF:', err);
      }
    };
    fetchDbConfig();
  }, [isOpen, propLevels, propRanks, propDirectPercent]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[96vh] flex flex-col rounded-3xl border border-amber-500/50 bg-[#070214] shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden text-slate-100 font-['Outfit',sans-serif]">
        
        {/* Top Header Bar (Screen only, hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-amber-500/25 bg-[#0e0424]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <Coins className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-300 font-cinzel tracking-wider uppercase">
                NXBC TECH OFFICIAL BUSINESS PLAN & WHITEPAPER
              </h2>
              <p className="text-[10px] text-purple-300 font-mono-crypto">
                Complete Tokenomics, 4-Way Incomes, FIFO Liquidity & Strategic Roadmap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs font-rajdhani uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Multi-Page Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#09031a] print:bg-white print:text-black print:p-0 print:space-y-0">

          {/* PAGE 1: COVER PAGE */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#13072b] via-[#090217] to-[#04010b] p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:break-after-page print:min-h-[1050px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center text-xs font-mono-crypto text-amber-400 border-b border-amber-500/20 pb-3 mb-8">
              <span>NXBC TECH DECENTRALIZED PROTOCOL</span>
              <span>OFFICIAL WHITEPAPER & PLAN V2.0</span>
            </div>

            <div className="text-center my-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-xs font-black tracking-widest font-mono-crypto uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                THE NEXT REVOLUTION IN CRYPTO PRESALE & DEFI
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-cinzel leading-tight tracking-wide drop-shadow-[0_2px_15px_rgba(245,158,11,0.3)]">
                NXBC TECH
              </h1>
              <p className="text-base sm:text-xl font-bold text-cyan-300 font-rajdhani uppercase tracking-wider">
                Decentralized Token Presale & 4-Pillar High-Yield MLM Ecosystem
              </p>

              <div className="max-w-xl mx-auto py-4 text-xs sm:text-sm text-purple-200 leading-relaxed font-sans">
                A sustainable, mathematically verified utility coin combining <strong>6-Phase Presale Growth (10,000x potential)</strong>, 
                <strong>Automated FIFO Instant Sell Liquidity</strong>, and a lucrative <strong>Community Affiliate Plan</strong> designed for long-term wealth generation.
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-10 text-center font-mono-crypto">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase">Starting Price</div>
                <div className="text-lg font-black text-amber-300">$0.01</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase">Phase 5 Target</div>
                <div className="text-lg font-black text-white">$100.00</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase">DEX Target</div>
                <div className="text-lg font-black text-emerald-300">$1,500.00+</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase">Direct Sponsor</div>
                <div className="text-lg font-black text-cyan-300">10% Instant</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase">Liquidity Model</div>
                <div className="text-lg font-black text-amber-200">Smart FIFO Bot</div>
              </div>
            </div>

            <div className="mt-12 text-center text-[11px] text-slate-400 font-mono-crypto">
              Built on Binance Smart Chain (BEP-20) • Ultra Fast • Minimal Gas Fees • Fully Automated
            </div>
          </div>

          {/* PAGE 2: TOKEN SPECIFICATION & 6-PHASE SEQUENTIAL ROADMAP */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Coins className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                1. Tokenomics & 6-Phase Price Progression
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              NXBC Coin is engineered with deflationary mechanisms and sequential presale phases to protect early buyers and ensure exponential value multiplication before DEX launch.
            </p>

            {/* Phase Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-crypto border-collapse">
                <thead>
                  <tr className="bg-amber-500/20 text-amber-300 border-b border-amber-500/40">
                    <th className="p-2.5">Phase</th>
                    <th className="p-2.5">Token Price</th>
                    <th className="p-2.5">Allocated Supply</th>
                    <th className="p-2.5">Value Multiplier</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40 text-slate-200">
                  <tr className="bg-purple-950/30 hover:bg-purple-900/20">
                    <td className="p-2.5 font-bold text-amber-400">Phase 1 (P1)</td>
                    <td className="p-2.5 font-black text-white">$0.01</td>
                    <td className="p-2.5">1,000,000 NXBC</td>
                    <td className="p-2.5 font-bold text-emerald-400">1x (Base Price)</td>
                    <td className="p-2.5 text-emerald-400 font-bold">● Live Now</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-amber-400">Phase 2 (P2)</td>
                    <td className="p-2.5 font-black text-white">$0.10</td>
                    <td className="p-2.5">2,500,000 NXBC</td>
                    <td className="p-2.5 font-bold text-emerald-400">10x Gain</td>
                    <td className="p-2.5 text-slate-400">Upcoming</td>
                  </tr>
                  <tr className="bg-purple-950/30">
                    <td className="p-2.5 font-bold text-amber-400">Phase 3 (P3)</td>
                    <td className="p-2.5 font-black text-white">$1.00</td>
                    <td className="p-2.5">7,000,000 NXBC</td>
                    <td className="p-2.5 font-bold text-emerald-400">100x Gain</td>
                    <td className="p-2.5 text-slate-400">Upcoming</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-amber-400">Phase 4 (P4)</td>
                    <td className="p-2.5 font-black text-white">$10.00</td>
                    <td className="p-2.5">19,500,000 NXBC</td>
                    <td className="p-2.5 font-bold text-emerald-400">1,000x Gain</td>
                    <td className="p-2.5 text-slate-400">Upcoming</td>
                  </tr>
                  <tr className="bg-purple-950/30">
                    <td className="p-2.5 font-bold text-amber-400">Phase 5 (P5)</td>
                    <td className="p-2.5 font-black text-white">$100.00</td>
                    <td className="p-2.5">40,000,000 NXBC</td>
                    <td className="p-2.5 font-bold text-emerald-400">10,000x Gain</td>
                    <td className="p-2.5 text-slate-400">Upcoming</td>
                  </tr>
                  <tr className="bg-amber-500/10 font-bold border-t-2 border-amber-500/40">
                    <td className="p-2.5 text-amber-300">DEX Listing (P6)</td>
                    <td className="p-2.5 font-black text-emerald-300">$1,500.00+ Target</td>
                    <td className="p-2.5">Public Pool</td>
                    <td className="p-2.5 text-emerald-300">PancakeSwap Liquidity</td>
                    <td className="p-2.5 text-amber-300">Final Launch</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">Guaranteed Floor Price</h4>
                <p className="text-[10px] text-slate-300">Token rates cannot be manipulated. Each phase rate is cryptographically enforced by the presale smart contract.</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">Staggered Allocation</h4>
                <p className="text-[10px] text-slate-300">Holdings unlock strategically across upcoming phases and DEX listing, preventing whale dumping and market crashes.</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">Minimum Buy</h4>
                <p className="text-[10px] text-slate-300">Low entry barrier of just $10 USD equivalent in USDT allows mass participation for global micro-investors.</p>
              </div>
            </div>
          </div>

          {/* PAGE 3: FIFO AUTOMATED SELL LIQUIDITY BOT */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                2. Automated FIFO Sell Liquidity Protocol
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Unlike traditional crypto projects where users can only buy and cannot sell until public exchanges, NXBC provides 
              a <strong>First-In, First-Out (FIFO) Liquidity Bot</strong> ensuring 100% genuine sell fulfillment directly during presale!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#080214] border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  How FIFO Matching Works
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside font-sans">
                  <li>When a user places a Sell Order, they are queued fairly based on their timestamp.</li>
                  <li>Every new incoming presale buy order is shared with the FIFO queue.</li>
                  <li>The smart bot automatically returns the exact NXBC tokens to the contract and pays instant USDT directly to the seller's wallet!</li>
                  <li>Transparent queue position and real-time execution status visible right on the dashboard.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#080214] border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Protection & Payout Security
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside font-sans">
                  <li>Zero reliance on manual admin intervention — payouts execute via hot wallet bot on BSC.</li>
                  <li>Small sustainable sell fee (e.g. 5%) is re-injected into the community pool and marketing.</li>
                  <li>Prevents artificial inflation and ensures continuous healthy circulation.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PAGE 4: 10% DIRECT SPONSOR & 10-LEVEL REFERRAL COMMISSION */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                3. Direct Sponsor (10%) & 10-Level Referral Income
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Build a global network and earn residual USDT commissions every single time anyone in your 10-level downline purchases NXBC tokens.
            </p>

            {/* Income Highlights */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-transparent border border-amber-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase font-mono-crypto">Direct Referral Bonus:</span>
                <div className="text-xl sm:text-2xl font-black text-white font-cinzel">{liveDirectPercent}% INSTANT CASH ON EVERY DIRECT BUY</div>
              </div>
              <div className="text-xs text-emerald-400 font-mono-crypto font-bold px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-400/40">
                Credited in USDT immediately
              </div>
            </div>

            {/* 10 Level Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-crypto border-collapse">
                <thead>
                  <tr className="bg-amber-500/20 text-amber-300 border-b border-amber-500/40">
                    <th className="p-2">Level</th>
                    <th className="p-2">Commission %</th>
                    <th className="p-2">Example on $10,000 Volume</th>
                    <th className="p-2">Qualification Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40 text-slate-200">
                  {liveLevels.map((lvl) => {
                    const exTurnover = 10000;
                    const exCommission = (exTurnover * Number(lvl.commissionPercent || 0)) / 100;
                    return (
                      <tr key={lvl.level} className={lvl.level % 2 === 1 ? 'bg-purple-950/30' : ''}>
                        <td className="p-2 text-amber-300 font-bold">Level {lvl.level}</td>
                        <td className="p-2 text-emerald-400 font-bold">{lvl.commissionPercent}%</td>
                        <td className="p-2 text-white font-mono-crypto">${exCommission.toFixed(2)} USDT</td>
                        <td className="p-2 text-slate-300 font-sans">
                          {lvl.directRequirement || lvl.level} Active Direct{(lvl.directRequirement || lvl.level) > 1 ? 's' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-purple-950/50 border border-purple-600/40 text-[11px] text-purple-200 font-mono-crypto">
              <span>
                Total 10-Level Distribution: <strong className="text-amber-300">{liveLevels.reduce((acc, l) => acc + Number(l.commissionPercent || 0), 0)}%</strong> + Direct Sponsor: <strong className="text-emerald-400">{liveDirectPercent}%</strong>
              </span>
              <span className="text-cyan-300 font-bold">
                Total Referral Pool: {liveLevels.reduce((acc, l) => acc + Number(l.commissionPercent || 0), 0) + liveDirectPercent}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-600/40 text-[11px] text-purple-200">
              <strong>Dynamic Compression (Pass-up System):</strong> To protect active promoters, if any intermediate upline is not qualified ($100 cumulative investment), the commission automatically passes up to the next qualified leader!
            </div>
          </div>

          {/* PAGE 5: AUTO MATRIX SPILLOVER INCOME */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                4. Automated Matrix Spillover Income
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Earn even without direct recruitment through our global auto-filling matrix structure powered by community spillover!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#080214] border border-amber-500/30 text-center">
                <span className="text-[10px] text-purple-300 uppercase font-mono-crypto">Direct Placement</span>
                <div className="text-xl font-black text-amber-300 font-mono-crypto mt-1">$1.00 USD</div>
                <p className="text-[10px] text-slate-400 mt-1">Instant reward for each immediate direct slot filled in your matrix.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080214] border border-amber-500/30 text-center">
                <span className="text-[10px] text-purple-300 uppercase font-mono-crypto">Upline Spillover Share</span>
                <div className="text-xl font-black text-emerald-300 font-mono-crypto mt-1">10% / Tier</div>
                <p className="text-[10px] text-slate-400 mt-1">Shared bonus distributed upwards as deep matrix nodes cycle.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080214] border border-amber-500/30 text-center">
                <span className="text-[10px] text-purple-300 uppercase font-mono-crypto">Auto Spillover</span>
                <div className="text-xl font-black text-cyan-300 font-mono-crypto mt-1">100% Automated</div>
                <p className="text-[10px] text-slate-400 mt-1">Top leaders' spillover places new buyers under newer members automatically.</p>
              </div>
            </div>
          </div>

          {/* PAGE 6: LEADERSHIP RANK REWARDS & DAILY CHALLENGE OFFER WALL */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                5. Leadership Ranks & Daily Offer Wall
              </h2>
            </div>

            {/* Rank Rewards Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-crypto border-collapse">
                <thead>
                  <tr className="bg-amber-500/20 text-amber-300 border-b border-amber-500/40">
                    <th className="p-2.5">Rank #</th>
                    <th className="p-2.5">Fund Title</th>
                    <th className="p-2.5">Direct Business</th>
                    <th className="p-2.5">Team Business</th>
                    <th className="p-2.5">Cash Reward (USDT)</th>
                    <th className="p-2.5">Reward Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/40 text-slate-200">
                  {liveRanks.map((rk) => (
                    <tr key={rk.rankNumber} className={rk.rankNumber % 2 === 1 ? 'bg-purple-950/30' : ''}>
                      <td className="p-2.5 font-bold text-amber-400">#{rk.rankNumber}</td>
                      <td className="p-2.5 font-bold text-white font-rajdhani text-sm">{rk.name || `Fund #${rk.rankNumber}`}</td>
                      <td className="p-2.5 font-mono-crypto">${Number(rk.requiredDirectVolume || 0).toLocaleString()} USD</td>
                      <td className="p-2.5 font-mono-crypto text-cyan-300">${Number(rk.requiredTeamVolume || 0).toLocaleString()} USD</td>
                      <td className="p-2.5 font-black text-emerald-400 font-mono-crypto">+${Number(rk.oneTimeBonusUsd || 0).toLocaleString()} USDT</td>
                      <td className="p-2.5 text-purple-200 font-sans text-[11px]">{rk.rewardTitle || rk.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Daily Direct Sales Offer Wall */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-900/30 border border-amber-400/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase font-mono-crypto flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  DAILY DIRECT SALE CHALLENGE (OFFER WALL)
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono-crypto">
                  +$50 USDT BONUS
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Achieve just <strong>$500 in direct sales</strong> within the 24-hour offer window and receive an instant 
                <strong> $50 USDT cash bonus</strong> credited directly to your withdrawable wallet!
              </p>
            </div>
          </div>

          {/* PAGE 7: POSITIVE & STRATEGIC HIGH-GROWTH ROADMAP */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:break-after-page print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <Rocket className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                6. Strategic Roadmap (Value Creation & Global Vision)
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Our clear, phased milestones are engineered to establish NXBC as a top-tier utility coin on the Binance Smart Chain with sustained long-term appreciation.
            </p>

            <div className="space-y-3 font-mono-crypto text-xs">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border-l-4 border-emerald-400 space-y-1">
                <div className="flex justify-between font-bold text-emerald-300">
                  <span>Q1 - Q2: COMMUNITY LAUNCH & PRESALE ECOSYSTEM</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">COMPLETED / LIVE</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Smart contract deployment on BSC, Phase 1 live presale launch at $0.01, FIFO instant liquidity bot integration, and multi-tier affiliate portal.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border-l-4 border-amber-400 space-y-1">
                <div className="flex justify-between font-bold text-amber-300">
                  <span>Q3: MARKETING EXPANSION & AUDIT CERTIFICATION</span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">IN PROGRESS</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  CertiK smart contract security audit, CoinMarketCap & CoinGecko fast-track listing applications, international roadshows in Dubai, Bangkok, and Mumbai.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border-l-4 border-cyan-400 space-y-1">
                <div className="flex justify-between font-bold text-cyan-300">
                  <span>Q4: PANCAKESWAP DEX LAUNCH & LIQUIDITY LOCK</span>
                  <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">UPCOMING</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Official DEX listing on PancakeSwap (v3) at $1,500.00+ target floor price. 100% Liquidity Pool locked on PinkSale for 2 years for investor peace of mind.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border-l-4 border-purple-400 space-y-1">
                <div className="flex justify-between font-bold text-purple-300">
                  <span>2027: TIER-1 CEX LISTINGS & NXBC MAINNET ECOSYSTEM</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">LONG TERM VISION</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  Listings on Tier-1 Centralized Exchanges (MEXC, Gate.io, Bitget), NXBC native Android & iOS wallet apps, and merchant crypto payment gateway integration.
                </p>
              </div>
            </div>
          </div>

          {/* PAGE 8: TERMS, QUALIFICATION & HOW TO START */}
          <div className="plan-page rounded-2xl border border-amber-500/30 bg-[#100624] p-6 sm:p-8 space-y-5 print:border-none print:min-h-[1050px]">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/25">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-cinzel uppercase">
                7. Qualification Rules & How to Start
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#080214] border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani">
                  System Qualification Rules
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside font-sans">
                  <li><strong>Minimum Buy:</strong> Just $10 USD in BEP-20 USDT.</li>
                  <li><strong>MLM Commission Eligibility:</strong> $100 cumulative personal investment required to unlock all 10 referral levels.</li>
                  <li><strong>Instant Payouts:</strong> Referral commissions are paid instantly in withdrawable USDT.</li>
                  <li><strong>Fair Staggered Release:</strong> Presale tokens unlock sequentially to guarantee massive price appreciation.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#080214] border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani">
                  Simple 3-Step Onboarding
                </h4>
                <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside font-sans">
                  <li>Open Trust Wallet or MetaMask and visit <strong>nxbc.tech</strong>.</li>
                  <li>Connect your wallet on Binance Smart Chain (BEP-20).</li>
                  <li>Select your buy amount in USDT, confirm the transaction, and copy your referral link to begin earning immediately!</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-500/20 text-center space-y-2">
              <div className="text-sm font-black text-amber-300 font-cinzel">
                JOIN THE NXBC REVOLUTION TODAY
              </div>
              <p className="text-[11px] text-slate-400 font-mono-crypto">
                Official Website: https://nxbc.tech • Smart Contract: Verified BEP-20 • Support: 24/7 Community
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer (Screen only) */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 border-t border-amber-500/25 bg-[#0e0424]">
          <div className="text-xs text-slate-400 font-mono-crypto">
            Tip: Click <strong>"Print / Save PDF"</strong> and select "Save as PDF" to download this document on your device.
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs uppercase font-rajdhani flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
