import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Crown,
  RefreshCw,
  Award,
  DollarSign,
  Layers,
  ShieldCheck,
  ArrowRight,
  Info,
  Briefcase,
  GitFork,
} from 'lucide-react';
import { ReferralLevel, RankReward } from '../types/crypto';
import { NetworkTreeModal } from './NetworkTreeModal';

interface ScreenTeamProps {
  levels: ReferralLevel[];
  rankRewards?: RankReward[];
  directSponsorPercent?: number;
  referralCode?: string;
  onOpenTeamModal: (tab?: 'levels' | 'ranks') => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  totalInvestedUsd?: number;
  minMlmQualifyUsd?: number;
  onOpenBuyModal?: () => void;
  walletAddress?: string;
}

export const ScreenTeam: React.FC<ScreenTeamProps> = ({
  levels,
  rankRewards = [],
  directSponsorPercent = 10,
  onOpenTeamModal,
  onOpenMatrixModal,
  levelIncomeUsd,
  totalInvestedUsd = 0,
  minMlmQualifyUsd = 100,
  onOpenBuyModal,
  walletAddress,
  referralCode = 'NXBC-COMMUNITY-0000',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');

  // 3 Distinct income stream tabs to eliminate all confusion:
  // 'unilevel' = 10 Generation referral tree
  // 'matrix' = 2x2 binary auto-spillover placement
  // 'leadership' = 5 Major Funds & Salary based on volume
  const [incomeTab, setIncomeTab] = useState<'unilevel' | 'matrix' | 'leadership'>('unilevel');

  // Load team data only when the wallet changes or when the user presses Refresh
  const loadTeam = useCallback(async () => {
    if (!walletAddress) {
      setTeamData(null);
      setTeamError('');
      return;
    }

    try {
      setTeamLoading(true);
      setTeamError('');
      const response = await fetch(`/api/team/${encodeURIComponent(walletAddress)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load team');
      setTeamData(data);
    } catch (error: any) {
      setTeamError(error?.message || 'Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  // Unilevel 10 Levels
  const unilevelLevels = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    const config = levels.find((item) => item.level === level);
    return {
      level,
      commissionPercent: config ? config.commissionPercent : (level === 1 ? 5 : level === 2 ? 3 : level <= 5 ? 1 : 0.5),
      members: Number(teamData?.unilevelCounts?.[String(level)] || 0),
      income: Number(teamData?.unilevelIncome?.[String(level)] || 0),
      list: Array.isArray(teamData?.unilevelLevels?.[String(level)]) ? teamData.unilevelLevels[String(level)] : [],
    };
  }), [teamData, levels]);

  // Matrix 10 Levels
  const matrixLevels = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    return {
      level,
      members: Number(teamData?.matrixCounts?.[String(level)] || 0),
      income: Number(teamData?.matrixIncome?.[String(level)] || 0),
      list: Array.isArray(teamData?.matrixLevels?.[String(level)]) ? teamData.matrixLevels[String(level)] : [],
    };
  }), [teamData]);

  const totalUnilevelMembers = unilevelLevels.reduce((sum, item) => sum + item.members, 0);
  const totalMatrixMembers = matrixLevels.reduce((sum, item) => sum + item.members, 0);
  const totalTierPercent = levels.reduce((total, level) => total + level.commissionPercent, 0);

  // Rank rewards are database/admin controlled. Do not inject demo rewards when the API has no data.
  const effectiveRankRewards = useMemo(() => (rankRewards && rankRewards.length > 0 ? rankRewards : []), [rankRewards]);

  const isMlmQualified = totalInvestedUsd >= minMlmQualifyUsd;
  const progressPercent = minMlmQualifyUsd > 0
    ? Math.min(100, Math.round((totalInvestedUsd / minMlmQualifyUsd) * 100))
    : 100;
  const remainingToQualify = Math.max(0, minMlmQualifyUsd - totalInvestedUsd);

  const copyRef = () => {
    void navigator.clipboard.writeText(`https://nxbc.network?ref=${referralCode}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="nxbc-screen flex-1 p-3 sm:p-4 space-y-3 max-w-4xl mx-auto w-full pb-2">
      {/* 1. Header Bar: Community Network & Invite */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Community & Team Rewards
            </h1>
            <p className="text-[10px] text-cyan-300/80 font-mono-crypto">
              Direct: {directSponsorPercent}% • 10-Tier Unilevel: {totalTierPercent.toFixed(1)}% • 2x2 Matrix & Leadership
            </p>
          </div>
        </div>

        <button
          onClick={copyRef}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs font-mono-crypto hover:from-amber-400 hover:to-amber-500 shadow-md active:scale-95 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Invite Link'}</span>
        </button>
      </div>

      {/* 2. MLM Qualification Status Banner ($100 Rule) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isMlmQualified
          ? 'bg-gradient-to-r from-[#071a13] via-[#092219] to-[#04120c] border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
          : 'bg-gradient-to-r from-[#120703] via-[#1a0c05] to-[#0d0502] border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.12)]'
      }`}>
        {/* Top Header Row with Status Badge properly placed on top right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${
              isMlmQualified
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-400/40'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
                MLM Commission Eligibility
              </h3>
              <p className="text-[10px] text-cyan-200/90 font-mono-crypto mt-0.5">
                {isMlmQualified
                  ? 'All 10-level Unilevel & Matrix earnings unlocked'
                  : `$${minMlmQualifyUsd} cumulative purchases required to unlock MLM earnings`}
              </p>
            </div>
          </div>

          {/* Properly positioned Role & Status Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`text-[9.5px] font-mono-crypto px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isMlmQualified
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-400/50'
                : 'bg-amber-950/80 text-amber-300 border-amber-400/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMlmQualified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isMlmQualified ? '👑 Active Leader ($100+)' : 'Role: Token Investor (< $100)'}
            </span>
          </div>
        </div>

        {/* Action & Progress Info Section */}
        <div className="pt-2.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[10px] sm:text-[11px] font-mono-crypto text-slate-200">
              Purchased:{' '}
              <strong className="text-white font-bold">
                ${totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>{' '}
              / ${minMlmQualifyUsd.toFixed(2)} USD
              {!isMlmQualified && (
                <span className="text-amber-300 ml-1.5">
                  (${remainingToQualify.toFixed(2)} needed)
                </span>
              )}
            </div>

            {!isMlmQualified && onOpenBuyModal && (
              <button
                type="button"
                onClick={onOpenBuyModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mono-crypto font-bold text-xs shrink-0 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all self-start sm:self-auto"
              >
                +${remainingToQualify.toFixed(0)} Qualify Now
              </button>
            )}
          </div>

          {!isMlmQualified && (
            <div className="space-y-1 mt-1">
              <div className="flex justify-between text-[8.5px] sm:text-[9px] font-mono-crypto text-amber-300/90">
                <span>Qualification Progress ($100 Milestone)</span>
                <span className="font-bold">{progressPercent}% Completed</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#06020c] overflow-hidden border border-amber-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[8.5px] sm:text-[9px] text-amber-200/70 leading-relaxed pt-0.5">
                *Users under $100 operate in <strong>Token Investor</strong> mode. At $100+ total purchases, all 10-level network commissions and upline bonuses unlock automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Overall Income & Community Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#050b16] border border-cyan-500/20 text-center">
          <span className="text-[9px] uppercase font-bold text-cyan-300/80 block font-mono-crypto">Unilevel Team</span>
          <span className="text-xl sm:text-2xl font-black font-mono-crypto gold-gradient-text block mt-0.5">
            {totalUnilevelMembers}
          </span>
          <span className="text-[8px] text-amber-300/70 font-mono-crypto">Direct: {teamData?.totalDirectMembers ?? 0}</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#050b16] border border-cyan-500/20 text-center">
          <span className="text-[9px] uppercase font-bold text-cyan-300/80 block font-mono-crypto">Unilevel Income</span>
          <span className="text-xl sm:text-2xl font-black font-mono-crypto text-emerald-400 block mt-0.5">
            ${levelIncomeUsd.toFixed(2)}
          </span>
          <span className="text-[8px] text-emerald-300/70 font-mono-crypto">10-Tier Generations</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#050b16] border border-cyan-500/20 text-center">
          <span className="text-[9px] uppercase font-bold text-cyan-300/80 block font-mono-crypto">Matrix Team</span>
          <span className="text-xl sm:text-2xl font-black font-mono-crypto text-cyan-300 block mt-0.5">
            {totalMatrixMembers}
          </span>
          <span className="text-[8px] text-cyan-300/70 font-mono-crypto">2x2 Spillover</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#050b16] border border-cyan-500/20 text-center">
          <span className="text-[9px] uppercase font-bold text-cyan-300/80 block font-mono-crypto">Matrix Income</span>
          <span className="text-xl sm:text-2xl font-black font-mono-crypto text-cyan-400 block mt-0.5">
            ${Number(teamData?.totalMatrixIncome || 0).toFixed(2)}
          </span>
          <span className="text-[8px] text-cyan-300/70 font-mono-crypto">Independent Pool</span>
        </div>
      </div>

      {/* 4. EXPLICIT 3-TAB SELECTOR (Horizontally Scrollable Left to Right) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono-crypto text-amber-300/80 flex items-center gap-1">
            <span>Income Modules</span>
            <span className="text-slate-400 text-[9px] hidden sm:inline">(Scroll left to right ↔)</span>
          </span>
          <span className="text-[9px] text-amber-400/80 font-mono-crypto sm:hidden">
            Swipe left/right ↔
          </span>
        </div>

        <div className="relative flex items-center">
          {/* Scroll Left Button */}
          <button
            id="team-tabs-scroll-left"
            onClick={() => {
              const el = document.getElementById('team-tabs-scroll-container');
              if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
            }}
            className="hidden sm:flex shrink-0 mr-1.5 p-2 rounded-xl bg-[#081426] border border-amber-400/30 text-amber-300 hover:text-white hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
            title="Scroll tabs left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontally Scrollable Tabs Container */}
          <div
            id="team-tabs-scroll-container"
            className="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-touch rounded-2xl bg-[#081426]/95 p-1.5 border border-amber-400/30 gap-2 shadow-inner snap-x scroll-smooth"
          >
            <button
              id="tab-unilevel-btn"
              onClick={() => {
                setIncomeTab('unilevel');
                const btn = document.getElementById('tab-unilevel-btn');
                btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`shrink-0 whitespace-nowrap snap-start py-2.5 px-4 rounded-xl text-xs font-bold font-rajdhani uppercase tracking-wider flex items-center gap-2 transition-all ${
                incomeTab === 'unilevel'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
                  : 'text-slate-300 hover:text-white bg-[#050b16]/70 hover:bg-slate-800/80 border border-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>1. Unilevel (10-Level)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono-crypto font-bold ${
                  incomeTab === 'unilevel'
                    ? 'bg-black/25 text-slate-950'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {totalUnilevelMembers} Members
              </span>
            </button>

            <button
              id="tab-matrix-btn"
              onClick={() => {
                setIncomeTab('matrix');
                const btn = document.getElementById('tab-matrix-btn');
                btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`shrink-0 whitespace-nowrap snap-start py-2.5 px-4 rounded-xl text-xs font-bold font-rajdhani uppercase tracking-wider flex items-center gap-2 transition-all ${
                incomeTab === 'matrix'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md font-black ring-2 ring-cyan-400/50'
                  : 'text-slate-300 hover:text-white bg-[#050b16]/70 hover:bg-slate-800/80 border border-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>2. 2x2 Matrix</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono-crypto font-bold ${
                  incomeTab === 'matrix'
                    ? 'bg-black/25 text-white'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {totalMatrixMembers} Placements
              </span>
            </button>

            <button
              id="tab-leadership-btn"
              onClick={() => {
                setIncomeTab('leadership');
                const btn = document.getElementById('tab-leadership-btn');
                btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`shrink-0 whitespace-nowrap snap-start py-2.5 px-4 rounded-xl text-xs font-bold font-rajdhani uppercase tracking-wider flex items-center gap-2 transition-all ${
                incomeTab === 'leadership'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
                  : 'text-slate-300 hover:text-white bg-[#050b16]/70 hover:bg-slate-800/80 border border-slate-700/50'
              }`}
            >
              <Crown className="w-4 h-4 shrink-0" />
              <span>3. Leadership Funds & Salary</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono-crypto font-bold ${
                  incomeTab === 'leadership'
                    ? 'bg-black/25 text-slate-950'
                    : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                }`}
              >
                5 Ranks
              </span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            id="team-tabs-scroll-right"
            onClick={() => {
              const el = document.getElementById('team-tabs-scroll-container');
              if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
            }}
            className="hidden sm:flex shrink-0 ml-1.5 p-2 rounded-xl bg-[#081426] border border-amber-400/30 text-amber-300 hover:text-white hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
            title="Scroll tabs right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ----------------- TAB 1: UNILEVEL REFERRAL INCOME ----------------- */}
        {incomeTab === 'unilevel' && (
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#071426] via-[#040d18] to-[#0a0314] p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Tab Explanation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                    🌐 Unilevel Referral Income (10 Generations)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono-crypto">
                    Direct & Downlines
                  </span>
                </div>
                <p className="text-[11px] text-cyan-200/80 font-mono-crypto mt-1">
                  Earned from direct referral token purchases and up to 10 generations of indirect team network volume.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => void loadTeam()}
                  disabled={teamLoading || !walletAddress}
                  className="p-2 rounded-xl border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                  title="Refresh team data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${teamLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsTreeModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-500/40 text-cyan-200 font-mono-crypto text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <GitFork className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Tree</span>
                </button>
                <button
                  onClick={() => onOpenTeamModal('levels')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono-crypto text-xs font-bold flex items-center gap-1"
                >
                  <span>Plan Details →</span>
                </button>
              </div>
            </div>

            {/* Direct Sponsor Commission Highlight */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-900/40 to-[#100524] border border-amber-400/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-cyan-300 font-semibold font-rajdhani flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Direct Sponsor Bonus
                </span>
                <div className="text-base sm:text-lg font-black font-mono-crypto gold-gradient-text">
                  {directSponsorPercent}% Instant Commission
                </div>
                <span className="text-[10px] text-cyan-300/80 font-mono-crypto">
                  Instant reward credited on every token purchase made by your directly invited members
                </span>
              </div>
              <span className="text-[10px] font-mono-crypto px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold shrink-0">
                Level 0 (Direct)
              </span>
            </div>

            {/* 10-Generation Unilevel Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-rajdhani">
                  10-Generation Commission Ledger
                </span>
                <span className="text-[10px] text-amber-300 font-mono-crypto">
                  Total Pool: {totalTierPercent.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 divide-y divide-cyan-500/10">
                {teamLoading && <div className="p-4 text-xs text-cyan-300 font-mono-crypto text-center">Loading team network data...</div>}
                {teamError && <div className="p-4 text-xs text-rose-300 font-mono-crypto text-center">{teamError}</div>}
                {!teamLoading && !teamError && unilevelLevels.map((level) => (
                  <div key={`uni-${level.level}`} className="pt-2 pb-1 first:pt-0">
                    <div className="p-2.5 rounded-xl bg-[#081426] border border-cyan-500/15 hover:border-amber-400/40 transition-colors flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-cyan-900/80 text-amber-300 font-mono-crypto font-bold text-xs flex items-center justify-center border border-cyan-700 shrink-0">
                          L{level.level}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 block font-rajdhani">
                              Unilevel Generation {level.level}
                            </span>
                            <span className="text-[9px] font-mono-crypto font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-400/20">
                              {level.commissionPercent}% Commission
                            </span>
                          </div>
                          <span className="text-[10px] font-mono-crypto text-cyan-400">
                            {level.members} member{level.members === 1 ? '' : 's'} registered &bull; ${level.income.toFixed(2)} USD earned
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono-crypto font-black text-emerald-400 block text-xs sm:text-sm">
                          +${level.income.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono-crypto text-cyan-400">
                          {level.members} User{level.members === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Member address previews if available */}
                    {level.list.length > 0 && (
                      <div className="mt-1 pl-9 pr-2 py-1 space-y-1 bg-cyan-950/20 rounded-lg">
                        {level.list.slice(0, 5).map((member: any) => (
                          <div key={member.userId} className="flex items-center justify-between text-[9px] font-mono-crypto text-cyan-300/80">
                            <span className="truncate">{String(member.walletAddress || '').slice(0, 6)}...{String(member.walletAddress || '').slice(-4)}</span>
                            <span className={member.status === 'active' ? 'text-emerald-400' : 'text-amber-300'}>{member.status}</span>
                          </div>
                        ))}
                        {level.list.length > 5 && (
                          <div className="text-[8px] text-cyan-400 font-mono-crypto">+{level.list.length - 5} more members</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: 2x2 AUTO-PLACEMENT MATRIX ----------------- */}
        {incomeTab === 'matrix' && (
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#1d0933] via-[#130624] to-[#0a0214] p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Tab Explanation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                    ⚡ 2x2 Auto-Placement Matrix (Separate Binary Pool)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono-crypto">
                    Auto-Spillover
                  </span>
                </div>
                <p className="text-[11px] text-cyan-200/80 font-mono-crypto mt-1">
                  Matrix rewards operate on an independent binary structure. Slots are filled automatically via community spillover and upline placement (left-to-right).
                </p>
              </div>

              <button
                onClick={onOpenMatrixModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-600 hover:from-cyan-500 hover:to-cyan-500 text-white font-rajdhani uppercase tracking-wider text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all self-end sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Matrix Visualizer →</span>
              </button>
            </div>

            {/* Matrix Stats Card */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-cyan-300/80 font-mono-crypto block uppercase">Total Matrix Team Slots</span>
                <span className="text-2xl font-black font-mono-crypto text-cyan-300">{totalMatrixMembers} Members Filled</span>
                <span className="text-[10px] text-cyan-300/70 font-mono-crypto block mt-0.5">
                  Base placement reward distributed 10 levels up
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-cyan-300/80 font-mono-crypto block uppercase">Lifetime Matrix Income</span>
                <span className="text-2xl font-black font-mono-crypto text-emerald-400">
                  ${Number(teamData?.totalMatrixIncome || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Matrix 10-Tier Placement Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-rajdhani block px-1">
                Matrix 10-Level Placement Ledger
              </span>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {matrixLevels.map((level) => (
                  <div
                    key={`mat-${level.level}`}
                    className="p-2.5 rounded-xl bg-[#081426] border border-cyan-500/15 hover:border-cyan-400/40 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-cyan-900/60 text-cyan-200 font-mono-crypto font-bold text-xs flex items-center justify-center border border-cyan-700/60 shrink-0">
                        M{level.level}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200 block font-rajdhani">
                          Matrix Placement Level {level.level}
                        </span>
                        <span className="text-[10px] font-mono-crypto text-cyan-400">
                          {level.members} slot{level.members === 1 ? '' : 's'} filled via auto-spillover
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono-crypto font-black text-cyan-300 block text-xs sm:text-sm">
                        ${level.income.toFixed(2)} USD
                      </span>
                      <span className="text-[9px] font-mono-crypto text-cyan-400">
                        {level.members} member{level.members === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: LEADERSHIP FUNDS & MONTHLY SALARY ----------------- */}
        {incomeTab === 'leadership' && (
          <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#050b16] via-[#081426] to-[#050b16] p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Tab Explanation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                    👑 Leadership Funds & Salary Rewards (5 Major Funds)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono-crypto">
                    Volume Based
                  </span>
                </div>
                <p className="text-[11px] text-cyan-200/80 font-mono-crypto mt-1">
                  The 5 Major Leadership Funds and Monthly Salaries are unlocked through cumulative Direct and Team business volume milestones. Independent from generation commissions.
                </p>
              </div>

              <button
                onClick={() => onOpenTeamModal('ranks')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono-crypto text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto shrink-0"
              >
                <span>Full Criteria Modal →</span>
              </button>
            </div>

            {/* 5 Major Leadership Rank Cards */}
            <div className="space-y-2.5">
              {effectiveRankRewards.map((rank) => (
                <div
                  key={rank.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-[#081426] border border-amber-500/25 hover:border-amber-400/50 transition-all space-y-2.5 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 font-rajdhani font-black text-xs border border-amber-400/40">
                        Fund #{rank.rankNumber}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-rajdhani">
                          {rank.name}
                        </h4>
                        <span className="text-[10px] text-amber-300 font-mono-crypto font-bold">
                          {rank.rewardTitle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black font-mono-crypto text-emerald-400 block">
                        {rank.monthlySalaryUsd
                          ? `$${rank.monthlySalaryUsd}/Month Salary`
                          : `$${rank.oneTimeBonusUsd.toLocaleString()} USD Payout`}
                      </span>
                      <span className="text-[9px] font-mono-crypto text-cyan-300/70">
                        Pure USDT Reward
                      </span>
                    </div>
                  </div>

                  {/* Qualification Turnover Targets */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#050b16] p-2.5 rounded-xl border border-cyan-500/15 font-mono-crypto">
                    <div>
                      <span className="text-cyan-400 text-[8px] uppercase font-bold block">1. Direct Business Goal</span>
                      <strong className="text-amber-300 text-xs block mt-0.5">
                        ${(rank.requiredDirectVolume || 0).toLocaleString()} USD
                      </strong>
                    </div>
                    <div>
                      <span className="text-cyan-400 text-[8px] uppercase font-bold block">2. Total Team Business Goal</span>
                      <strong className="text-emerald-400 text-xs block mt-0.5">
                        ${(rank.requiredTeamVolume || 0).toLocaleString()} USD
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guaranteed Leadership Salary Note */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 font-mono-crypto flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Guaranteed Monthly Salary:</strong> Once qualification business volume targets are achieved, the smart contract automatically credits the scheduled monthly USDT salary directly to your connected wallet for 12 consecutive months.
              </span>
            </div>
          </div>
        )}
      </div>

      <NetworkTreeModal isOpen={isTreeModalOpen} onClose={() => setIsTreeModalOpen(false)} />
    </div>
  );
};
