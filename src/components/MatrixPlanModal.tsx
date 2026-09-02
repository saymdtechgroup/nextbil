import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Shield,
  User,
  Info,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Gift,
} from 'lucide-react';
import { MatrixNode, MatrixConfig } from '../types/crypto';

interface MatrixPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrixNodes: MatrixNode[];
  earnedMatrixUsd: number;
  matrixConfig?: MatrixConfig;
}

export const MatrixPlanModal: React.FC<MatrixPlanModalProps> = ({
  isOpen,
  onClose,
  matrixNodes,
  earnedMatrixUsd,
  matrixConfig = {
    placementIncomeUsd: 1.00,
    uplineSharePercent: 10,
    enabled: true,
  },
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'example' | 'rules'>('tree');

  if (!isOpen) return null;

  const basePlacementUsd = matrixConfig.placementIncomeUsd ?? 1.00;
  const uplinePercent = matrixConfig.uplineSharePercent ?? 10;
  const uplineAmountPerLevel = (basePlacementUsd * uplinePercent) / 100; // e.g. 10% of $1 = $0.10

  // Total for User A in 6-node case:
  // 1. Direct Placement from B & C (immediate children): 2 * $1.00 = $2.00
  // 2. 10% from D, E, F, G (4 members placed under B & C): 4 * $0.10 = $0.40
  // Total = $2.40 (No entry fee, No extra cycle bonus)
  const placementFromBC = basePlacementUsd * 2;
  const uplineFromDEFG = uplineAmountPerLevel * 4;
  const totalUserAEarnings = placementFromBC + uplineFromDEFG;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-[#120727] border-2 border-fuchsia-500/40 p-4 sm:p-6 shadow-[0_0_60px_rgba(217,70,239,0.3)] relative text-slate-100 max-h-[94vh] overflow-y-auto">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 text-white flex items-center justify-center shadow-lg border border-fuchsia-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-100 font-rajdhani uppercase tracking-wider">
                Matrix Placement & 10-Level Upline Plan
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-crypto font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                100% FREE AUTOMATIC PLACEMENT
              </span>
            </div>
            <p className="text-xs text-purple-300/80 font-mono-crypto">
              Zero Entry Fee &bull; Zero Cycle Bonus &bull; Immediate Placement: ${basePlacementUsd.toFixed(2)} &bull; 10-Level Upline: {uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#090314] p-1 rounded-xl border border-purple-500/20 mb-4 gap-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Matrix Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('example')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'example'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>User A &rarr; (B,C &rarr; D,E,F,G) Case</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-rajdhani uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-purple-800 to-purple-950 text-purple-200 border border-purple-500/40'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Rules & Highlights</span>
          </button>
        </div>

        {/* TAB 1: INTERACTIVE 2x2 TREE WITH LIVE PLACEMENT INCOME TRACING */}
        {activeTab === 'tree' && (
          <div className="space-y-4">
            
            {/* Top Quick Income Summary Banner for User A */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-fuchsia-950/50 to-amber-950/80 border border-fuchsia-500/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase text-purple-300 font-semibold font-rajdhani block">
                  User A (Root Leader) Total Matrix Placement Yield
                </span>
                <div className="text-xl font-black font-mono-crypto text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-fuchsia-300 to-emerald-300">
                  ${totalUserAEarnings.toFixed(2)} USD
                </div>
              </div>
              <div className="text-right text-[10px] font-mono-crypto text-purple-300">
                <div>Direct Placement from B & C: <strong className="text-amber-300">+${placementFromBC.toFixed(2)} (${basePlacementUsd.toFixed(2)} x 2)</strong></div>
                <div>10% Upline from D, E, F, G: <strong className="text-fuchsia-300">+${uplineFromDEFG.toFixed(2)} (${uplineAmountPerLevel.toFixed(2)} x 4)</strong></div>
                <div className="text-emerald-400 font-semibold">Zero Fee &bull; No Cycle Deduction</div>
              </div>
            </div>

            {/* Visual 2x2 Matrix Tree Diagram */}
            <div className="bg-[#090317] rounded-2xl border border-purple-500/30 p-4 relative flex flex-col items-center select-none shadow-inner">
              
              {/* Level 0: User A (Root) */}
              <div className="flex flex-col items-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-200 text-black flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  <User className="w-6 h-6" />
                  <span className="text-[9px] font-black font-mono-crypto uppercase">User A</span>
                </div>
                <span className="text-[10px] font-bold font-mono-crypto text-amber-300 mt-1">
                  You (Root Leader)
                </span>
                <span className="text-[8px] text-emerald-400 font-mono-crypto font-bold">
                  Total Placement: +${totalUserAEarnings.toFixed(2)}
                </span>
              </div>

              {/* Connecting Tree Branch 1 */}
              <div className="w-48 sm:w-64 h-5 border-t-2 border-l-2 border-r-2 border-amber-400/50 rounded-t-xl my-1 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-[#090317] text-[8px] font-mono-crypto text-amber-300 border border-amber-500/30 rounded">
                  Direct Placement (${basePlacementUsd.toFixed(2)} each to A)
                </span>
              </div>

              {/* Level 1: User B & User C */}
              <div className="flex justify-between w-64 sm:w-80 px-2 my-1 z-10">
                
                {/* Node B */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-700 border-2 border-fuchsia-400 text-white flex flex-col items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                    <span className="text-[8px] font-black font-mono-crypto">User B</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono-crypto text-fuchsia-300 mt-1">
                    Direct under A
                  </span>
                  <span className="text-[8px] text-amber-300 font-mono-crypto">
                    A gets +${basePlacementUsd.toFixed(2)}
                  </span>
                </div>

                {/* Node C */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-700 border-2 border-fuchsia-400 text-white flex flex-col items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                    <span className="text-[8px] font-black font-mono-crypto">User C</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono-crypto text-fuchsia-300 mt-1">
                    Direct under A
                  </span>
                  <span className="text-[8px] text-amber-300 font-mono-crypto">
                    A gets +${basePlacementUsd.toFixed(2)}
                  </span>
                </div>

              </div>

              {/* Connecting Tree Branches to L2 */}
              <div className="flex justify-between w-72 sm:w-96 h-4 px-6 sm:px-8 my-0.5">
                <div className="w-28 sm:w-36 border-t-2 border-l-2 border-r-2 border-fuchsia-400/40 rounded-t-lg relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1 bg-[#090317] text-[7px] font-mono-crypto text-fuchsia-300 rounded">
                    Direct to B (${basePlacementUsd.toFixed(2)})
                  </span>
                </div>
                <div className="w-28 sm:w-36 border-t-2 border-l-2 border-r-2 border-fuchsia-400/40 rounded-t-lg relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1 bg-[#090317] text-[7px] font-mono-crypto text-fuchsia-300 rounded">
                    Direct to C (${basePlacementUsd.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Level 2: D, E (under B) & F, G (under C) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full mt-1 px-1 z-10 text-center">
                
                {/* Node D */}
                <div className="flex flex-col items-center p-1.5 rounded-xl bg-purple-950/50 border border-purple-600/30">
                  <div className="w-9 h-9 rounded-xl bg-purple-800 border border-purple-400 text-white flex items-center justify-center text-xs font-bold font-mono-crypto">
                    D
                  </div>
                  <span className="text-[8px] font-mono-crypto text-purple-200 mt-1">User D</span>
                  <span className="text-[7px] text-fuchsia-300 font-mono-crypto font-bold">B gets ${basePlacementUsd.toFixed(2)}</span>
                  <span className="text-[7px] text-amber-300 font-mono-crypto">A gets 10% (${uplineAmountPerLevel.toFixed(2)})</span>
                </div>

                {/* Node E */}
                <div className="flex flex-col items-center p-1.5 rounded-xl bg-purple-950/50 border border-purple-600/30">
                  <div className="w-9 h-9 rounded-xl bg-purple-800 border border-purple-400 text-white flex items-center justify-center text-xs font-bold font-mono-crypto">
                    E
                  </div>
                  <span className="text-[8px] font-mono-crypto text-purple-200 mt-1">User E</span>
                  <span className="text-[7px] text-fuchsia-300 font-mono-crypto font-bold">B gets ${basePlacementUsd.toFixed(2)}</span>
                  <span className="text-[7px] text-amber-300 font-mono-crypto">A gets 10% (${uplineAmountPerLevel.toFixed(2)})</span>
                </div>

                {/* Node F */}
                <div className="flex flex-col items-center p-1.5 rounded-xl bg-purple-950/50 border border-purple-600/30">
                  <div className="w-9 h-9 rounded-xl bg-purple-800 border border-purple-400 text-white flex items-center justify-center text-xs font-bold font-mono-crypto">
                    F
                  </div>
                  <span className="text-[8px] font-mono-crypto text-purple-200 mt-1">User F</span>
                  <span className="text-[7px] text-fuchsia-300 font-mono-crypto font-bold">C gets ${basePlacementUsd.toFixed(2)}</span>
                  <span className="text-[7px] text-amber-300 font-mono-crypto">A gets 10% (${uplineAmountPerLevel.toFixed(2)})</span>
                </div>

                {/* Node G */}
                <div className="flex flex-col items-center p-1.5 rounded-xl bg-purple-950/50 border border-purple-600/30">
                  <div className="w-9 h-9 rounded-xl bg-purple-800 border border-purple-400 text-white flex items-center justify-center text-xs font-bold font-mono-crypto">
                    G
                  </div>
                  <span className="text-[8px] font-mono-crypto text-purple-200 mt-1">User G</span>
                  <span className="text-[7px] text-fuchsia-300 font-mono-crypto font-bold">C gets ${basePlacementUsd.toFixed(2)}</span>
                  <span className="text-[7px] text-amber-300 font-mono-crypto">A gets 10% (${uplineAmountPerLevel.toFixed(2)})</span>
                </div>

              </div>

            </div>

            {/* Exact 10-Level Placement Upline Chain Explanation Box */}
            <div className="p-3 rounded-2xl bg-[#090317] border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-rajdhani uppercase">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Exact Placement Distribution Formula (System Set: ${basePlacementUsd.toFixed(2)})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono-crypto">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/40">
                  <span className="text-amber-300 font-bold block mb-1">1. Immediate Direct Parent</span>
                  <span className="text-slate-300">
                    The immediate parent receives <strong>${basePlacementUsd.toFixed(2)}</strong> (e.g., B receives ${basePlacementUsd.toFixed(2)} each).
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/40">
                  <span className="text-fuchsia-300 font-bold block mb-1">2. All 10 Uplines Above</span>
                  <span className="text-slate-300">
                    All <strong>10 Level Uplines</strong> above will receive <strong>{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)</strong> from this ${basePlacementUsd.toFixed(2)}!
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMPLETE STEP-BY-STEP WORKED EXAMPLE (USER A SPONSORS 6) */}
        {activeTab === 'example' && (
          <div className="space-y-3.5 text-slate-100">
            
            <div className="p-3.5 rounded-2xl bg-[#0a0319] border border-amber-400/40 space-y-2">
              <h3 className="text-xs sm:text-sm font-black text-amber-300 font-rajdhani uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Example Case: User A Sponsors 6 Members (B, C, D, E, F, G)
              </h3>
              <p className="text-[11px] text-purple-200 font-mono-crypto leading-relaxed">
                Suppose <strong>User A</strong> sponsors 6 direct members. Here is how the 3 transparent income streams work:
              </p>
            </div>

            {/* Step 1: Direct Sponsor Income */}
            <div className="p-3.5 rounded-2xl bg-[#090317] border border-purple-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 font-rajdhani uppercase flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">1</span>
                  Direct Sponsor Income (On All 6 Users)
                </span>
                <span className="text-xs font-mono-crypto font-bold text-amber-300">Presale %</span>
              </div>
              <p className="text-[10px] text-purple-300 font-mono-crypto">
                User A sponsored B, C, D, E, F, and G. Therefore, the <strong>Direct Sponsor % (10%)</strong> of all 6 users' coin purchases is instantly credited to User A's wallet.
              </p>
            </div>

            {/* Step 2: Level 1 Referral Income */}
            <div className="p-3.5 rounded-2xl bg-[#090317] border border-purple-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 font-rajdhani uppercase flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">2</span>
                  Level 1 Referral Income (On All 6 Users)
                </span>
                <span className="text-xs font-mono-crypto font-bold text-emerald-400">10-Tier Unilevel</span>
              </div>
              <p className="text-[10px] text-purple-300 font-mono-crypto">
                Because these 6 users are User A's direct referrals, they all fall under User A's <strong>Level 1</strong> according to the Unilevel Referral Plan. Hence, User A receives their <strong>Level 1 Commission (10%)</strong>.
              </p>
            </div>

            {/* Step 3: Matrix 2x2 Placement & 10-Level Distribution */}
            <div className="p-3.5 rounded-2xl bg-[#090317] border border-fuchsia-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fuchsia-300 font-rajdhani uppercase flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center">3</span>
                  Matrix Placement Income (No Extra Fee &bull; No Cycle Deduction)
                </span>
                <span className="text-xs font-mono-crypto font-bold text-fuchsia-300">Pure Placement</span>
              </div>
              
              <div className="space-y-2 text-[10px] font-mono-crypto text-slate-200">
                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-600/30">
                  <strong className="text-amber-300">B and C are placed under A:</strong>
                  <br />
                  &bull; <strong>User A</strong> receives the Placement Income for B and C: <strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${placementFromBC.toFixed(2)}</strong> (since they are placed directly under A).
                  <br />
                  &bull; All 10 Uplines above User A receive 10% (${uplineAmountPerLevel.toFixed(2)} each) from B and C.
                </div>

                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-600/30">
                  <strong className="text-fuchsia-300">D and E are placed under B:</strong>
                  <br />
                  &bull; Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) is credited to <strong>User B</strong> because D and E are placed directly under User B!
                  <br />
                  &bull; <strong>User A</strong> is Upline Level 1 here, so User A receives <strong>10% of ${basePlacementUsd.toFixed(2)} (${uplineAmountPerLevel.toFixed(2)} from D + ${uplineAmountPerLevel.toFixed(2)} from E = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong>!
                  <br />
                  &bull; All uplines above User A receive 10% (${uplineAmountPerLevel.toFixed(2)} each) up to 10 Levels.
                </div>

                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-600/30">
                  <strong className="text-fuchsia-300">F and G are placed under C:</strong>
                  <br />
                  &bull; Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) is credited to <strong>User C</strong> because F and G are placed directly under User C!
                  <br />
                  &bull; <strong>User A</strong> receives <strong>10% of ${basePlacementUsd.toFixed(2)} (${uplineAmountPerLevel.toFixed(2)} from F + ${uplineAmountPerLevel.toFixed(2)} from G = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong>!
                  <br />
                  &bull; All 10-level uplines above A also receive 10% (${uplineAmountPerLevel.toFixed(2)} each).
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-mono-crypto">
              <span className="text-emerald-300 font-bold">
                ✓ Total Matrix Yield for User A:
              </span>
              <span className="text-sm font-black text-emerald-400">
                +${totalUserAEarnings.toFixed(2)} USD (Pure Cash)
              </span>
            </div>

          </div>
        )}

        {/* TAB 3: SYSTEM PARAMETERS & LIVE SYSTEM VARIABLES */}
        {activeTab === 'rules' && (
          <div className="space-y-3 font-mono-crypto text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0a0319] border border-purple-500/30 space-y-2">
              <h4 className="text-xs font-bold text-slate-100 uppercase font-rajdhani">
                System Dynamic Placement Parameters
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Entry Fee</span>
                  <span className="text-emerald-400 font-bold text-xs">$0.00 (Zero Fee)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Immediate Placement</span>
                  <span className="text-amber-300 font-bold text-xs">${basePlacementUsd.toFixed(2)} USD</span>
                </div>
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Upline Distribution</span>
                  <span className="text-fuchsia-300 font-bold text-xs">{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)})</span>
                </div>
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Upline Depth</span>
                  <span className="text-emerald-400 font-bold text-xs">10 Levels Up</span>
                </div>
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Cycle Bonus</span>
                  <span className="text-slate-400 font-bold text-xs">None (Zero Bonus)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#070211] border border-purple-600/30">
                  <span className="text-purple-400 block uppercase text-[8px]">Extra Payment</span>
                  <span className="text-emerald-400 font-bold text-xs">None (Included)</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/20 text-[10px] text-purple-300 space-y-1">
              <span className="text-slate-200 font-bold block font-rajdhani uppercase text-xs">Zero Risk Community Matrix:</span>
              <p>
                Users do not pay any separate entry fee or extra payment for the matrix. Every member entering the presale is automatically placed in the 2x2 tree, and the system instantly distributes live placement income.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
