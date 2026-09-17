import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Share2,
  Copy,
  Check,
  Award,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { ReferralLevel, RankReward } from '../types/crypto';
import { NetworkTreeModal } from './NetworkTreeModal';

interface ScreenTeamProps {
  levels: ReferralLevel[];
  rankRewards?: RankReward[];
  directSponsorPercent?: number;
  referralCode?: string;
  onOpenTeamModal: () => void;
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

  useEffect(() => {
    if (!walletAddress) { setTeamData(null); return; }
    let cancelled = false;
    const loadTeam = async () => {
      try {
        setTeamLoading(true); setTeamError('');
        const r = await fetch(`/api/team/${encodeURIComponent(walletAddress)}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to load team');
        if (!cancelled) setTeamData(data);
      } catch (e: any) {
        if (!cancelled) setTeamError(e.message || 'Failed to load team');
      } finally { if (!cancelled) setTeamLoading(false); }
    };
    loadTeam();
    const timer = window.setInterval(loadTeam, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [walletAddress]);

  const teamLevelCounts = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const lvlNum = i + 1;
    const lvlConfig = levels.find((l) => l.level === lvlNum);
    return {
      level: lvlNum,
      commissionPercent: lvlConfig ? lvlConfig.commissionPercent : (lvlNum === 1 ? 5 : lvlNum === 2 ? 3 : lvlNum <= 5 ? 1 : 0.5),
      members: Number(teamData?.counts?.[String(lvlNum)] || 0),
      list: Array.isArray(teamData?.levels?.[String(lvlNum)]) ? teamData.levels[String(lvlNum)] : [],
    };
  }), [teamData, levels]);
  const totalMembers = teamData ? Number(teamData.totalMatrixMembers || 0) : levels.reduce((acc, l) => acc + l.directMembers, 0);
  const totalTierPercent = levels.reduce((acc, l) => acc + l.commissionPercent, 0);

  const isMlmQualified = totalInvestedUsd >= minMlmQualifyUsd;
  const progressPercent = Math.min(100, Math.round((totalInvestedUsd / minMlmQualifyUsd) * 100));
  const remainingToQualify = Math.max(0, minMlmQualifyUsd - totalInvestedUsd);

  const copyRef = () => {
    navigator.clipboard.writeText(`https://nxbc.network?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-3.5 space-y-3.5 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Community & Team Network
            </h1>
            <p className="text-[9px] text-purple-300/70 font-mono-crypto">
              Direct: {directSponsorPercent}% • 10-Tiers: {totalTierPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <button
          onClick={copyRef}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono-crypto text-amber-300 hover:bg-amber-500/30"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>
      </div>

      {/* MLM Qualification Status Banner */}
      <div className={`p-3 rounded-2xl border transition-all ${
        isMlmQualified 
          ? 'bg-gradient-to-r from-emerald-950/60 via-[#1001e] to-[#071a13] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
          : 'bg-gradient-to-r from-amber-950/60 via-[#01708] to-[#140b04] border-amber-500/40 shadow-[0_0_20px_rgba(05,158,11,0.15)]'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${isMlmQualified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
                  MLM Participation Status
                </h3>
                <span className={`text-[9px] font-mono-crypto px-2 py-0.2 rounded-full font-bold border ${
                  isMlmQualified
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                    : 'bg-amber-950 text-amber-300 border-amber-400/50'
                }`}>
                  {isMlmQualified ? '👑 MLM Qualified Leader' : 'Investor Tier'}
                </span>
              </div>
              <p className="text-[9px] text-purple-200/80 font-mono-crypto mt-0.5">
                {isMlmQualified 
                  ? `Total Investment: $${totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD • 10-Level Commissions Active`
                  : `Total Investment: $${totalInvestedUsd.toFixed(2)} USD • Min $${minMlmQualifyUsd} required for MLM eligibility`}
              </p>
            </div>
          </div>

          {!isMlmQualified && onOpenBuyModal && (
            <button
              onClick={onOpenBuyModal}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-black font-mono-crypto font-bold text-[10px] shrink-0 active:scale-95 shadow-sm"
            >
              +${remainingToQualify.toFixed(0)} Qualify
            </button>
          )}
        </div>

        {/* Progress Bar towards $100 Qualification */}
        {!isMlmQualified && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[8px] font-mono-crypto text-amber-300/90">
              <span>Investment Progress</span>
              <span>${totalInvestedUsd.toFixed(2)} / ${minMlmQualifyUsd.toFixed(2)} USD ({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#06020c] overflow-hidden border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[8px] text-amber-200/70 leading-tight mt-1">
              *Users with &lt; $100 total investment act as token investors only. Once total purchase reaches $100, MLM commissions unlock and count in team network.
            </p>
          </div>
        )}
      </div>

      {/* Network Stats Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1d0d38] via-[#14092b] to-[#0b0417] border border-amber-500/30 p-3.5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase text-purple-300/80 font-semibold font-rajdhani flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Total Community Power
          </span>
          <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
            Tier-1 Ambassador
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-2xl font-black font-mono-crypto gold-gradient-text">
              {totalMembers}
            </span>
            <span className="text-[9px] text-purple-300 block">Total Team Members</span>
            <span className="text-[8px] text-amber-300/80 block mt-0.5">Direct: {teamData?.totalDirectMembers ?? 0} • 10-Level Matrix</span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono-crypto magenta-gradient-text">
              ${levelIncomeUsd.toFixed(2)}
            </span>
            <span className="text-[9px] text-purple-300 block">Lifetime Level Earned</span>
          </div>
        </div>
      </div>

      {/* Direct Referrals Snapshot */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase tracking-wider flex items-center gap-1">
            <span>10-Tier Commission Engine</span>
          </h2>
          <button
            onClick={onOpenTeamModal}
            className="text-[9px] text-amber-300 font-mono-crypto hover:underline"
          >
            Full 10-Tiers &rarr;
          </button>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
          {teamLoading && <div className="p-3 text-[9px] text-purple-300 font-mono-crypto">Loading live team...</div>}
          {teamError && <div className="p-3 text-[9px] text-rose-300 font-mono-crypto">{teamError}</div>}
          {!teamLoading && !teamError && teamLevelCounts.map((lvl) => (
            <div key={lvl.level} className="p-2 rounded-xl bg-[#110722] border border-purple-500/15 text-[10px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900/80 text-amber-300 font-mono-crypto font-bold text-[9px] flex items-center justify-center">L{lvl.level}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 block">Level {lvl.level}</span>
                      <span className="text-[8px] font-mono-crypto font-bold text-amber-300/90 bg-amber-500/15 px-1 rounded border border-amber-400/20">
                        {lvl.commissionPercent}%
                      </span>
                    </div>
                    <span className="text-[8px] font-mono-crypto text-purple-400">{lvl.members} team member{lvl.members === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <span className="font-mono-crypto font-bold text-amber-300">{lvl.members}</span>
              </div>
              {lvl.list.length > 0 && (
                <div className="mt-1.5 pl-7 space-y-1">
                  {lvl.list.slice(0, 8).map((m: any) => (
                    <div key={m.userId} className="flex items-center justify-between gap-2 text-[8px] text-purple-200/90">
                      <span className="truncate">{m.walletAddress.slice(0, 6)}...{m.walletAddress.slice(-4)}</span>
                      <span className={m.status === 'active' ? 'text-emerald-400' : 'text-amber-300'}>{m.status}</span>
                    </div>
                  ))}
                  {lvl.list.length > 8 && <div className="text-[8px] text-purple-400">+{lvl.list.length - 8} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leadership Rank & Global Royalty Banner */}
      <div
        onClick={onOpenTeamModal}
        className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#1d0b38] to-[#0d041c] border border-amber-400/40 hover:border-amber-400/80 transition-all cursor-pointer flex items-center justify-between shadow-md"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
                Leadership Funds & Salary Rewards
              </h3>
              <span className="text-[8px] font-mono-crypto px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                5 Major Funds
              </span>
            </div>
            <p className="text-[8.5px] text-purple-200/90 font-mono-crypto mt-0.5">
              Dev Fund ($100) • Salary ($100/mo) • Travel ($500) • Car & House Funds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono-crypto text-amber-300 font-bold hidden sm:inline">View Plan</span>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Quick Matrix Action Banner */}
      <div
        onClick={onOpenMatrixModal}
        className="p-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/70 via-purple-900/50 to-[#120726] border border-fuchsia-400/40 hover:border-fuchsia-300 transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase">
              2x2 Auto-Placement Matrix & 10-Level Upline
            </h3>
            <p className="text-[8px] text-purple-300/80 font-mono-crypto">
              Zero Entry Fee &bull; Immediate Placement & 10-Level Split Tree
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-fuchsia-300" />
      </div>
      <NetworkTreeModal isOpen={isTreeModalOpen} onClose={() => setIsTreeModalOpen(false)} />
    </div>
  );
};
