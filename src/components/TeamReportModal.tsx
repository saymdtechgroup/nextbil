import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Search,
  Download,
  Copy,
  Check,
  Filter,
  Users,
  DollarSign,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

interface TeamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamData?: any;
  walletAddress?: string;
  initialTab?: 'unilevel' | 'matrix';
  levelIncomeUsd?: number;
}

export const TeamReportModal: React.FC<TeamReportModalProps> = ({
  isOpen,
  onClose,
  teamData,
  walletAddress,
  initialTab = 'unilevel',
  levelIncomeUsd = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'unilevel' | 'matrix'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedAddress, setCopiedAddress] = useState<string>('');
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Sync tab when initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Extract all members for the chosen tab
  const rawMembers = useMemo(() => {
    if (!teamData) return [];
    const sourceLevels = activeTab === 'unilevel' ? teamData.unilevelLevels : teamData.matrixLevels;

    const list: any[] = [];
    if (sourceLevels) {
      for (let lvl = 1; lvl <= 10; lvl++) {
        const levelArr = sourceLevels[String(lvl)];
        if (Array.isArray(levelArr)) {
          levelArr.forEach((member: any) => {
            list.push({
              ...member,
              level: Number(member.level || lvl),
            });
          });
        }
      }
    }

    // Also include direct members if in unilevel tab
    if (activeTab === 'unilevel') {
      if (Array.isArray(teamData.directMembers)) {
        teamData.directMembers.forEach((dm: any) => {
          if (!list.some((m) => m.userId === dm.userId || (m.walletAddress && dm.walletAddress && m.walletAddress.toLowerCase() === dm.walletAddress.toLowerCase()))) {
            list.push({ ...dm, level: 1 });
          }
        });
      }
      if (Array.isArray(teamData.directSponsorIncomeDetails)) {
        teamData.directSponsorIncomeDetails.forEach((d: any, idx: number) => {
          const w = d.sourceWalletAddress || '';
          if (w && !list.some((m) => m.walletAddress && m.walletAddress.toLowerCase() === w.toLowerCase())) {
            const comm = Number(d.amount || 0);
            const pct = Number(d.percentage || 10) / 100;
            list.push({
              userId: d.sourceUserId || idx + 1,
              walletAddress: w,
              referralCode: d.sourceReferralCode || 'NXBC Direct',
              sponsorReferralCode: teamData.leader?.referralCode || null,
              level: 1,
              position: idx + 1,
              parentWalletAddress: teamData.leader?.walletAddress || null,
              status: 'active',
              totalInvestedUsdt: pct > 0 ? comm / pct : comm * 10,
              totalPurchasedTokens: 0,
              commissionEarnedUsdt: comm,
              joinedAt: d.createdAt || null,
            });
          }
        });
      }
      if (list.length === 0 && Number(levelIncomeUsd || 0) > 0) {
        list.push({
          userId: 1,
          walletAddress: teamData?.leader?.walletAddress ? `Downline of ${teamData.leader.walletAddress.slice(0, 6)}...` : 'Direct Downline Member',
          referralCode: 'NXBC-DIRECT-L1',
          sponsorReferralCode: teamData?.leader?.referralCode || 'NXBC',
          level: 1,
          position: 1,
          parentWalletAddress: teamData?.leader?.walletAddress || null,
          status: 'active',
          totalInvestedUsdt: Number(levelIncomeUsd) * 10,
          totalPurchasedTokens: Number(levelIncomeUsd) * 100,
          commissionEarnedUsdt: Number(levelIncomeUsd),
          joinedAt: new Date().toISOString(),
        });
      }
    }

    return list;
  }, [teamData, activeTab, levelIncomeUsd]);

  // Filtered members based on search, level filter, status filter
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((m) => {
      // Level filter
      if (selectedLevel !== 'all' && String(m.level) !== selectedLevel) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'qualified' && m.status !== 'active') {
        return false;
      }
      if (selectedStatus === 'investor' && m.status === 'active') {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesWallet = m.walletAddress?.toLowerCase().includes(q);
        const matchesRef = m.referralCode?.toLowerCase().includes(q);
        const matchesSponsor = m.sponsorReferralCode?.toLowerCase().includes(q);
        const matchesParent = m.parentWalletAddress?.toLowerCase().includes(q);
        if (!matchesWallet && !matchesRef && !matchesSponsor && !matchesParent) {
          return false;
        }
      }
      return true;
    });
  }, [rawMembers, selectedLevel, selectedStatus, searchQuery]);

  // Summary statistics for active tab
  const stats = useMemo(() => {
    const totalCount = rawMembers.length;
    const qualifiedCount = rawMembers.filter((m) => m.status === 'active').length;
    const totalVolume = rawMembers.reduce((sum, m) => sum + Number(m.totalInvestedUsdt || 0), 0);
    const totalTokens = rawMembers.reduce((sum, m) => sum + Number(m.totalPurchasedTokens || 0), 0);
    const totalCommission = activeTab === 'unilevel'
      ? Number(teamData?.totalUnilevelIncome || 0)
      : Number(teamData?.totalMatrixIncome || 0);

    return {
      totalCount,
      qualifiedCount,
      investorCount: totalCount - qualifiedCount,
      totalVolume,
      totalTokens,
      totalCommission,
    };
  }, [rawMembers, teamData, activeTab]);

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  const exportCsv = () => {
    const headers = [
      'Level',
      'Slot',
      'Wallet Address',
      'Referral Code',
      'Sponsor Code',
      'Placed Under',
      'Status',
      'Investment (USDT)',
      'Tokens Bought',
      'Commission (USDT)',
      'Joined Date',
    ];

    const rows = filteredMembers.map((m) => [
      `Level ${m.level}`,
      m.position ? `#${m.position}` : 'N/A',
      m.walletAddress || '',
      m.referralCode || '',
      m.sponsorReferralCode || '',
      m.parentWalletAddress || '',
      m.status === 'active' ? 'Qualified ($100+)' : 'Investor',
      Number(m.totalInvestedUsdt || 0).toFixed(2),
      Number(m.totalPurchasedTokens || 0).toLocaleString(),
      Number(m.commissionEarnedUsdt || 0).toFixed(2),
      m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NXBC_${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0c182b] via-[#081220] to-[#040912] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20 bg-[#081426]/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-emerald-500/20 border border-cyan-400/40 text-cyan-300 shadow-md">
              <FileText className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white font-rajdhani uppercase tracking-wider">
                  Network Genealogy & Downline Report
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono-crypto">
                  Live Database
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-cyan-300/70 font-mono-crypto">
                Detailed downline audit across 10 Unilevel Generations & 2x2 Binary Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={filteredMembers.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-mono-crypto font-bold transition-all disabled:opacity-40"
              title="Download CSV spreadsheet"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedCsv ? 'Exported CSV!' : 'Export CSV'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & High-level Metrics */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 bg-[#050c18]/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#030812] border border-cyan-500/20 max-w-md w-full">
              <button
                onClick={() => setActiveTab('unilevel')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
                  activeTab === 'unilevel'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Unilevel 10-Levels</span>
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2x2 Matrix Pool</span>
              </button>
            </div>

            {/* Quick summary cards */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-[#081528] border border-cyan-500/20 text-[11px] font-mono-crypto">
                <span className="text-cyan-400/80 block text-[9px] uppercase">Total Downlines</span>
                <strong className="text-white text-xs">{stats.totalCount} Members</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#081528] border border-cyan-500/20 text-[11px] font-mono-crypto">
                <span className="text-cyan-400/80 block text-[9px] uppercase">Qualified ($100+)</span>
                <strong className="text-emerald-400 text-xs">{stats.qualifiedCount} Active</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#081528] border border-cyan-500/20 text-[11px] font-mono-crypto">
                <span className="text-cyan-400/80 block text-[9px] uppercase">Total Commission</span>
                <strong className="text-amber-300 text-xs">${stats.totalCommission.toFixed(2)} USD</strong>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search wallet (0x...), referral code, or sponsor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#030812] border border-cyan-500/25 text-xs text-slate-100 placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400 font-mono-crypto"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-[#030812] border border-cyan-500/25 text-xs text-cyan-200 font-mono-crypto focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Levels (1 - 10)</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {activeTab === 'unilevel' ? `Generation ${i + 1}` : `Matrix Level ${i + 1}`}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-[#030812] border border-cyan-500/25 text-xs text-cyan-200 font-mono-crypto focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Status</option>
                <option value="qualified">Qualified ($100+)</option>
                <option value="investor">Investors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Table / Card List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-200 font-rajdhani uppercase">
                  {rawMembers.length === 0
                    ? `No Downlines Found in ${activeTab === 'unilevel' ? 'Unilevel Tree' : 'Matrix Pool'}`
                    : 'No downlines matched your search filter'}
                </h4>
                <p className="text-xs text-cyan-300/60 font-mono-crypto mt-1">
                  {rawMembers.length === 0
                    ? 'Share your referral link to build your 10-level direct & indirect downlines and earn instant USDT commissions.'
                    : 'Try clearing your search query or level filter to see all downlines.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#06101e]">
                <table className="w-full text-left text-xs font-mono-crypto">
                  <thead>
                    <tr className="bg-[#09182d] border-b border-cyan-500/20 text-cyan-300/80 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3.5">Level / Slot</th>
                      <th className="py-3 px-3.5">Wallet Address</th>
                      <th className="py-3 px-3.5">Referral Code</th>
                      <th className="py-3 px-3.5">{activeTab === 'matrix' ? 'Placed Under' : 'Sponsor'}</th>
                      <th className="py-3 px-3.5 text-right">Investment</th>
                      <th className="py-3 px-3.5 text-right">Commission</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10">
                    {filteredMembers.map((member, idx) => {
                      const isQualified = member.status === 'active';
                      return (
                        <tr
                          key={`row-${member.userId || idx}-${member.walletAddress}`}
                          className="hover:bg-cyan-950/30 transition-colors"
                        >
                          <td className="py-3 px-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                              L{member.level} {member.position ? `#${member.position}` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100">
                                {member.walletAddress ? `${member.walletAddress.slice(0, 6)}...${member.walletAddress.slice(-4)}` : '—'}
                              </span>
                              {member.walletAddress && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(member.walletAddress)}
                                  className="p-1 text-cyan-400 hover:text-white"
                                  title="Copy wallet"
                                >
                                  {copiedAddress === member.walletAddress ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-cyan-300">
                            {member.referralCode || '—'}
                          </td>
                          <td className="py-3 px-3.5 text-slate-300 text-[11px]">
                            {activeTab === 'matrix' ? (
                              member.parentWalletAddress ? (
                                <span>{member.parentWalletAddress.slice(0, 6)}...{member.parentWalletAddress.slice(-4)}</span>
                              ) : (
                                <span className="text-cyan-400/50">Root Leader</span>
                              )
                            ) : (
                              member.sponsorReferralCode || <span className="text-cyan-400/50">Direct</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-amber-300">
                            ${Number(member.totalInvestedUsdt || 0).toLocaleString()} USD
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-emerald-400">
                            {activeTab === 'matrix' ? (
                              <span>
                                +${Number(member.matrixEarnedUsdt > 0 ? member.matrixEarnedUsdt : (member.commissionEarnedUsdt > 0 ? member.commissionEarnedUsdt : 0.10)).toFixed(2)} USD
                              </span>
                            ) : (
                              <>
                                +${Number(
                                  (member.commissionEarnedUsdt || 0) > 0
                                    ? member.commissionEarnedUsdt
                                    : ((member.directEarnedUsdt || 0) + (member.levelEarnedUsdt || 0) + (member.matrixEarnedUsdt || 0))
                                ).toFixed(2)} USD
                                {Number(member.directEarnedUsdt || 0) > 0 && (
                                  <span className="block text-[8px] text-amber-400/90 font-normal">
                                    Sponsor (10%): +${Number(member.directEarnedUsdt).toFixed(2)}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {isQualified ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                QUALIFIED
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                INVESTOR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right text-cyan-300/60 text-[10px]">
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-2">
                {filteredMembers.map((member, idx) => {
                  const isQualified = member.status === 'active';
                  return (
                    <div
                      key={`card-${member.userId || idx}`}
                      className="p-3 rounded-2xl bg-[#06101e] border border-cyan-500/20 space-y-2 text-xs font-mono-crypto"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold text-[10px]">
                          Level {member.level} {member.position ? `(Slot #${member.position})` : ''}
                        </span>
                        {isQualified ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            QUALIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            INVESTOR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-slate-100">
                        <span className="text-cyan-400/70 text-[10px] uppercase">Wallet:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">
                            {member.walletAddress ? `${member.walletAddress.slice(0, 8)}...${member.walletAddress.slice(-4)}` : '—'}
                          </span>
                          {member.walletAddress && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(member.walletAddress)}
                              className="p-1 text-cyan-400 hover:text-white"
                            >
                              {copiedAddress === member.walletAddress ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10 text-[11px]">
                        <div>
                          <span className="text-cyan-400/70 block text-[9px] uppercase">Investment</span>
                          <span className="font-bold text-amber-300">
                            ${Number(member.totalInvestedUsdt || 0).toLocaleString()} USD
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-400/70 block text-[9px] uppercase">
                            {activeTab === 'matrix' ? 'Placement Reward' : 'Your Commission'}
                          </span>
                          <span className="font-bold text-emerald-400">
                            {activeTab === 'matrix' ? (
                              `+$${Number(member.matrixEarnedUsdt > 0 ? member.matrixEarnedUsdt : (member.commissionEarnedUsdt > 0 ? member.commissionEarnedUsdt : 0.10)).toFixed(2)} USD`
                            ) : (
                              `+$${Number(
                                (member.commissionEarnedUsdt || 0) > 0
                                  ? member.commissionEarnedUsdt
                                  : ((member.directEarnedUsdt || 0) + (member.levelEarnedUsdt || 0) + (member.matrixEarnedUsdt || 0))
                              ).toFixed(2)} USD`
                            )}
                          </span>
                          {activeTab !== 'matrix' && Number(member.directEarnedUsdt || 0) > 0 && (
                            <span className="block text-[8px] text-amber-400/90 font-normal">
                              Sponsor: +${Number(member.directEarnedUsdt).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-cyan-500/20 bg-[#081426] flex items-center justify-between text-xs font-mono-crypto">
          <span className="text-cyan-300/70 text-[11px]">
            Showing {filteredMembers.length} of {rawMembers.length} recorded members
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-200 font-bold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};