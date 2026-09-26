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
  initialTab?: 'levels' | 'ranks';
}

export const TeamPlanModal: React.FC<TeamPlanModalProps> = ({
  isOpen,
  onClose,
  levels,
  rankRewards = [],
  directSponsorPercent = 10,
  referralCode = 'NXBC-COMMUNITY-0000',
  initialTab = 'levels',
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'ranks'>(initialTab);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const copyRef = () => {
    navigator.clipboard.writeText(`https://nxbc.tech/ref/${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = levels.reduce((acc, l) => acc + l.earnedUsd, 0);
  const totalCommissionPercent = levels.reduce((acc, l) => acc + l.commissionPercent, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#050b16] border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex items-center justify-between bg-[#081426]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                10-Level & Royalty Rewards
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono-crypto">
                Direct Bonus: {directSponsorPercent}% • 10-Tier Pool: {totalCommissionPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#081426] text-cyan-300 hover:text-white border border-cyan-500/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-cyan-500/20 bg-[#020813] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
              activeTab === 'levels'
                ? 'bg-[#081426] text-amber-300 border-t-2 border-x border-amber-400'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>🌐 Unilevel 10-Level Plan ({totalCommissionPercent.toFixed(1)}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
              activeTab === 'ranks'
                ? 'bg-[#081426] text-amber-300 border-t-2 border-x border-amber-400'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>👑 Leadership Funds & Salary</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Direct Sponsor Highlight Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-900/40 to-[#050b16] border border-amber-400/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-amber-300 font-semibold font-rajdhani flex items-center gap-1">
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

          {/* $100 Minimum Cumulative MLM Qualification Rule Box */}
          <div className="p-3 rounded-2xl bg-[#081426] border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
                MLM Eligibility Rule: $100 Minimum Investment
              </h4>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono-crypto">
              • <strong>Investor Mode (&lt; $100):</strong> Any user with total purchases under $100 acts solely as an investor. They do not earn MLM commissions, nor do their purchases trigger upline MLM commissions.
            </p>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono-crypto">
              • <strong>Cumulative Qualification ($100+):</strong> Once total purchases reach <strong>$100 USD</strong> (e.g. $50 + $50 = $100), the user is instantly recognized as an active MLM participant and upline commissions are generated.
            </p>
          </div>

          {/* Referral Link Copy Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
              Your Community Invite Link
            </label>
            <div className="flex items-center gap-2 bg-[#020813] border border-cyan-500/30 rounded-xl p-1.5 pl-3">
              <span className="text-xs font-mono-crypto text-amber-300 truncate flex-1">
                nxbc.tech/ref/{referralCode}
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
                <span className="text-[10px] text-cyan-400 font-mono-crypto">Contract Configured</span>
              </h3>

              <div className="space-y-1.5">
                {levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="p-2.5 rounded-xl bg-[#081426] border border-cyan-500/20 hover:border-amber-400/40 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-cyan-900/80 text-amber-300 font-mono-crypto text-xs flex items-center justify-center font-bold border border-cyan-700">
                        L{lvl.level}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200 block font-rajdhani">
                          Level {lvl.level} Plan
                        </span>
                        <span className="text-[9px] font-mono-crypto text-cyan-300/70">
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
                  Leadership Funds, Salary & Royalty Pool
                </h3>
                <span className="text-[9px] font-mono-crypto text-amber-300">
                  Direct & Team Business Goals
                </span>
              </div>

              <div className="space-y-2">
                {rankRewards.map((rank) => (
                  <div
                    key={rank.id}
                    className="p-3 rounded-2xl bg-[#081426] border border-cyan-500/20 hover:border-amber-400/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-rajdhani font-black text-xs border border-amber-400/40">
                          Fund #{rank.rankNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-100 font-rajdhani">
                          {rank.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-crypto font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                        {rank.rewardTitle || `$${rank.oneTimeBonusUsd} USD`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#050b16] p-2.5 rounded-xl border border-cyan-500/15">
                      <div>
                        <span className="text-cyan-400 block text-[8px] uppercase font-bold">Qualification Criteria</span>
                        <div className="space-y-0.5 text-[9px] font-mono-crypto text-slate-200 mt-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">Direct Business:</span>
                            <strong className="text-amber-300 font-bold">${(rank.requiredDirectVolume || 0).toLocaleString()} USD</strong>
                          </div>
                          {rank.requiredTeamVolume > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300">Team Business:</span>
                              <strong className="text-emerald-400 font-bold">${rank.requiredTeamVolume.toLocaleString()} USD</strong>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between">
                        <div>
                          <span className="text-cyan-400 block text-[8px] uppercase font-bold">Reward Payout</span>
                          <span className="font-mono-crypto text-emerald-400 font-black text-xs block">
                            {rank.monthlySalaryUsd 
                              ? `$${rank.monthlySalaryUsd}/Month (${rank.salaryMonths} Mo)` 
                              : `$${rank.oneTimeBonusUsd.toLocaleString()} USD`}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono-crypto text-amber-300 font-semibold">
                          Pure USDT Payout
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Security / Payout Info */}
          <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-500/25 text-[10px] text-cyan-200 flex items-start gap-2">
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
