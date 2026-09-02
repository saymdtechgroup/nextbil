import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Save,
  RotateCcw,
  Coins,
  Users,
  Layers,
  Award,
  Settings,
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  Lock,
  Unlock,
  TrendingUp,
  Percent,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  PhaseConfig,
  ReferralLevel,
  MatrixConfig,
  RankReward,
  AdminSystemConfig,
} from '../types/crypto';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: PhaseConfig[];
  onUpdatePhases: (phases: PhaseConfig[]) => void;
  levels: ReferralLevel[];
  onUpdateLevels: (levels: ReferralLevel[]) => void;
  matrixConfig: MatrixConfig;
  onUpdateMatrixConfig: (matrix: MatrixConfig) => void;
  rankRewards: RankReward[];
  onUpdateRankRewards: (ranks: RankReward[]) => void;
  systemConfig: AdminSystemConfig;
  onUpdateSystemConfig: (config: AdminSystemConfig) => void;
  onResetToDefaults: () => void;
  onOpenSecretPage?: () => void;
}

type AdminTab = 'phases' | 'incomes' | 'ranks' | 'system';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  phases,
  onUpdatePhases,
  levels,
  onUpdateLevels,
  matrixConfig,
  onUpdateMatrixConfig,
  rankRewards,
  onUpdateRankRewards,
  systemConfig,
  onUpdateSystemConfig,
  onResetToDefaults,
  onOpenSecretPage,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('phases');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testSimAmount, setTestSimAmount] = useState<number>(100);

  // Local editable copies for seamless batch modifications
  const [localPhases, setLocalPhases] = useState<PhaseConfig[]>(phases);
  const [localLevels, setLocalLevels] = useState<ReferralLevel[]>(levels);
  const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);
  const [localRanks, setLocalRanks] = useState<RankReward[]>(rankRewards);
  const [localSystem, setLocalSystem] = useState<AdminSystemConfig>(systemConfig);

  // Sync state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalPhases(phases);
      setLocalLevels(levels);
      setLocalMatrix(matrixConfig);
      setLocalRanks(rankRewards);
      setLocalSystem(systemConfig);
    }
  }, [isOpen, phases, levels, matrixConfig, rankRewards, systemConfig]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onUpdatePhases(localPhases);
    onUpdateLevels(localLevels);
    onUpdateMatrixConfig(localMatrix);
    onUpdateRankRewards(localRanks);
    onUpdateSystemConfig(localSystem);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Phase Handlers
  const handlePhaseChange = (index: number, field: keyof PhaseConfig, value: any) => {
    const updated = [...localPhases];
    updated[index] = { ...updated[index], [field]: value };
    setLocalPhases(updated);
  };

  const handleSetActivePhase = (phaseId: string) => {
    const updated = localPhases.map((p) => {
      if (p.id === phaseId) return { ...p, status: 'active' as const };
      const currentActive = localPhases.find((item) => item.id === phaseId);
      if (currentActive && p.phaseNumber < currentActive.phaseNumber) {
        return { ...p, status: 'completed' as const };
      }
      return { ...p, status: 'locked' as const };
    });
    setLocalPhases(updated);
  };

  // Level Handlers
  const handleLevelPercentChange = (index: number, value: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], commissionPercent: Math.max(0, value) };
    setLocalLevels(updated);
  };

  const handleLevelDirectsChange = (index: number, value: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], directRequirement: Math.max(0, value) };
    setLocalLevels(updated);
  };

  // Rank Handlers
  const handleRankChange = (index: number, field: keyof RankReward, value: any) => {
    const updated = [...localRanks];
    updated[index] = { ...updated[index], [field]: value };
    setLocalRanks(updated);
  };

  const totalAllocatedTokens = localPhases.reduce((acc, p) => acc + p.totalSupply, 0);
  const totalTargetUsd = localPhases.reduce((acc, p) => acc + p.totalSupply * p.rate, 0);
  const totalLevelPercent = localLevels.reduce((acc, l) => acc + l.commissionPercent, 0);
  const totalRoyaltyPercent = localRanks.reduce((acc, r) => acc + r.monthlyRoyaltyPercent, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0e061e] border-2 border-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.3)] relative text-slate-100 overflow-hidden">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-amber-300" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 bg-[#13092b]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100 font-cinzel tracking-wider flex items-center gap-1.5">
                  NXBC <span className="text-amber-400">MASTER ADMIN PANEL</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-crypto font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  FULL DYNAMIC CONTROL
                </span>
              </div>
              <p className="text-[10px] text-purple-300/80 font-mono-crypto">
                Configure Phases, Coin Pricing, 10-Tier Commissions, Matrix & Rank Rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSecretPage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSecretPage();
                }}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900/90 to-fuchsia-950/90 hover:from-purple-800 hover:to-fuchsia-900 border border-amber-400/50 text-amber-300 text-xs font-rajdhani font-bold uppercase flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Open Dedicated Full-Screen Secret Manager Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Open Secret Admin Page</span>
                <span className="sm:hidden">Secret Page</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Do you wish to restore default settings?')) {
                  onResetToDefaults();
                  setLocalPhases(phases);
                  setLocalLevels(levels);
                  setLocalMatrix(matrixConfig);
                  setLocalRanks(rankRewards);
                  setLocalSystem(systemConfig);
                }
              }}
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/40 text-purple-300 hover:text-white text-xs font-mono-crypto flex items-center gap-1 transition-all"
              title="Reset to initial presets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs font-rajdhani uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-black" />
              <span>Save & Apply Live</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-rose-950/80 border border-purple-700/50 text-purple-300 hover:text-rose-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Notification Bar if Saved */}
        {savedSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 font-mono-crypto animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              All System Settings have been updated in the live app!
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase font-rajdhani">
              Instant Sync Active
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-purple-500/20 bg-[#0b0417] px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('phases')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'phases'
                ? 'bg-[#150a2e] text-amber-300 border-t-2 border-x border-amber-400 shadow-md ring-1 ring-amber-400/20'
                : 'text-purple-300/70 hover:text-slate-100 hover:bg-purple-950/30'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Coin Price & 5 Phases</span>
          </button>

          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'incomes'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border-t-2 border-x border-amber-400 shadow-md ring-1 ring-amber-400/30'
                : 'text-purple-300/70 hover:text-slate-100 hover:bg-purple-950/30'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>2. Sponsor, Matrix & L1-10 Master</span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'ranks'
                ? 'bg-[#150a2e] text-amber-300 border-t-2 border-x border-amber-400 shadow-sm'
                : 'text-purple-300/70 hover:text-slate-100 hover:bg-purple-950/30'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Rank & Royalty Rewards</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all shrink-0 ${
              activeTab === 'system'
                ? 'bg-[#150a2e] text-purple-300 border-t-2 border-x border-purple-400 shadow-sm'
                : 'text-purple-300/70 hover:text-slate-100 hover:bg-purple-950/30'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Coin & Security Controls</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#110724]">
          
          {/* ========================================================================= */}
          {/* TAB 1: ALL-IN-ONE INCOME & COMMISSION CONTROL SUITE                      */}
          {/* ========================================================================= */}
          {activeTab === 'incomes' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/60 to-[#0d041c] border-2 border-amber-500/40 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-md">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-amber-300 font-rajdhani uppercase tracking-wider flex items-center gap-2">
                      Master Income & Commission Control Center
                    </h3>
                    <p className="text-[10px] text-purple-200 font-mono-crypto">
                      Direct Sponsor Bonus, 2x2 Matrix Placement Income, aur Level 1 se Level 10 tak pura dynamic control
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono-crypto font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live System Synchronized
                  </span>
                </div>
              </div>

              {/* 2-Column Grid: Section 1 (Sponsor) & Section 2 (Matrix) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 1. DIRECT SPONSOR INCOME CONTROL */}
                <div className="p-4 rounded-2xl bg-[#090317] border-2 border-amber-500/30 hover:border-amber-400/60 transition-all space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-100 uppercase font-rajdhani">
                          Direct Sponsor Income
                        </h4>
                        <span className="text-[9px] text-purple-300 font-mono-crypto block">
                          Instant Referral Commission
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono-crypto font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      Current: {localSystem.directSponsorPercent}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-amber-300 font-rajdhani font-bold block">
                      Direct Sponsor Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        value={localSystem.directSponsorPercent}
                        onChange={(e) =>
                          setLocalSystem({
                            ...localSystem,
                            directSponsorPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#06020c] border border-amber-500/60 focus:border-amber-400 rounded-xl py-2.5 pl-3 pr-8 text-base font-black font-mono-crypto text-amber-300 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-amber-400 font-bold font-mono-crypto">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Minimum Cumulative MLM Qualification Setting ($100) */}
                  <div className="space-y-2 pt-2 border-t border-purple-500/20">
                    <label className="text-[10px] uppercase text-amber-300 font-rajdhani font-bold block">
                      Minimum MLM Qualification Threshold (USD)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        min="10"
                        max="1000"
                        value={localSystem.minMlmQualifyUsd || 100}
                        onChange={(e) =>
                          setLocalSystem({
                            ...localSystem,
                            minMlmQualifyUsd: parseFloat(e.target.value) || 100,
                          })
                        }
                        className="w-full bg-[#06020c] border border-amber-500/60 focus:border-amber-400 rounded-xl py-2.5 pl-7 pr-3 text-base font-black font-mono-crypto text-amber-300 focus:outline-none"
                      />
                      <span className="absolute left-3 top-2.5 text-sm text-amber-400 font-bold font-mono-crypto">
                        $
                      </span>
                    </div>
                    <p className="text-[8px] text-purple-300/80 font-mono-crypto leading-tight">
                      *Users with cumulative purchases below this threshold act solely as investors. Reaching ${localSystem.minMlmQualifyUsd || 100} unlocks MLM commission earnings and counts towards upline rewards.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e0420] border border-amber-500/20 text-[10px] font-mono-crypto text-purple-200 space-y-1">
                    <span className="text-amber-300 font-bold block">How it works:</span>
                    <p className="text-[9px] text-purple-300/90 leading-tight">
                      When a qualified user purchases NXBC coins via a direct referral link, the direct inviter instantly receives <strong>{localSystem.directSponsorPercent}%</strong> of the purchase amount in their wallet.
                    </p>
                  </div>
                </div>

                {/* 2. MATRIX PLACEMENT INCOME CONTROL */}
                <div className="p-4 rounded-2xl bg-[#090317] border-2 border-fuchsia-500/30 hover:border-fuchsia-400/60 transition-all space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
                        <Layers className="w-4 h-4 text-fuchsia-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-100 uppercase font-rajdhani">
                          Matrix Placement Engine
                        </h4>
                        <span className="text-[9px] text-purple-300 font-mono-crypto block">
                          Zero Entry Fee &bull; Auto Placement
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLocalMatrix({ ...localMatrix, enabled: !localMatrix.enabled })}
                        className="flex items-center gap-1 text-[9px] font-mono-crypto text-purple-200"
                      >
                        {localMatrix.enabled ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            <ToggleRight className="w-6 h-6" /> ACTIVE
                          </span>
                        ) : (
                          <span className="text-purple-400 flex items-center gap-0.5">
                            <ToggleLeft className="w-6 h-6" /> OFF
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Direct Placement Amount */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block">
                        Immediate Parent ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-amber-400 font-mono-crypto font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={localMatrix.placementIncomeUsd ?? 1.0}
                          onChange={(e) =>
                            setLocalMatrix({
                              ...localMatrix,
                              placementIncomeUsd: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#06020c] border border-amber-500/50 rounded-xl py-2 pl-6 pr-2 text-xs font-bold font-mono-crypto text-amber-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Upline 10-Level Split % */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-fuchsia-300 font-rajdhani font-bold block">
                        10-Uplines Split (% each)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="50"
                          value={localMatrix.uplineSharePercent ?? 10}
                          onChange={(e) =>
                            setLocalMatrix({
                              ...localMatrix,
                              uplineSharePercent: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#06020c] border border-fuchsia-500/50 rounded-xl py-2 pl-2 pr-6 text-xs font-bold font-mono-crypto text-fuchsia-300 focus:outline-none"
                        />
                        <span className="absolute right-2 top-2 text-xs text-fuchsia-400 font-bold font-mono-crypto">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0e0420] border border-fuchsia-500/20 text-[9px] font-mono-crypto text-purple-200 space-y-1">
                    <span className="text-fuchsia-300 font-bold block">Matrix Placement Breakdown:</span>
                    <div className="flex justify-between text-[9px]">
                      <span>Immediate Parent:</span>
                      <strong className="text-amber-300">${(localMatrix.placementIncomeUsd ?? 1.0).toFixed(2)} USD</strong>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>10 Uplines (each):</span>
                      <strong className="text-fuchsia-300">
                        ${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)} USD ({localMatrix.uplineSharePercent ?? 10}%)
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. LEVEL 1 SE LEVEL 10 TAK COMMISSION PLAN */}
              <div className="p-4 rounded-3xl bg-[#090317] border-2 border-purple-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase font-rajdhani tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Level 1 Se Level 10 Tak Referral Commission & Direct Requirement
                    </h3>
                    <p className="text-[10px] text-purple-300 font-mono-crypto">
                      System can set different percentages and direct member unlock requirements for each level
                    </p>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-700/50 text-[11px] font-mono-crypto">
                    <span className="text-purple-300">Total 10 Levels Payout: </span>
                    <strong className={`font-black ${totalLevelPercent > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {totalLevelPercent.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                {/* 10 Level Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {localLevels.map((lvl, idx) => (
                    <div
                      key={lvl.level}
                      className="p-3 rounded-2xl bg-[#0e0420] border border-purple-500/20 hover:border-amber-400/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-800 to-fuchsia-900 text-amber-300 font-black font-mono-crypto text-xs flex items-center justify-center border border-purple-600">
                          L{lvl.level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-200 font-rajdhani uppercase">
                          Tier {lvl.level}
                        </span>
                      </div>

                      {/* Commission % Input */}
                      <div>
                        <label className="text-[8px] text-amber-300 uppercase font-bold block mb-0.5">
                          Commission %
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="30"
                            value={lvl.commissionPercent}
                            onChange={(e) => handleLevelPercentChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#06020c] border border-amber-500/50 rounded-lg py-1 pl-2 pr-5 text-xs font-bold font-mono-crypto text-amber-300 focus:outline-none"
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-amber-400 font-bold font-mono-crypto">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Direct Member Req Input */}
                      <div>
                        <label className="text-[8px] text-purple-300 uppercase font-bold block mb-0.5">
                          Direct Req
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={lvl.directRequirement}
                          onChange={(e) => handleLevelDirectsChange(idx, parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-purple-600/50 rounded-lg py-1 px-2 text-xs font-mono-crypto text-slate-200 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. LIVE INTERACTIVE COMMISSION SIMULATION SANDBOX */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0d031f] via-[#14062d] to-[#0d031f] border-2 border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100 uppercase font-rajdhani">
                        Live Commission Calculator (System Testing Sandbox)
                      </h4>
                      <p className="text-[9px] text-purple-300 font-mono-crypto">
                        Preview the payout generated for each income stream upon a user purchase
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-purple-300 font-mono-crypto">Test Purchase:</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs text-emerald-400 font-bold">$</span>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={testSimAmount}
                        onChange={(e) => setTestSimAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#06020c] border border-emerald-500/50 rounded-lg py-1 pl-6 pr-2 text-xs font-bold font-mono-crypto text-emerald-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Simulator Calculation Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-crypto">
                  <div className="p-2.5 rounded-xl bg-[#090317] border border-amber-500/30">
                    <span className="text-[9px] text-amber-300 uppercase block font-bold">1. Direct Sponsor Bonus</span>
                    <span className="text-sm font-black text-amber-300">
                      ${((testSimAmount * localSystem.directSponsorPercent) / 100).toFixed(2)} USD
                    </span>
                    <span className="text-[8px] text-purple-400 block mt-0.5">
                      ({localSystem.directSponsorPercent}% of ${testSimAmount})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090317] border border-purple-500/30">
                    <span className="text-[9px] text-purple-300 uppercase block font-bold">2. Level 1 Upline</span>
                    <span className="text-sm font-black text-purple-200">
                      ${((testSimAmount * (localLevels[0]?.commissionPercent || 0)) / 100).toFixed(2)} USD
                    </span>
                    <span className="text-[8px] text-purple-400 block mt-0.5">
                      ({localLevels[0]?.commissionPercent || 0}% of ${testSimAmount})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090317] border border-fuchsia-500/30">
                    <span className="text-[9px] text-fuchsia-300 uppercase block font-bold">3. Matrix Parent</span>
                    <span className="text-sm font-black text-fuchsia-300">
                      ${(localMatrix.placementIncomeUsd ?? 1.0).toFixed(2)} USD
                    </span>
                    <span className="text-[8px] text-purple-400 block mt-0.5">
                      (Immediate Parent)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090317] border border-emerald-500/30">
                    <span className="text-[9px] text-emerald-300 uppercase block font-bold">4. Matrix 10 Uplines</span>
                    <span className="text-sm font-black text-emerald-300">
                      ${(((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100) * 10).toFixed(2)} USD
                    </span>
                    <span className="text-[8px] text-purple-400 block mt-0.5">
                      (${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)} x 10 Uplines)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PHASE & PRICE MANAGER                                              */}
          {/* ========================================================================= */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              {/* Summary Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <span className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block">
                    Total Presale Pool
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono-crypto gold-gradient-text">
                    {totalAllocatedTokens.toLocaleString()} NXBC
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <span className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block">
                    Total Target Valuation
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono-crypto text-emerald-400">
                    ${totalTargetUsd.toLocaleString()} USD
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#090316] border border-amber-500/30">
                  <span className="text-[9px] uppercase text-amber-300 font-rajdhani font-semibold block">
                    Current Active Phase
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono-crypto text-amber-300">
                    {localPhases.find((p) => p.status === 'active')?.name || 'None'} (@ $
                    {localPhases.find((p) => p.status === 'active')?.rate.toFixed(2) || '0.00'})
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <span className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block">
                    Sequential Mode
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono-crypto flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Strict Auto-Lock
                  </span>
                </div>
              </div>

              {/* Phase List Table / Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-100 uppercase font-rajdhani tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Set Price and Coin Allotment For Each Phase
                  </h3>
                  <span className="text-[10px] text-purple-400 font-mono-crypto">
                    System changes instantly apply to users
                  </span>
                </div>

                <div className="space-y-2.5">
                  {localPhases.map((phase, idx) => {
                    const isCurrent = phase.status === 'active';
                    const isSoldOut = phase.status === 'completed';
                    const remaining = Math.max(0, phase.totalSupply - phase.tokensSold);
                    const soldPct = phase.totalSupply > 0 ? (phase.tokensSold / phase.totalSupply) * 100 : 0;

                    return (
                      <div
                        key={phase.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-[#1e0d3d] border-amber-400/80 shadow-md'
                            : isSoldOut
                            ? 'bg-[#091515] border-emerald-500/40'
                            : 'bg-[#0c0419] border-purple-500/20'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-500/15">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-purple-900/80 text-amber-300 font-black font-rajdhani text-xs flex items-center justify-center border border-purple-700">
                              {phase.shortName}
                            </span>
                            <input
                              type="text"
                              value={phase.name}
                              onChange={(e) => handlePhaseChange(idx, 'name', e.target.value)}
                              className="bg-[#06020c] border border-purple-500/30 rounded-lg px-2 py-1 text-xs font-bold text-slate-100 w-32 focus:border-amber-400 focus:outline-none"
                            />
                            <select
                              value={phase.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'active' | 'completed' | 'locked';
                                if (newStatus === 'active') {
                                  handleSetActivePhase(phase.id);
                                } else {
                                  handlePhaseChange(idx, 'status', newStatus);
                                }
                              }}
                              className={`text-[10px] font-mono-crypto px-2 py-1 rounded-lg border focus:outline-none ${
                                isCurrent
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                                  : isSoldOut
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                                  : 'bg-purple-950 text-purple-300 border-purple-700/40'
                              }`}
                            >
                              <option value="active">● LIVE ACTIVE</option>
                              <option value="locked">🔒 LOCKED</option>
                              <option value="completed">✓ 100% SOLD OUT</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-purple-300 font-mono-crypto">
                              Sold: {soldPct.toFixed(1)}% ({phase.tokensSold.toLocaleString()} NXBC)
                            </span>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleSetActivePhase(phase.id)}
                                className="px-2 py-0.5 rounded bg-purple-900 hover:bg-amber-500 hover:text-black text-[9px] font-mono-crypto text-purple-200 border border-purple-600 transition-colors"
                              >
                                Set as Live Phase
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Editable Inputs Grid for this Phase */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2.5">
                          {/* Coin Price in USD */}
                          <div>
                            <label className="text-[9px] uppercase text-purple-300/80 font-rajdhani font-semibold block mb-1">
                              Coin Price ($ USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs text-amber-400 font-mono-crypto font-bold">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={phase.rate}
                                onChange={(e) => handlePhaseChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 pl-6 pr-2 text-xs font-bold font-mono-crypto text-amber-300 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Total Supply Allotted */}
                          <div>
                            <label className="text-[9px] uppercase text-purple-300/80 font-rajdhani font-semibold block mb-1">
                              Allotted Coins (Total Supply)
                            </label>
                            <input
                              type="number"
                              step="100000"
                              min="1000"
                              value={phase.totalSupply}
                              onChange={(e) => handlePhaseChange(idx, 'totalSupply', parseInt(e.target.value) || 0)}
                              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2.5 text-xs font-bold font-mono-crypto text-slate-100 focus:outline-none"
                            />
                          </div>

                          {/* Coins Sold Count (Can manually adjust for system testing) */}
                          <div>
                            <label className="text-[9px] uppercase text-purple-300/80 font-rajdhani font-semibold block mb-1">
                              Coins Sold (Current)
                            </label>
                            <input
                              type="number"
                              step="100000"
                              min="0"
                              max={phase.totalSupply}
                              value={phase.tokensSold}
                              onChange={(e) => handlePhaseChange(idx, 'tokensSold', parseInt(e.target.value) || 0)}
                              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2.5 text-xs font-bold font-mono-crypto text-fuchsia-300 focus:outline-none"
                            />
                          </div>

                          {/* Multiplier / Label tag */}
                          <div>
                            <label className="text-[9px] uppercase text-purple-300/80 font-rajdhani font-semibold block mb-1">
                              Multiplier / Tag Text
                            </label>
                            <input
                              type="text"
                              value={phase.multiplier}
                              onChange={(e) => handlePhaseChange(idx, 'multiplier', e.target.value)}
                              className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2.5 text-xs font-mono-crypto text-purple-200 focus:outline-none"
                              placeholder="e.g. 10x Growth"
                            />
                          </div>
                        </div>

                        {/* Valuation Target Footnote */}
                        <div className="mt-2 text-[9px] text-purple-300/70 font-mono-crypto flex justify-between">
                          <span>
                            Total Phase Target Value: <strong>${(phase.totalSupply * phase.rate).toLocaleString()} USD</strong>
                          </span>
                          <span>Remaining Quota: <strong>{remaining.toLocaleString()} NXBC</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RANK & ROYALTY REWARDS CONFIG                                      */}
          {/* ========================================================================= */}
          {activeTab === 'ranks' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase font-rajdhani tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Rank Progression & Lifetime Royalty Pool Share
                  </h3>
                  <p className="text-[9px] text-purple-400 font-mono-crypto">
                    Qualification requirement, one-time cash bonus, reward coins, and monthly royalty % for each rank.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-300 font-mono-crypto">
                    Total Royalty Pool:{' '}
                    <strong className="text-amber-400 font-bold">{totalRoyaltyPercent}% Global</strong>
                  </span>
                </div>
              </div>

              {/* Ranks Cards */}
              <div className="space-y-2.5">
                {localRanks.map((rank, idx) => (
                  <div
                    key={rank.id}
                    className="p-3.5 rounded-2xl bg-[#090317] border border-purple-500/20 hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-500/15">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold font-rajdhani">
                          Tier {rank.rankNumber}
                        </span>
                        <input
                          type="text"
                          value={rank.name}
                          onChange={(e) => handleRankChange(idx, 'name', e.target.value)}
                          className="bg-[#06020c] border border-purple-500/30 rounded-lg px-2 py-1 text-xs font-bold text-slate-100 w-44 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <span className="text-[10px] font-mono-crypto text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        Royalty: {rank.monthlyRoyaltyPercent}% Pool
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {/* Direct Business Required */}
                      <div>
                        <label className="text-[8px] uppercase text-amber-300 font-rajdhani font-semibold block">
                          Direct Business ($ USD)
                        </label>
                        <input
                          type="number"
                          step="5000"
                          min="0"
                          value={rank.requiredDirectVolume || 0}
                          onChange={(e) => handleRankChange(idx, 'requiredDirectVolume', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-amber-500/40 rounded-lg py-1 px-2 text-xs font-mono-crypto text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      {/* Team Business Required */}
                      <div>
                        <label className="text-[8px] uppercase text-purple-300/80 font-rajdhani font-semibold block">
                          Team Business ($ USD)
                        </label>
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={rank.requiredTeamVolume || 0}
                          onChange={(e) => handleRankChange(idx, 'requiredTeamVolume', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-purple-600/40 rounded-lg py-1 px-2 text-xs font-mono-crypto text-slate-200 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      {/* Cash Bonus in USD */}
                      <div>
                        <label className="text-[8px] uppercase text-emerald-400 font-rajdhani font-semibold block">
                          Reward / Fund Value ($)
                        </label>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={rank.oneTimeBonusUsd}
                          onChange={(e) => handleRankChange(idx, 'oneTimeBonusUsd', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-emerald-500/40 rounded-lg py-1 px-2 text-xs font-mono-crypto text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      {/* Reward NXBC Coins */}
                      <div>
                        <label className="text-[8px] uppercase text-amber-300 font-rajdhani font-semibold block">
                          Reward NXBC Coins
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={rank.rewardTokens}
                          onChange={(e) => handleRankChange(idx, 'rewardTokens', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-amber-500/40 rounded-lg py-1 px-2 text-xs font-mono-crypto text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: COIN & SECURITY CONTROLS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#090316] border border-purple-500/20 space-y-3">
                <h3 className="text-xs font-bold text-slate-100 uppercase font-rajdhani tracking-wider">
                  Core Coin Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      Coin Name
                    </label>
                    <input
                      type="text"
                      value={localSystem.tokenName}
                      onChange={(e) => setLocalSystem({ ...localSystem, tokenName: e.target.value })}
                      className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      Coin Symbol
                    </label>
                    <input
                      type="text"
                      value={localSystem.tokenSymbol}
                      onChange={(e) => setLocalSystem({ ...localSystem, tokenSymbol: e.target.value })}
                      className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      Smart Contract Address (BEP-20 / EVM)
                    </label>
                    <input
                      type="text"
                      value={localSystem.contractAddress}
                      onChange={(e) => setLocalSystem({ ...localSystem, contractAddress: e.target.value })}
                      className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-purple-200 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      Receiving Wallet Address (For USDT)
                    </label>
                    <input
                      type="text"
                      value={localSystem.receivingAddress || ''}
                      onChange={(e) => setLocalSystem({ ...localSystem, receivingAddress: e.target.value })}
                      className="w-full bg-[#06020c] border border-amber-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                    Minimum Buy Limit ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={localSystem.minPurchaseUsd}
                    onChange={(e) => setLocalSystem({ ...localSystem, minPurchaseUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                    Maximum Buy Limit ($ USD)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={localSystem.maxPurchaseUsd}
                    onChange={(e) => setLocalSystem({ ...localSystem, maxPurchaseUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#090316] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                    Withdrawal Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={localSystem.withdrawalFeePercent}
                    onChange={(e) => setLocalSystem({ ...localSystem, withdrawalFeePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* P2P Liquidity Setting */}
              <div className="p-3.5 rounded-2xl bg-[#090316] border border-purple-500/20 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase font-rajdhani tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-fuchsia-400" />
                    P2P Liquidity Control (Matched Order Book)
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto mt-1">
                    Defines the ratio of how incoming purchases clear the global user sell queue vs adding to the system treasury. Uses strict FIFO (First-In, First-Out) execution.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      User Sell Queue Share (%)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={20}
                      className="w-full bg-[#150a2e] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-fuchsia-300 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-semibold block mb-1">
                      System Treasury Share (%)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={80}
                      className="w-full bg-[#150a2e] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Presale Pause Switch */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-[#090316] border border-rose-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300 font-rajdhani uppercase flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Emergency Presale Pause Switch
                  </h4>
                  <p className="text-[9px] text-purple-300/80 font-mono-crypto mt-0.5">
                    Temporarily pauses the presale so no new users can purchase coins.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setLocalSystem({ ...localSystem, presalePaused: !localSystem.presalePaused })}
                  className={`px-3 py-1.5 rounded-xl font-mono-crypto text-xs font-bold border transition-all ${
                    localSystem.presalePaused
                      ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {localSystem.presalePaused ? '🛑 PRESALE PAUSED' : '✓ PRESALE ACTIVE'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-purple-500/20 bg-[#0c0419] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] text-purple-300/70 font-mono-crypto">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>System Control Engine: Real-Time Dynamic Sync</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-600/40 text-purple-200 text-xs font-mono-crypto transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:opacity-95 text-black font-black text-xs font-rajdhani uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 text-black" />
              <span>Apply & Save All Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
