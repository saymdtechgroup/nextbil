import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Calendar,
  Search,
  RefreshCw,
  Wallet,
  FileSpreadsheet,
  Check,
  Copy,
  DollarSign,
  Coins,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Users,
  AlertCircle,
} from 'lucide-react';

export interface WalletReportRow {
  userId: number;
  walletAddress: string;
  referralCode: string;
  referredBy: string | null;
  earningWalletBalance: number;
  tokenSaleWalletBalance: number;
  totalWithdrawableBalance: number;
  totalInvestedUsdt: number;
  totalEarnedUsdt: number;
  totalWithdrawnUsdt: number;
  tokenSaleTotalGross: number;
  tokenSaleTotalWithdrawn: number;
  isMlmQualified: boolean;
  createdAt: string;
}

export interface WalletReportSummary {
  totalUsers: number;
  totalEarningWalletLiability: number;
  totalTokenSaleWalletLiability: number;
  totalWithdrawableLiability: number;
  totalInvestedVolume: number;
  totalUsersWithBalance: number;
}

interface AdminWalletReportProps {
  onOpenSecretPage?: () => void;
}

export const AdminWalletReport: React.FC<AdminWalletReportProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [rows, setRows] = useState<WalletReportRow[]>([]);
  const [summary, setSummary] = useState<WalletReportSummary>({
    totalUsers: 0,
    totalEarningWalletLiability: 0,
    totalTokenSaleWalletLiability: 0,
    totalWithdrawableLiability: 0,
    totalInvestedVolume: 0,
    totalUsersWithBalance: 0,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [onlyWithBalance, setOnlyWithBalance] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'totalWithdrawableBalance' | 'earningWalletBalance' | 'tokenSaleWalletBalance' | 'createdAt'>('totalWithdrawableBalance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Report Data from Server
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('nxbc_admin_token') : null;

      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (onlyWithBalance) params.set('minBalance', 'true');

      const res = await fetch(`/api/admin/reports/wallet-balances?${params.toString()}`, {
        headers: token ? { 'x-admin-token': token } : {},
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load wallet balances report');
      }

      setRows(data.rows || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error('Wallet report fetch error:', err);
      setError(err?.message || 'Could not load report. Please verify admin session.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, searchQuery, onlyWithBalance]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Client-side quick filter presets
  const handlePresetDate = (preset: 'all' | 'today' | '7days' | '30days' | 'this_month') => {
    const now = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = toDateStr(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(now));
    }
  };

  // Sort rows
  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'desc') {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      } else {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
    });
    return list;
  }, [rows, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  // Download Report as CSV (Date-wise filename)
  const handleDownloadCsv = () => {
    try {
      setDownloading(true);

      const headers = [
        'User ID',
        'Web3 Wallet Address',
        'Referral Code',
        'Referred By',
        'Earning Wallet Balance (USDT)',
        'Token Sale Wallet Balance (USDT)',
        'Total Withdrawable Balance (USDT)',
        'Total Invested (USDT)',
        'Total Lifetime Earned (USDT)',
        'Total Lifetime Withdrawn (USDT)',
        'MLM Qualified',
        'Registration Date & Time',
      ];

      const csvRows = [headers.join(',')];

      for (const r of sortedRows) {
        const cleanDate = r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').substring(0, 19) : '';
        const line = [
          r.userId,
          `"${r.walletAddress}"`,
          `"${r.referralCode}"`,
          `"${r.referredBy || 'None'}"`,
          r.earningWalletBalance.toFixed(2),
          r.tokenSaleWalletBalance.toFixed(2),
          r.totalWithdrawableBalance.toFixed(2),
          r.totalInvestedUsdt.toFixed(2),
          r.totalEarnedUsdt.toFixed(2),
          r.totalWithdrawnUsdt.toFixed(2),
          r.isMlmQualified ? 'Yes ($100+)' : 'No',
          `"${cleanDate}"`,
        ];
        csvRows.push(line.join(','));
      }

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);

      const dateLabel = startDate && endDate
        ? `${startDate}_to_${endDate}`
        : startDate
        ? `from_${startDate}`
        : endDate
        ? `until_${endDate}`
        : 'all_time';

      const fileName = `NXBC_Wallet_Balances_Report_${dateLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate CSV export:', err);
      alert('Failed to generate CSV download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0d0722] via-[#150930] to-[#0a0518] border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-100 font-cinzel tracking-wider">
                WEB3 USER WALLET BALANCE REPORT
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-crypto font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                AUDIT REPORT
              </span>
            </div>
            <p className="text-xs text-purple-300 font-mono-crypto mt-0.5">
              Admin audit of every user's Web3 Address, Earning Wallet balance, and Token Sale Wallet balance available for withdrawal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-mono-crypto flex items-center gap-1.5 transition-all disabled:opacity-40"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={downloading || rows.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-rajdhani font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono-crypto text-xs">
        {/* Total Registered Wallets */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e0620] border border-purple-500/30 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 text-purple-300 flex items-center justify-center shrink-0 border border-purple-600/30">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-purple-300 font-bold block font-rajdhani">
              Registered Web3 Wallets
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-100">
              {summary.totalUsers.toLocaleString()}
            </div>
            <span className="text-[9px] text-emerald-400">
              {summary.totalUsersWithBalance} with withdrawable balance
            </span>
          </div>
        </div>

        {/* Earning Wallet Liability */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e0620] border border-amber-500/30 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-amber-300 font-bold block font-rajdhani">
              Earning Wallet Total
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              ${summary.totalEarningWalletLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-purple-400">
              MLM / Commission Withdrawable
            </span>
          </div>
        </div>

        {/* Token Sale Wallet Liability */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e0620] border border-cyan-500/30 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-cyan-300 font-bold block font-rajdhani">
              Token Sale Wallet Total
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300">
              ${summary.totalTokenSaleWalletLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-purple-400">
              P2P FIFO Sale Withdrawable
            </span>
          </div>
        </div>

        {/* Grand Total Withdrawable Pool */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#061811] via-[#092219] to-[#05110c] border border-emerald-400/50 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-emerald-300 font-bold block font-rajdhani">
              Grand Total Withdrawable
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ${summary.totalWithdrawableLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] text-emerald-300/80">
              Total Pending User Liability
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Date-Wise Filters Box */}
      <div className="p-4 rounded-2xl bg-[#0e0620] border border-purple-500/30 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-rajdhani uppercase font-bold text-amber-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Date-Wise & Wallet Filter Controls</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono-crypto">
            <button
              type="button"
              onClick={() => handlePresetDate('all')}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                !startDate && !endDate
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                  : 'bg-purple-950/60 text-purple-300 border-purple-700/40 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('today')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/40 text-purple-300 hover:text-white transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('7days')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/40 text-purple-300 hover:text-white transition-all"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('30days')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/40 text-purple-300 hover:text-white transition-all"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('this_month')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/40 text-purple-300 hover:text-white transition-all"
            >
              This Month
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Wallet */}
          <div className="sm:col-span-5 relative">
            <span className="absolute left-3 top-2.5 text-purple-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Web3 Address (0x...) or Referral Code..."
              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-2 pl-9 pr-3 text-xs font-mono-crypto text-slate-100 placeholder:text-purple-400/50 focus:outline-none"
            />
          </div>

          {/* Start Date */}
          <div className="sm:col-span-3 relative">
            <label className="text-[8px] uppercase text-purple-300 font-rajdhani font-semibold block mb-0.5">
              From Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-slate-100 focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="sm:col-span-3 relative">
            <label className="text-[8px] uppercase text-purple-300 font-rajdhani font-semibold block mb-0.5">
              To Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-slate-100 focus:outline-none"
            />
          </div>

          {/* Clear Button */}
          <div className="sm:col-span-1 flex items-end">
            {(startDate || endDate || searchQuery || onlyWithBalance) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setOnlyWithBalance(false);
                }}
                className="w-full py-1.5 rounded-xl bg-purple-950/80 hover:bg-rose-950/80 border border-purple-500/30 text-rose-300 text-[10px] font-mono-crypto transition-all"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter checkbox row */}
        <div className="flex items-center justify-between text-xs font-mono-crypto pt-1 border-t border-purple-500/15">
          <label className="flex items-center gap-2 cursor-pointer select-none text-purple-200 hover:text-white">
            <input
              type="checkbox"
              checked={onlyWithBalance}
              onChange={(e) => setOnlyWithBalance(e.target.checked)}
              className="rounded bg-[#06020c] border-purple-500/50 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px]">Only show users with withdrawable balance &gt; $0.00</span>
          </label>

          <span className="text-[11px] text-purple-400">
            Showing <strong className="text-amber-300">{sortedRows.length}</strong> wallets
          </span>
        </div>
      </div>

      {/* 4. Live Report Data Table */}
      <div className="rounded-3xl bg-[#0e0620] border border-purple-500/30 overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2 bg-[#12082b]">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Web3 User Wallet Accounts ({sortedRows.length})
            </h3>
          </div>
          <span className="text-[10px] text-purple-300 font-mono-crypto">
            Sorted by: <strong className="text-emerald-300 uppercase">{sortField.replace(/([A-Z])/g, ' $1')} ({sortOrder})</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono-crypto text-purple-300 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p>Loading authoritative wallet balance records from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-mono-crypto text-rose-300 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
            <p>{error}</p>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono-crypto text-purple-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-purple-600/50" />
            <p>No user wallet records match the current filter or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono-crypto border-collapse">
              <thead className="sticky top-0 z-10 bg-[#150a32] text-purple-300 text-[10px] uppercase font-rajdhani tracking-wider border-b border-purple-500/30">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Web3 Wallet Address</th>
                  <th className="py-2.5 px-3">Referral Code</th>
                  <th
                    onClick={() => toggleSort('earningWalletBalance')}
                    className="py-2.5 px-3 cursor-pointer hover:text-amber-300 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Earning Wallet</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('tokenSaleWalletBalance')}
                    className="py-2.5 px-3 cursor-pointer hover:text-cyan-300 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Token Sale Wallet</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('totalWithdrawableBalance')}
                    className="py-2.5 px-3 cursor-pointer hover:text-emerald-300 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Withdrawable</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Total Invested</th>
                  <th
                    onClick={() => toggleSort('createdAt')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Joined Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15">
                {sortedRows.map((user, idx) => {
                  const hasEarningBalance = user.earningWalletBalance > 0;
                  const hasTokenSaleBalance = user.tokenSaleWalletBalance > 0;
                  const hasAnyBalance = user.totalWithdrawableBalance > 0;

                  return (
                    <tr
                      key={user.userId || idx}
                      className={`hover:bg-purple-950/30 transition-colors ${
                        hasAnyBalance ? 'bg-[#0f0724]/60' : ''
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-2 px-3 text-purple-400/80 text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Web3 Wallet Address */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-bold text-slate-200 select-all hover:text-amber-300 transition-colors"
                            title={user.walletAddress}
                          >
                            {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user.walletAddress)}
                            className="p-1 text-purple-400 hover:text-white transition-colors"
                            title="Copy full address"
                          >
                            {copiedAddress === user.walletAddress ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`https://bscscan.com/address/${user.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-cyan-300 transition-colors"
                            title="View on BscScan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="py-2 px-3 text-[11px] text-purple-300">
                        <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700/30">
                          {user.referralCode}
                        </span>
                      </td>

                      {/* Earning Wallet Balance */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold inline-block ${
                            hasEarningBalance
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'text-purple-400/70'
                          }`}
                        >
                          ${user.earningWalletBalance.toFixed(2)} USDT
                        </span>
                      </td>

                      {/* Token Sale Wallet Balance */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold inline-block ${
                            hasTokenSaleBalance
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'text-purple-400/70'
                          }`}
                        >
                          ${user.tokenSaleWalletBalance.toFixed(2)} USDT
                        </span>
                      </td>

                      {/* Total Withdrawable Balance */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-black text-xs inline-block ${
                            hasAnyBalance
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          ${user.totalWithdrawableBalance.toFixed(2)} USDT
                        </span>
                      </td>

                      {/* Total Invested */}
                      <td className="py-2 px-3 text-slate-300">
                        ${user.totalInvestedUsdt.toFixed(2)}
                      </td>

                      {/* Registration Date */}
                      <td className="py-2 px-3 text-purple-300/80 text-[10px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-3 bg-[#110728] border-t border-purple-500/20 flex flex-wrap items-center justify-between text-[11px] font-mono-crypto text-purple-300 gap-2">
          <span>
            Total Withdrawable Liability:{' '}
            <strong className="text-emerald-400 font-bold">
              ${summary.totalWithdrawableLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </strong>
          </span>

          <span className="text-purple-400/80">
            *Earning Wallet = MLM & Referral commissions. Token Sale Wallet = Verified FIFO P2P proceeds.
          </span>
        </div>
      </div>
    </div>
  );
};
