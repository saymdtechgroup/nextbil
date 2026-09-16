import React, { useState } from 'react';
import { Coins, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AllocationState, UserEarnings } from '../types/crypto';

interface ScreenTwoAssetsProps {
  userEarnings?: UserEarnings;
  allocation: AllocationState;
  onOpenTeamPlanModal: () => void;
  onOpenMatrixModal: () => void;
  levelIncomeUsd: number;
  matrixIncomeUsd: number;
  walletAddress?: string | null;
}

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({ allocation }) => {
  const [showValues, setShowValues] = useState(true);
  const totalTokens = asNumber(allocation.totalTokensPurchased);

  return (
    <div className="flex-1 min-w-0 p-3.5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-amber-300">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-rajdhani">Assets</h1>
            <p className="text-[10px] text-purple-300/70 font-mono-crypto">Your NXBC allocation and wallet assets</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowValues((value) => !value)}
          className="rounded-lg border border-purple-500/30 bg-purple-950/60 p-2 text-purple-300 hover:text-amber-300"
          aria-label="Toggle balance visibility"
        >
          {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1d0c38] via-[#140828] to-[#0a0414] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-purple-300/80">Connected wallet balance</p>
            <p className="mt-1 text-3xl font-black text-amber-300 font-mono-crypto">
              {showValues ? `${totalTokens.toLocaleString()} NXBC` : '••••••••'}
            </p>
            <p className="mt-1 text-[10px] text-emerald-400 font-mono-crypto">Wallet allocation</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] text-amber-200/80 font-mono-crypto">
          FIFO information is shown in one place only: the main Dashboard. Open Dashboard to view the live Global FIFO and your Individual FIFO position.
        </div>
      </section>

      <section className="rounded-2xl border border-purple-500/25 bg-[#0b0518] p-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-purple-200 font-rajdhani">Asset summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-3">
            <p className="text-[9px] uppercase text-purple-300/70 font-mono-crypto">Total NXBC purchased</p>
            <p className="mt-1 text-lg font-black text-slate-100 font-mono-crypto">
              {showValues ? totalTokens.toLocaleString() : '••••'}
            </p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/30 p-3">
            <p className="text-[9px] uppercase text-purple-300/70 font-mono-crypto">Allocation status</p>
            <p className="mt-1 text-lg font-black text-emerald-300 font-mono-crypto">
              {allocation.isLocked ? 'LOCKED' : 'OPEN'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
