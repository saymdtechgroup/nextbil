import React, { useState } from 'react';
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

interface ScreenTeamProps {
  levels: ReferralLevel[];
  rankRewards?: RankReward[];
  directSponsorPercent?: number;
  onOpenTeamModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
}

export const ScreenTeam: React.FC<ScreenTeamProps> = ({
  levels,
  rankRewards = [],
  directSponsorPercent = 5,
  onOpenTeamModal,
  onOpenMatrixModal,
  levelIncomeUsd,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const totalMembers = levels.reduce((acc, l) => acc + l.directMembers, 0);
  const totalTierPercent = levels.reduce((acc, l) => acc + l.commissionPercent, 0);

  const copyRef = () => {
    navigator.clipboard.writeText('https://nxbc.network?ref=NXBC-COMMUNITY-8891');
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

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
          {levels.slice(0, 4).map((lvl) => (
            <div
              key={lvl.level}
              onClick={onOpenTeamModal}
              className="p-2 rounded-xl bg-[#110722] border border-purple-500/15 flex items-center justify-between text-[10px] hover:border-amber-400/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-900/80 text-amber-300 font-mono-crypto font-bold text-[9px] flex items-center justify-center">
                  L{lvl.level}
                </span>
                <div>
                  <span className="font-semibold text-slate-200 block">Level {lvl.level}</span>
                  <span className="text-[8px] font-mono-crypto text-purple-400">
                    Req: {lvl.directRequirement} Directs • {lvl.directMembers} Users
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono-crypto font-bold text-amber-300 block">
                  {lvl.commissionPercent}%
                </span>
                <span className="text-[8px] font-mono-crypto text-emerald-400">
                  +${lvl.earnedUsd.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leadership Rank & Global Royalty Banner */}
      <div
        onClick={onOpenTeamModal}
        className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#18092f] to-[#0d041c] border border-amber-400/30 hover:border-amber-400/60 transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase">
              Leadership Ranks & Royalty
            </h3>
            <p className="text-[8px] text-purple-300/80 font-mono-crypto">
              Earn from Global Royalty Pool & One-time Cash awards
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-400" />
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
    </div>
  );
};
