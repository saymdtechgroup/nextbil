import React from 'react';
import { User, ShieldCheck, Key, FileText, Globe, Bell, HelpCircle, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { GoldCoinGraphic } from './GoldCoinGraphic';

interface ScreenMineProps {
  walletAddress: string;
  walletConnected: boolean;
  onToggleWallet: () => void;
  onOpenAdmin?: () => void;
}

export const ScreenMine: React.FC<ScreenMineProps> = ({
  walletAddress,
  walletConnected,
  onToggleWallet,
  onOpenAdmin,
}) => {
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
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-black text-slate-100 font-cinzel">
              NXBC MEMBER #8891
            </h2>
          </div>
          <p className="text-[9px] font-mono-crypto text-purple-300/80">
            {walletAddress || '0x71C...a89F'}
          </p>
          <span className="inline-block text-[8px] font-mono-crypto text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30 mt-1">
            VIP Tier 2 Contributor
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-1.5">
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/60 to-[#120626] border-2 border-amber-500/40 hover:border-amber-400/80 transition-all flex items-center justify-between text-xs text-left group shadow-md cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-amber-300 block font-rajdhani uppercase text-sm">
                  🔐 Secret Manager Control Page
                </span>
                <span className="text-[9px] font-mono-crypto text-purple-300">
                  Full Presale, Levels, Matrix & Security Master Settings
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-black text-[9px] font-mono-crypto">
              OPEN
            </span>
          </button>
        )}

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
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-semibold text-slate-100 block">Coin Whitepaper v2.4</span>
              <span className="text-[9px] font-mono-crypto text-purple-400">Tokenomics & 5-Phase Roadmap</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
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
