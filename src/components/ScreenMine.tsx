import React from 'react';
import { User, ShieldCheck, Key, FileText, Globe, Bell, HelpCircle, ExternalLink, ArrowRightLeft, RefreshCw, Trash2, Copy, Check, Users, Target, Link2 } from 'lucide-react';
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
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-3.5 space-y-3.5 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 font-rajdhani uppercase tracking-wider">
              Profile & Account Core
            </h1>
            <p className="text-[9px] text-purple-300/70 font-mono-crypto">
              Identity & Security Vault
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono-crypto px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
          KYC Verified
        </span>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1d0d38] via-[#14092b] to-[#0b0417] border border-amber-500/30 p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black font-cinzel text-base shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          N
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-100 font-cinzel">
              NXBC MEMBER #{walletAddress ? walletAddress.substring(2, 6).toUpperCase() : '8891'}
            </h2>
            <span className={`text-[8px] font-mono-crypto px-1.5 py-0.5 rounded border font-bold ${
              isMlmQualified
                ? 'bg-emerald-950 text-emerald-300 border-emerald-400/50'
                : 'bg-amber-950 text-amber-300 border-amber-400/50'
            }`}>
              {isMlmQualified ? '👑 MLM Qualified' : 'Investor'}
            </span>
          </div>
          <p className="text-[9px] font-mono-crypto text-purple-300/80">
            {walletAddress ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}` : 'Connect Wallet'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-mono-crypto text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
              Total Invested: ${totalInvestedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      
      {/* Referral & Networking Hub */}
      <div className="rounded-xl bg-[#110722] border border-fuchsia-500/20 overflow-hidden mt-3">
        <div className="p-2.5 border-b border-fuchsia-500/10 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-fuchsia-400" />
            <h3 className="text-[10px] font-bold text-slate-200 font-rajdhani uppercase tracking-wider">Your Referral Link</h3>
          </div>
          <span className="text-[8px] text-purple-300 font-mono-crypto bg-purple-900/40 px-1.5 py-0.2 rounded border border-purple-500/30">Earn 10% Direct</span>
        </div>
        <div className="p-2 flex gap-2 items-center bg-[#090317]">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono-crypto text-purple-300 truncate">https://nxbc.network/ref/{walletAddress ? walletAddress.substring(2, 8) : 'demo123'}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 text-[10px] font-bold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Quick Network Stats */}
      <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
        <div className="p-2.5 rounded-xl bg-[#110722] border border-amber-500/20 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Directs</span>
          </div>
          <p className="text-lg font-black font-mono-crypto text-amber-300">24</p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Total Team</span>
          </div>
          <p className="text-lg font-black font-mono-crypto text-fuchsia-300">148</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-1.5">
        <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-slate-100 block">Smart Contract Security</span>
              <span className="text-[9px] font-mono-crypto text-purple-400">CertiK Audited Multi-Sig</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono-crypto font-bold">100% Passed</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-fuchsia-400" />
            <div>
              <span className="font-semibold text-slate-100 block">Network RPC Selection</span>
              <span className="text-[9px] font-mono-crypto text-purple-400">BNB Smart Chain (Mainnet)</span>
            </div>
          </div>
          <span className="text-[9px] font-mono-crypto text-emerald-400">Fast 12ms</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#110722] border border-purple-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-purple-300" />
            <div>
              <span className="font-semibold text-slate-100 block">Hot Wallet Connection</span>
              <span className="text-[9px] font-mono-crypto text-purple-400">
                {walletConnected ? 'Connected (Hot EVM)' : 'Disconnected'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleWallet}
            className="px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-[9px] font-mono-crypto font-bold text-amber-300 border border-purple-600/40"
          >
            {walletConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};
