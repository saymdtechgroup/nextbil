import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Users,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Share2,
  Award,
  Sparkles,
  ChevronRight,
  Flame,
  Coins,
} from 'lucide-react';
import { ReferralLevel, RankReward } from '../types/crypto';

interface TeamPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: ReferralLevel[];
  rankRewards?: RankReward[];
  directSponsorPercent?: number;
  referralCode?: string;
}

export const TeamPlanModal: React.FC<TeamPlanModalProps> = ({
  isOpen,
  onClose,
  levels,
  rankRewards = [],
  directSponsorPercent = 5,
  referralCode = 'NXBC-COMMUNITY-8891',
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'ranks'>('levels');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyRef = () => {
    navigator.clipboard.writeText(`https://nxbc.network?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = levels.reduce((acc, l) => acc + l.earnedUsd, 0);
  const totalCommissionPercent = levels.reduce((acc, l) => acc + l.commissionPercent, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#120824] border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between bg-[#160930]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                10-Level & Royalty Rewards
              </h2>
              <p className="text-xs text-purple-300/80 font-mono-crypto">
                Direct Bonus: {directSponsorPercent}% • 10-Tier Pool: {totalCommissionPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-purple-500/20 bg-[#0c0419] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
              activeTab === 'levels'
                ? 'bg-[#180a36] text-amber-300 border-t-2 border-x border-amber-400'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>10-Level Plan ({totalCommissionPercent.toFixed(1)}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
              activeTab === 'ranks'
                ? 'bg-[#180a36] text-amber-300 border-t-2 border-x border-amber-400'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rank & Royalty Rewards</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Direct Sponsor Highlight Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-900/40 to-[#100524] border border-amber-400/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-purple-300 font-semibold font-rajdhani flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Direct Sponsor Income
              </span>
              <div className="text-lg font-black font-mono-crypto gold-gradient-text">
                {directSponsorPercent}% Instant Commission
              </div>
            </div>
            <span className="text-[10px] font-mono-crypto px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
              On Every Direct Buy
            </span>
          </div>

          {/* Referral Link Copy Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
              Your Community Invite Link
            </label>
            <div className="flex items-center gap-2 bg-[#090314] border border-purple-500/30 rounded-xl p-1.5 pl-3">
              <span className="text-xs font-mono-crypto text-amber-300 truncate flex-1">
                nxbc.network?ref={referralCode}
              </span>
              <button
                onClick={copyRef}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: 10-LEVEL BREAKDOWN */}
          {activeTab === 'levels' && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-rajdhani flex items-center justify-between">
                <span>10-Tier Dynamic Commission Structure</span>
                <span className="text-[10px] text-purple-400 font-mono-crypto">Admin Configured</span>
              </h3>

              <div className="space-y-1.5">
                {levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="p-2.5 rounded-xl bg-[#0e061d] border border-purple-500/20 hover:border-amber-400/40 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-purple-900/80 text-amber-300 font-mono-crypto text-xs flex items-center justify-center font-bold border border-purple-700">
                        L{lvl.level}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200 block font-rajdhani">
                          Level {lvl.level} Plan
                        </span>
                        <span className="text-[9px] font-mono-crypto text-purple-400">
                          Requires: {lvl.directRequirement} Directs • {lvl.directMembers} Active Users
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono-crypto font-black text-amber-300 block text-sm">
                        {lvl.commissionPercent}%
                      </span>
                      <span className="text-[9px] font-mono-crypto text-emerald-400">
                        Earned: +${lvl.earnedUsd.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RANK & ROYALTY REWARDS */}
          {activeTab === 'ranks' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-rajdhani">
                  Leadership Ranks & Global Royalty Pool
                </h3>
                <span className="text-[9px] font-mono-crypto text-amber-300">
                  Lifetime Passive Income
                </span>
              </div>

              <div className="space-y-2">
                {rankRewards.map((rank) => (
                  <div
                    key={rank.id}
                    className="p-3 rounded-2xl bg-[#0e061d] border border-purple-500/20 hover:border-amber-400/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-rajdhani font-black text-xs border border-amber-400/40">
                          Tier {rank.rankNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-100 font-rajdhani">
                          {rank.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-crypto font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        {rank.monthlyRoyaltyPercent}% Monthly Royalty
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#070310] p-2 rounded-xl border border-purple-500/10">
                      <div>
                        <span className="text-purple-400 block text-[8px] uppercase">Target Criteria</span>
                        <span className="font-mono-crypto text-slate-200">
                          {rank.requiredDirects} Directs &bull; ${rank.requiredTeamVolume.toLocaleString()} Vol
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-400 block text-[8px] uppercase">Reward Payout</span>
                        <span className="font-mono-crypto text-amber-300 font-bold">
                          ${rank.oneTimeBonusUsd} + {rank.rewardTokens.toLocaleString()} NXBC
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Security / Payout Info */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 text-[10px] text-purple-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All sponsor bonuses, level earnings, and rank awards are powered directly by smart contracts with zero withdrawal lockups.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
