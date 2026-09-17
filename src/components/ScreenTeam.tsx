import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Crown,
  RefreshCw,
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

  // Load team data only when the wallet changes or when the user presses Refresh.
  // Continuous polling was removed to prevent the Team page from flashing/loading.
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
              Direct: {directSponsorPercent}% • 10-Tier Unilevel: {totalTierPercent.toFixed(1)}%
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

        {!isMlmQualified && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[8px] font-mono-crypto text-amber-300/90">
              <span>Investment Progress</span>
              <span>${totalInvestedUsd.toFixed(2)} / ${minMlmQualifyUsd.toFixed(2)} USD ({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#06020c] overflow-hidden border border-amber-500/30">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[8px] text-amber-200/70 leading-tight mt-1">
              *Users with &lt; $100 total investment act as token investors only. Once total purchase reaches $100, MLM commissions unlock and count in the Unilevel network.
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
            <span className="text-2xl font-black font-mono-crypto gold-gradient-text">{totalMembers}</span>
            <span className="text-[9px] text-purple-300 block">Total Team Members</span>
            <span className="text-[8px] text-amber-300/80 block mt-0.5">Direct: {teamData?.totalDirectMembers ?? 0} • Unilevel network</span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono-crypto magenta-gradient-text">${levelIncomeUsd.toFixed(2)}</span>
            <span className="text-[9px] text-purple-300 block">Lifetime Unilevel Income</span>
          </div>
        </div>
      </div>

      {/* Unilevel level summary */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 gap-2">
          <div>
            <h2 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase tracking-wider">Unilevel Referral Commission</h2>
            <p className="text-[8px] text-purple-300/70 font-mono-crypto">Members shown by referral level. Income is shown only when supplied by the backend.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadTeam()}
              disabled={teamLoading || !walletAddress}
              aria-label="Refresh team data"
              className="p-1.5 rounded-lg border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
              title="Refresh team data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${teamLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onOpenTeamModal} className="text-[9px] text-amber-300 font-mono-crypto hover:underline">Full 10 Levels →</button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
          {teamLoading && <div className="p-3 text-[9px] text-purple-300 font-mono-crypto">Loading team data...</div>}
          {teamError && <div className="p-3 text-[9px] text-rose-300 font-mono-crypto">{teamError}</div>}
          {!teamLoading && !teamError && unilevelLevels.map((level) => (
            <div key={level.level} className="p-2 rounded-xl bg-[#110722] border border-purple-500/15 text-[10px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900/80 text-amber-300 font-mono-crypto font-bold text-[9px] flex items-center justify-center">L{level.level}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 block">Unilevel Level {level.level}</span>
                      <span className="text-[8px] font-mono-crypto font-bold text-amber-300/90 bg-amber-500/15 px-1 rounded border border-amber-400/20">{level.commissionPercent}%</span>
                    </div>
                    <span className="text-[8px] font-mono-crypto text-purple-400">{level.members} member{level.members === 1 ? '' : 's'} • ${level.income.toFixed(2)} earned</span>
                  </div>
                </div>
                <span className="font-mono-crypto font-bold text-amber-300">{level.members}</span>
              </div>
              {level.list.length > 0 && (
                <div className="mt-1.5 pl-7 space-y-1">
                  {level.list.slice(0, 8).map((member: any) => (
                    <div key={member.userId} className="flex items-center justify-between gap-2 text-[8px] text-purple-200/90">
                      <span className="truncate">{String(member.walletAddress || '').slice(0, 6)}...{String(member.walletAddress || '').slice(-4)}</span>
                      <span className={member.status === 'active' ? 'text-emerald-400' : 'text-amber-300'}>{member.status}</span>
                    </div>
                  ))}
                  {level.list.length > 8 && <div className="text-[8px] text-purple-400">+{level.list.length - 8} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Matrix level summary - kept separate from Unilevel data */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 gap-2">
          <div>
            <h2 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase tracking-wider">Matrix Rewards & Placement</h2>
            <p className="text-[8px] text-purple-300/70 font-mono-crypto">
              Separate 2x2 placement levels. Matrix income is never added to Unilevel income.
            </p>
          </div>
          <button onClick={onOpenMatrixModal} className="text-[9px] text-fuchsia-300 font-mono-crypto hover:underline">Open Matrix →</button>
        </div>
        <div className="p-2 rounded-xl bg-[#110722] border border-fuchsia-500/20 text-[9px] flex items-center justify-between">
          <span className="text-purple-200">Total Matrix Members: <strong className="text-fuchsia-300">{totalMatrixMembers}</strong></span>
          <span className="text-purple-200">Matrix Income: <strong className="text-fuchsia-300">${Number(teamData?.totalMatrixIncome || 0).toFixed(2)}</strong></span>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
          {!teamLoading && !teamError && matrixLevels.map((level) => (
            <div key={`matrix-${level.level}`} className="p-2 rounded-xl bg-[#110722] border border-fuchsia-500/15 text-[10px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-fuchsia-900/80 text-fuchsia-200 font-mono-crypto font-bold text-[9px] flex items-center justify-center">L{level.level}</span>
                  <div>
                    <span className="font-semibold text-slate-200 block">Matrix Level {level.level}</span>
                    <span className="text-[8px] font-mono-crypto text-purple-400">{level.members} member{level.members === 1 ? '' : 's'} • ${level.income.toFixed(2)} earned</span>
                  </div>
                </div>
                <span className="font-mono-crypto font-bold text-fuchsia-300">{level.members}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leadership Rank & Global Royalty Banner */}
      <div onClick={onOpenTeamModal} className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#1d0b38] to-[#0d041c] border border-amber-400/40 hover:border-amber-400/80 transition-all cursor-pointer flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300"><Crown className="w-4 h-4 text-amber-400" /></div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">Leadership Funds & Salary Rewards</h3>
              <span className="text-[8px] font-mono-crypto px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">5 Major Funds</span>
            </div>
            <p className="text-[8.5px] text-purple-200/90 font-mono-crypto mt-0.5">Dev Fund ($100) • Salary ($100/mo) • Travel ($500) • Car & House Funds</p>
          </div>
        </div>
        <div className="flex items-center gap-1"><span className="text-[9px] font-mono-crypto text-amber-300 font-bold hidden sm:inline">View Plan</span><ChevronRight className="w-4 h-4 text-amber-400" /></div>
      </div>

      {/* Quick Matrix Action Banner */}
      <div onClick={onOpenMatrixModal} className="p-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/70 via-purple-900/50 to-[#120726] border border-fuchsia-400/40 hover:border-fuchsia-300 transition-all cursor-pointer flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300"><Sparkles className="w-4 h-4 text-fuchsia-400" /></div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-100 font-rajdhani uppercase">2x2 Auto-Placement Matrix</h3>
            <p className="text-[8px] text-purple-300/80 font-mono-crypto">Open the separate Matrix dashboard to view placement and Matrix rewards.</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-fuchsia-300" />
      </div>
      <NetworkTreeModal isOpen={isTreeModalOpen} onClose={() => setIsTreeModalOpen(false)} />
    </div>
  );
};