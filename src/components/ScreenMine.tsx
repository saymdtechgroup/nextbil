import React from 'react';
import { User, ShieldCheck, Key, FileText, Globe, Copy, Check, Users, Target, Link2, Sparkles, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface ScreenMineProps {
  walletAddress: string;
  walletConnected: boolean;
  onToggleWallet: () => void;
  onOpenAdmin?: () => void;
  onResetAllData?: () => void;
  totalInvestedUsd?: number;
  minMlmQualifyUsd?: number;
}

export const ScreenMine: React.FC<ScreenMineProps> = ({
  walletAddress,
  walletConnected,
  onToggleWallet,
  onOpenAdmin,
  onResetAllData,
  totalInvestedUsd = 0,
  minMlmQualifyUsd = 100,
}) => {
  const isMlmQualified = totalInvestedUsd >= minMlmQualifyUsd;
  const [copied, setCopied] = useState(false);
  const [contractCopied, setContractCopied] = useState(false);
  const NXBC_CONTRACT = '0x94D064AFDB04E3489C313054260929588b38dF85';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://nxbc.network/ref/${walletAddress ? walletAddress.substring(2, 8) : 'guest'}`);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyContract = async () => {
    try { await navigator.clipboard.writeText(NXBC_CONTRACT); } catch {}
    setContractCopied(true);
    setTimeout(() => setContractCopied(false), 2000);
  };

  return (
    <div className="nxbc-screen flex flex-col w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 pb-0">
      {/* 1. Header Bar: Profile & Identity */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#081426_0%,#07101c_60%,#120b19_100%)] shadow-[0_0_28px_rgba(245,158,11,0.08)]">
        <div className="relative p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-[14px] bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
                <User className="w-5.5 h-5.5 text-amber-300" strokeWidth={2.1} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[13px] sm:text-[15px] font-black font-rajdhani uppercase tracking-[0.08em] text-amber-300 truncate">
                    Profile & Account Core
                  </h1>
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-300/80 font-mono-crypto mt-0.5 truncate">
                  Identity, Security Vault & Web3 Network Hub
                </p>
              </div>
            </div>

            <div className="shrink-0 px-2.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                KYC Verified
              </span>
            </div>
          </div>

          {/* Profile Details Hero Box */}
          <div className="rounded-[18px] border border-amber-400/20 bg-[#050b16]/75 p-3 sm:p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-slate-950 font-black font-cinzel text-lg shadow-[0_0_18px_rgba(245,158,11,0.35)] shrink-0">
              N
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-white font-cinzel truncate">
                  NXBC MEMBER #{walletAddress ? walletAddress.substring(2, 6).toUpperCase() : '0000'}
                </h2>
                <span className={`text-[8px] sm:text-[8.5px] font-mono-crypto px-2 py-0.5 rounded-full border font-bold shrink-0 flex items-center gap-1 ${
                  isMlmQualified
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/60'
                    : 'bg-amber-950/80 text-amber-300 border-amber-400/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isMlmQualified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isMlmQualified ? '👑 MLM Qualified' : 'Token Investor'}
                </span>
              </div>
              <p className="text-[9px] font-mono-crypto text-slate-400 truncate mt-0.5">
                {walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}` : 'Wallet Not Connected'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8.5px] font-mono-crypto text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Total Invested: <strong className="text-white">${totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> USD
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Referral & Networking Hub */}
      <section className="relative overflow-hidden rounded-[22px] border border-amber-400/30 bg-[radial-gradient(circle_at_80%_15%,rgba(245,158,11,0.07),transparent_25%),linear-gradient(135deg,#071426_0%,#09101c_65%,#151109_100%)] shadow-[0_0_28px_rgba(245,158,11,0.07)] p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-300/25 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white font-rajdhani uppercase tracking-wider">
                Your Referral Link
              </h3>
              <p className="text-[8.5px] text-slate-400 font-mono-crypto">
                Invite partners to earn instant multi-tier rewards
              </p>
            </div>
          </div>
          <span className="text-[8px] sm:text-[8.5px] text-emerald-300 font-mono-crypto bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold">
            Earn 10% Direct
          </span>
        </div>

        <div className="p-2 sm:p-2.5 rounded-[16px] bg-[#050b16]/80 border border-white/10 flex items-center gap-2">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono-crypto text-slate-300 truncate">
              https://nxbc.network/ref/{walletAddress ? walletAddress.substring(2, 8) : 'guest'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold font-mono-crypto shadow-sm active:scale-95 transition-all shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Quick Network Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-[16px] bg-[#050b16]/65 border border-amber-400/20 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider font-rajdhani">
                Direct Referrals
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono-crypto text-amber-300 leading-none mt-0.5">
              0
            </p>
            <span className="text-[7.5px] text-slate-400 font-mono-crypto mt-1">Tier 1 Partners</span>
          </div>

          <div className="p-3 rounded-[16px] bg-[#050b16]/65 border border-emerald-400/20 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider font-rajdhani">
                Total Network
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono-crypto text-emerald-400 leading-none mt-0.5">
              0
            </p>
            <span className="text-[7.5px] text-slate-400 font-mono-crypto mt-1">Unilevel & 2x2 Matrix</span>
          </div>
        </div>
      </section>

      {/* 3. NXBC Smart Contract Card */}
      <section className="rounded-[20px] bg-[linear-gradient(135deg,#081426_0%,#07101c_65%,#0d1726_100%)] border border-amber-400/25 p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-300" />
          <h3 className="text-[11px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider">
            NXBC Token Contract (BEP-20)
          </h3>
        </div>
        <div className="p-2.5 rounded-[14px] bg-[#050b16]/80 border border-white/10 flex items-center gap-2">
          <p className="flex-1 min-w-0 text-[9.5px] font-mono-crypto text-slate-300 truncate">
            {NXBC_CONTRACT}
          </p>
          <button
            type="button"
            onClick={handleCopyContract}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[9px] font-bold font-mono-crypto transition-all"
            title="Copy NXBC token contract address"
          >
            {contractCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{contractCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </section>

      {/* 4. Security & Connection Menu List */}
      <section className="space-y-1.5 pb-2">
        <div className="p-3 rounded-[16px] bg-[#050b16]/75 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 block font-rajdhani uppercase tracking-wider text-[11px]">
                Smart Contract Security
              </span>
              <span className="text-[8.5px] font-mono-crypto text-slate-400">
                CertiK Audited Multi-Sig Architecture
              </span>
            </div>
          </div>
          <span className="text-[9.5px] text-emerald-400 font-mono-crypto font-bold px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30">
            100% Passed
          </span>
        </div>

        <div className="p-3 rounded-[16px] bg-[#050b16]/75 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="font-bold text-slate-100 block font-rajdhani uppercase tracking-wider text-[11px]">
                Network RPC Selection
              </span>
              <span className="text-[8.5px] font-mono-crypto text-slate-400">
                BNB Smart Chain (Mainnet)
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono-crypto text-emerald-300">
            Fast 12ms
          </span>
        </div>

        <div className="p-3 rounded-[16px] bg-[#050b16]/75 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Key className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-slate-100 block font-rajdhani uppercase tracking-wider text-[11px]">
                Hot Wallet Connection
              </span>
              <span className="text-[8.5px] font-mono-crypto text-slate-400">
                {walletConnected ? 'Connected (Hot EVM Trust Wallet)' : 'Disconnected'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleWallet}
            className={`px-3 py-1 rounded-xl text-[9.5px] font-mono-crypto font-bold border transition-all ${
              walletConnected
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/40'
            }`}
          >
            {walletConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </section>
    </div>
  );
};