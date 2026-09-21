import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Coins,
  DollarSign,
  Users,
  Layers,
  Award,
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Database,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Terminal,
  HelpCircle,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  PhaseConfig,
  ReferralLevel,
  RankReward,
  AdminSystemConfig,
  MatrixConfig,
  QueueEntry,
} from '../types/crypto';

interface SecretAdminPageProps {
  phases: PhaseConfig[];
  referralLevels: ReferralLevel[];
  rankRewards: RankReward[];
  systemConfig: AdminSystemConfig;
  matrixConfig: MatrixConfig;
  sellQueue?: QueueEntry[];
  onUpdatePhases: (phases: PhaseConfig[]) => void;
  onUpdateReferralLevels: (levels: ReferralLevel[]) => void;
  onUpdateRankRewards: (ranks: RankReward[]) => void;
  onUpdateSystemConfig: (config: AdminSystemConfig) => void;
  onUpdateMatrixConfig: (config: MatrixConfig) => void;
  onUpdateSellQueue?: (queue: QueueEntry[]) => void;
  onSimulateExternalBuy?: (amount: number) => void;
  onResetToDefaults: () => void;
  onExitAdmin: () => void;
}

type AdminSection =
  | 'overview'
  | 'phases'
  | 'sponsor'
  | 'levels'
  | 'matrix'
  | 'ranks'
  | 'token_security';

export const SecretAdminPage: React.FC<SecretAdminPageProps> = ({
  phases,
  referralLevels,
  rankRewards,
  systemConfig,
  matrixConfig,
  sellQueue = [],
  onUpdatePhases,
  onUpdateReferralLevels,
  onUpdateRankRewards,
  onUpdateSystemConfig,
  onUpdateMatrixConfig,
  onUpdateSellQueue,
  onSimulateExternalBuy,
  onResetToDefaults,
  onExitAdmin,
}) => {
  // Secret Authentication Gate - Strictly Locked by default
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  // Password / PIN Change Form State
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // Navigation state
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Editable local state copies initialized from persistent storage
  const [localPhases, setLocalPhases] = useState<PhaseConfig[]>(phases);
  const [localLevels, setLocalLevels] = useState<ReferralLevel[]>(referralLevels);
  const [localRanks, setLocalRanks] = useState<RankReward[]>(rankRewards);
  const [localSystem, setLocalSystem] = useState<AdminSystemConfig>(systemConfig);
  
  const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);
  
  





  // Always load the authoritative admin configuration after authentication.
  // This prevents stale localStorage/parent state from overwriting live DB values
  // such as phase tokens sold and withdrawal fee.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('nxbc_admin_token') : null;
        const res = await fetch('/api/admin/configs', {
          headers: token ? { 'x-admin-token': token } : {},
        });
        const data = await res.json();
        if (cancelled || !data?.success) return;
        if (Array.isArray(data.phases) && data.phases.length) setLocalPhases(data.phases);
        if (Array.isArray(data.referralLevels) && data.referralLevels.length) setLocalLevels(data.referralLevels);
        if (Array.isArray(data.rankRewards) && data.rankRewards.length) setLocalRanks(data.rankRewards);
        if (data.systemConfig && typeof data.systemConfig === 'object') setLocalSystem((prev) => ({ ...prev, ...data.systemConfig }));
        if (data.matrixConfig && typeof data.matrixConfig === 'object') setLocalMatrix(data.matrixConfig);
      } catch (err) {
        console.error('[ADMIN] Failed to load live configuration:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Simulation test amount
  const [simBuyAmount, setSimBuyAmount] = useState<number>(500);
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Auth Handler - Strictly validates PIN without exposing password
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = enteredPin.trim();

    // Authentication is server-side only. Never accept a browser/localStorage PIN as proof of admin access.
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      const data = await res.json();
      if (data.success && data.adminToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nxbc_admin_token', data.adminToken);
          localStorage.removeItem('nxbc_admin_custom_pin');
        }
        setIsAuthenticated(true);
        setPinError('');
        return;
      }
    } catch (err) {}

    // Security Rule: NEVER reveal the real PIN in the error message!
    setPinError('Incorrect Security PIN. Access Denied.');
  };

  // Change Admin PIN Handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    const cleanCurrent = currentPinInput.trim();
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!cleanNew || cleanNew.length < 4) {
      setPinChangeError('New PIN must be at least 4 characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinChangeError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsChangingPin(true);
    // Call server to persist PIN change across all sessions
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('nxbc_admin_token') ? { 'x-admin-token': localStorage.getItem('nxbc_admin_token') as string } : {}),
        },
        body: JSON.stringify({ currentPin: cleanCurrent, newPin: cleanNew }),
      });
      const data = await res.json();
      if (data.success) {
        setPinChangeSuccess('Master Admin PIN successfully updated and secured!');
      } else {
        setPinChangeError(data.error || 'PIN update failed.');
        return;
      }
    } catch (err) {
      setPinChangeError('Server unavailable. PIN was not changed.');
    } finally {
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => setPinChangeSuccess(''), 5000);
    }
  };

  // Level Handlers
  const handleLevelPercentChange = (index: number, percent: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], commissionPercent: percent };
    setLocalLevels(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_levels', JSON.stringify(updated));
    }
  };

  const handleLevelDirectsChange = (index: number, directs: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], directRequirement: directs };
    setLocalLevels(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_levels', JSON.stringify(updated));
    }
  };

  // Rank Handlers
  const handleRankChange = (
    index: number,
    field: keyof RankReward,
    value: string | number
  ) => {
    const updated = [...localRanks];
    updated[index] = { ...updated[index], [field]: value };
    setLocalRanks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_ranks', JSON.stringify(updated));
    }
  };

  const handleAddRank = () => {
    const nextRankNumber = localRanks.length + 1;
    const newRank: RankReward = {
      id: `rank_${Date.now()}`,
      rankNumber: nextRankNumber,
      name: `VIP Tier ${nextRankNumber}`,
      requiredDirectVolume: 10000 * nextRankNumber,
      requiredTeamVolume: 25000 * nextRankNumber,
      rewardTitle: `$${500 * nextRankNumber} Leadership Fund`,
      oneTimeBonusUsd: 500 * nextRankNumber,
      rewardTokens: 25000 * nextRankNumber,
      monthlyRoyaltyPercent: 1.0,
      currentQualifiedCount: 0,
      status: 'locked',
    };
    const updated = [...localRanks, newRank];
    setLocalRanks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_ranks', JSON.stringify(updated));
    }
  };

  const handleDeleteRank = (index: number) => {
    if (confirm(`Are you sure you want to delete Tier ${localRanks[index].rankNumber} (${localRanks[index].name})?`)) {
      const updated = localRanks.filter((_, i) => i !== index).map((r, i) => ({ ...r, rankNumber: i + 1 }));
      setLocalRanks(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nxbc_admin_ranks', JSON.stringify(updated));
      }
    }
  };

  // System Config Helper
  const handleUpdateSystem = (partial: Partial<AdminSystemConfig>) => {
    const updated = { ...localSystem, ...partial };
    setLocalSystem(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_system', JSON.stringify(updated));
    }
  };

  // Matrix Config Helper
  const handleUpdateMatrix = (partial: Partial<MatrixConfig>) => {
    const updated = { ...localMatrix, ...partial };
    setLocalMatrix(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_matrix', JSON.stringify(updated));
    }
  };

  // Save only approved dynamic controls. Blockchain-authoritative phase data is never written from this page.
  const handleSaveAll = async () => {
    onUpdateReferralLevels(localLevels);
    onUpdateRankRewards(localRanks);
    onUpdateSystemConfig({ ...localSystem, matrixConfig: localMatrix });
    onUpdateMatrixConfig(localMatrix);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_levels', JSON.stringify(localLevels));
      localStorage.setItem('nxbc_admin_ranks', JSON.stringify(localRanks));
      localStorage.setItem('nxbc_admin_system', JSON.stringify(localSystem));
      localStorage.setItem('nxbc_admin_matrix', JSON.stringify(localMatrix));
    }

    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('nxbc_admin_token') ? { 'x-admin-token': localStorage.getItem('nxbc_admin_token') as string } : {}),
        },
        body: JSON.stringify({
          referralLevels: localLevels,
          rankRewards: localRanks,
          systemConfig: localSystem,
          matrixConfig: localMatrix,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Settings save failed');
      setSaveSuccessMsg('✓ Safe settings saved & live-updated.');
    } catch (err: any) {
      setSaveSuccessMsg(`✕ Save failed: ${err?.message || 'Server unavailable'}`);
    }
    setTimeout(() => setSaveSuccessMsg(''), 5000);
  };

  // Calculations
  const totalLevelPercent = localLevels.reduce(
    (acc, lvl) => acc + (lvl.commissionPercent || 0),
    0
  );
  const totalPresaleTokens = localPhases.reduce(
    (acc, p) => acc + (p.totalSupply || 0),
    0
  );
  const activePhase = localPhases.find((p) => p.status === 'active') || localPhases[0];

  // =========================================================================
  // PIN LOCK SCREEN (IF LOCKED)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070211] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#100624] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-100 font-cinzel tracking-wider">
              SECRET MANAGER VAULT
            </h2>
            <p className="text-xs text-purple-300/80 font-mono-crypto mt-1">
              Protected Master Control Center &bull; NXBC Smart Contract
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-amber-300 font-rajdhani font-bold uppercase tracking-wider block">
                Enter Master Secret PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#06020c] border-2 border-amber-500/50 focus:border-amber-400 rounded-2xl py-3 text-center text-2xl font-black font-mono-crypto text-amber-300 tracking-[0.5em] focus:outline-none"
                autoFocus
              />
              {pinError && (
                <span className="text-[11px] text-rose-400 font-mono-crypto font-bold block pt-1">
                  {pinError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-black text-sm font-rajdhani uppercase tracking-wider shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              Verify Security Key & Unlock
            </button>

            <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-[10px] text-purple-400/80 font-mono-crypto">
                🔒 Protected Master Console
              </span>

              <button
                type="button"
                onClick={onExitAdmin}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono-crypto"
              >
                Exit to App &rarr;
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED SECRET ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#070211] text-slate-100 flex flex-col font-['Outfit',sans-serif]">
      {/* Top Admin Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-[#0d041c]/95 backdrop-blur-xl border-b border-amber-500/30 px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            className="p-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700/50 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-rajdhani font-bold uppercase"
            title="Return to Presale App"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit to App</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-amber-300 font-cinzel tracking-wider">
                  NXBC MASTER SYSTEM CONTROL CENTER
                </h1>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-mono-crypto font-bold bg-amber-500 text-black">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-[10px] text-purple-300 font-mono-crypto hidden sm:block">
                Presale Prices &bull; Direct Sponsor &bull; 10-Level Plan &bull; 2x2 Matrix &bull; Ranks &bull; Security
              </p>
            </div>
          </div>
        </div>

        {/* Global Save & Actions */}
        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-mono-crypto text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:opacity-95 text-black font-black text-xs sm:text-sm font-rajdhani uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 text-black" />
            <span>Apply & Save All Live</span>
          </button>

          <button
            onClick={() => { localStorage.removeItem('nxbc_admin_token'); setIsAuthenticated(false); }}
            className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-purple-300 text-xs"
            title="Lock System Vault"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Body with Left Sidebar + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-2 sm:p-4 gap-4">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-[#0d041c] border border-purple-500/20 rounded-3xl p-3 space-y-1.5 shadow-lg flex md:flex-col overflow-x-auto md:overflow-x-visible">
          <div className="hidden md:block pb-2 mb-1 border-b border-purple-500/20 px-2">
            <span className="text-[10px] uppercase text-purple-400 font-mono-crypto font-bold tracking-wider">
              Control Modules
            </span>
          </div>

          <button
            onClick={() => setActiveSection('overview')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border border-amber-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>1. Master Overview</span>
          </button>

          <button
            onClick={() => setActiveSection('phases')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'phases'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border border-amber-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>2. Coin Price & 5 Phases</span>
          </button>

          <button
            onClick={() => setActiveSection('sponsor')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'sponsor'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border border-amber-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>3. Direct Sponsor Income</span>
          </button>

          <button
            onClick={() => setActiveSection('levels')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'levels'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border border-amber-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>4. Level 1 to 10 Plan</span>
          </button>

          <button
            onClick={() => setActiveSection('matrix')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'matrix'
                ? 'bg-gradient-to-r from-fuchsia-600/20 to-purple-900/50 text-fuchsia-300 border border-fuchsia-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Layers className="w-4 h-4 text-fuchsia-400" />
            <span>5. 2x2 Matrix Placement</span>
          </button>

          <button
            onClick={() => setActiveSection('ranks')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'ranks'
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-900/50 text-amber-300 border border-amber-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>6. Rank & Royalty Rewards</span>
          </button>

          <button
            onClick={() => setActiveSection('token_security')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'token_security'
                ? 'bg-gradient-to-r from-purple-600/20 to-purple-900/50 text-purple-200 border border-purple-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>7. Contract & Security</span>
          </button>

        </aside>

        {/* Right Dynamic Content Container */}
        <main className="flex-1 bg-[#0d041c] border border-purple-500/20 rounded-3xl p-4 sm:p-6 space-y-6 shadow-xl overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* 1. MASTER OVERVIEW SUMMARY                                                */}
          {/* ========================================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-[#0b0318] border-2 border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-lg">
                    👑
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-100 font-cinzel">
                      NXBC Master Control Dashboard
                    </h2>
                    <p className="text-xs text-purple-200 font-mono-crypto">
                      System parameters are live and fully synced with smart contract presets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono-crypto font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ● Smart Engine Synchronized
                  </span>
                </div>
              </div>

              {/* 4 Stat Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#120626] border border-amber-500/30 space-y-1">
                  <span className="text-[10px] uppercase text-amber-300 font-rajdhani font-bold block">
                    Active Phase
                  </span>
                  <span className="text-base font-black font-mono-crypto text-amber-300">
                    {activePhase.name}
                  </span>
                  <span className="text-xs text-purple-300 font-mono-crypto block">
                    @ ${activePhase.rate.toFixed(2)} USD
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/30 space-y-1">
                  <span className="text-[10px] uppercase text-purple-300 font-rajdhani font-bold block">
                    Direct Sponsor Bonus
                  </span>
                  <span className="text-base font-black font-mono-crypto text-slate-100">
                    {localSystem.directSponsorPercent}%
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono-crypto block">
                    Instant Referral Bonus
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#120626] border border-fuchsia-500/30 space-y-1">
                  <span className="text-[10px] uppercase text-fuchsia-300 font-rajdhani font-bold block">
                    Matrix Placement
                  </span>
                  <span className="text-base font-black font-mono-crypto text-fuchsia-300">
                    ${(localMatrix.placementIncomeUsd ?? 1.0).toFixed(2)} USD
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono-crypto block">
                    + {localMatrix.uplineSharePercent}% to 10 Uplines
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#120626] border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] uppercase text-emerald-300 font-rajdhani font-bold block">
                    10-Level Payout Sum
                  </span>
                  <span className="text-base font-black font-mono-crypto text-emerald-300">
                    {totalLevelPercent.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono-crypto block">
                    Across Level 1 to 10
                  </span>
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="p-4 rounded-3xl bg-[#120626] border border-purple-500/20 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-rajdhani tracking-wider">
                  Quick Navigation Shortcuts
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setActiveSection('phases')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Coins className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">Phase & Price</span>
                    <span className="text-[9px] text-purple-400">Manage 5 presale rates</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('sponsor')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">Sponsor Income</span>
                    <span className="text-[9px] text-purple-400">Direct referral reward %</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('levels')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Users className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">10-Level Plan</span>
                    <span className="text-[9px] text-purple-400">L1-L10 % & directs req</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('matrix')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Layers className="w-5 h-5 text-fuchsia-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">2x2 Matrix</span>
                    <span className="text-[9px] text-purple-400">Placement & 10 uplines</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('ranks')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Award className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">Ranks & Royalty</span>
                    <span className="text-[9px] text-purple-400">6 VIP rank rewards</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('token_security')}
                    className="p-3 rounded-xl bg-[#090317] hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                  >
                    <Settings className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100 block">Security & Pausing</span>
                    <span className="text-[9px] text-purple-400">Contract & emergency switch</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. COIN PRICE & 5-PHASE MANAGER                                          */}
          {/* ========================================================================= */}
          {activeSection === 'phases' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-amber-300 font-cinzel uppercase flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Presale Phases — Read Only
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Price, allocation, sold amount and active phase are controlled by the live presale state. No manual phase switching or supply editing is allowed here.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-mono-crypto font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  BLOCKCHAIN / SERVER AUTHORITATIVE
                </span>
              </div>
              <div className="space-y-3">
                {localPhases.map((phase) => {
                  const remaining = Math.max(0, Number(phase.totalSupply || 0) - Number(phase.tokensSold || 0));
                  const soldPct = Number(phase.totalSupply || 0) > 0 ? (Number(phase.tokensSold || 0) / Number(phase.totalSupply || 0)) * 100 : 0;
                  return (
                    <div key={phase.id} className={`p-4 rounded-3xl border-2 ${phase.status === 'active' ? 'bg-gradient-to-r from-[#210c42] to-[#120629] border-amber-400' : phase.status === 'completed' ? 'bg-[#091515] border-emerald-500/50' : 'bg-[#0e0420] border-purple-500/20'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 font-black font-rajdhani text-sm flex items-center justify-center border border-purple-700">{phase.shortName}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-100">{phase.name}</div>
                            <div className="text-[8px] text-purple-400 font-mono-crypto">{phase.unlockRequirement}</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-mono-crypto font-bold border ${phase.status === 'active' ? 'bg-amber-500/20 text-amber-300 border-amber-400' : phase.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border-emerald-500' : 'bg-purple-950 text-purple-300 border-purple-700'}`}>
                          {phase.status === 'active' ? '● LIVE ACTIVE PHASE' : phase.status === 'completed' ? '✓ SOLD OUT' : 'LOCKED / UPCOMING'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20"><div className="text-[8px] uppercase text-amber-300">Price</div><div className="text-sm font-black text-amber-300 font-mono-crypto">${Number(phase.rate || 0).toFixed(2)}</div></div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-purple-500/20"><div className="text-[8px] uppercase text-purple-300">Allocation</div><div className="text-sm font-black text-slate-100 font-mono-crypto">{Number(phase.totalSupply || 0).toLocaleString()} NXBC</div></div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-emerald-500/20"><div className="text-[8px] uppercase text-emerald-300">Purchased</div><div className="text-sm font-black text-emerald-300 font-mono-crypto">{Number(phase.tokensSold || 0).toLocaleString()} NXBC</div></div>
                        <div className="p-2.5 rounded-xl bg-black/20 border border-cyan-500/20"><div className="text-[8px] uppercase text-cyan-300">Remaining</div><div className="text-sm font-black text-cyan-300 font-mono-crypto">{remaining.toLocaleString()} NXBC</div></div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-black/30 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, soldPct))}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'sponsor' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-purple-500/20">
                <h3 className="text-sm font-black text-amber-300 font-cinzel uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Direct Sponsor Income (Instant Referral Bonus)
                </h3>
                <p className="text-[10px] text-purple-300 font-mono-crypto">
                  The percentage of reward the direct inviter receives when a user buys a coin via their referral link.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#120626] border-2 border-amber-500/30 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-amber-300 font-rajdhani font-bold block">
                    Direct Sponsor Percentage (%)
                  </label>
                  <div className="relative max-w-sm">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={localSystem.directSponsorPercent}
                      onChange={(e) =>
                        handleUpdateSystem({
                          directSponsorPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#06020c] border-2 border-amber-500/60 focus:border-amber-400 rounded-2xl py-3 pl-4 pr-10 text-xl font-black font-mono-crypto text-amber-300 focus:outline-none"
                    />
                    <span className="absolute right-4 top-3 text-lg text-amber-400 font-bold font-mono-crypto">
                      %
                    </span>
                  </div>
                </div>

                {/* Minimum Cumulative MLM Qualification Setting */}
                <div className="space-y-2 pt-3 border-t border-purple-500/20">
                  <label className="text-xs uppercase text-amber-300 font-rajdhani font-bold block">
                    Minimum Cumulative MLM Qualification Threshold (USD)
                  </label>
                  <div className="relative max-w-sm">
                    <input
                      type="number"
                      step="5"
                      min="10"
                      max="1000"
                      value={localSystem.minMlmQualifyUsd || 100}
                      onChange={(e) =>
                        handleUpdateSystem({
                          minMlmQualifyUsd: parseFloat(e.target.value) || 100,
                        })
                      }
                      className="w-full bg-[#06020c] border-2 border-amber-500/60 focus:border-amber-400 rounded-2xl py-3 pl-8 pr-4 text-xl font-black font-mono-crypto text-amber-300 focus:outline-none"
                    />
                    <span className="absolute left-4 top-3 text-lg text-amber-400 font-bold font-mono-crypto">
                      $
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-300/80 font-mono-crypto">
                    *Users with total purchases &lt; ${localSystem.minMlmQualifyUsd || 100} act solely as token investors. Reaching ${localSystem.minMlmQualifyUsd || 100} (cumulative) automatically activates 10-level MLM commissions and upline bonuses.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#080214] border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani">
                    Current Rule & Payout Example:
                  </h4>
                  <ul className="text-xs text-purple-200 font-mono-crypto space-y-1 list-disc list-inside">
                    <li>
                      For every $100 in direct coin purchases, the inviter is instantly credited <strong>${((100 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> to their wallet.
                    </li>
                    <li>
                      For every $1,000 purchase, <strong>${((1000 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> will be credited.
                    </li>
                    <li>
                      The direct sponsor bonus is instantly credited to the user's claimable wallet balance and is available for immediate withdrawal.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. LEVEL 1 SE LEVEL 10 TAK COMMISSION PLAN                                */}
          {/* ========================================================================= */}
          {activeSection === 'levels' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-amber-300 font-cinzel uppercase flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Level 1 Se Level 10 Tak Referral Commission & Direct Requirement
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Set the percentage (%) and the required active direct referrals to unlock each level
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-700 text-xs font-mono-crypto">
                  <span className="text-purple-300">Total 10 Levels Payout: </span>
                  <strong className="text-amber-300 font-bold">{totalLevelPercent.toFixed(1)}%</strong>
                </div>
              </div>

              {/* 10 Level Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {localLevels.map((lvl, idx) => (
                  <div
                    key={lvl.level}
                    className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/30 hover:border-amber-400/60 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-800 to-fuchsia-900 text-amber-300 font-black font-mono-crypto text-xs flex items-center justify-center border border-purple-600">
                        L{lvl.level}
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-rajdhani uppercase">
                        Level {lvl.level}
                      </span>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase text-amber-300 font-bold block mb-1">
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
                          className="w-full bg-[#06020c] border border-amber-500/50 rounded-xl py-1.5 pl-2 pr-6 text-xs font-black font-mono-crypto text-amber-300 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-amber-400 font-bold font-mono-crypto">
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
                        Direct Member Req
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={lvl.directRequirement}
                        onChange={(e) => handleLevelDirectsChange(idx, parseInt(e.target.value) || 0)}
                        className="w-full bg-[#06020c] border border-purple-600/50 rounded-xl py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. 2x2 MATRIX PLACEMENT ENGINE                                            */}
          {/* ========================================================================= */}
          {activeSection === 'matrix' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-fuchsia-300 font-cinzel uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-fuchsia-400" />
                    2x2 Auto-Placement Matrix & 10-Level Distribution
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Zero Entry Fee &bull; Immediate Parent Placement + 10-Level Split Tree
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalMatrix({ ...localMatrix, enabled: !localMatrix.enabled })}
                    className="flex items-center gap-1.5 text-xs font-mono-crypto text-purple-200"
                  >
                    {localMatrix.enabled ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ToggleRight className="w-7 h-7" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-purple-400 flex items-center gap-1">
                        <ToggleLeft className="w-7 h-7" /> DISABLED
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Zero Fee & Zero Cycle Deduction Notice */}
              <div className="p-3.5 rounded-2xl bg-[#090317] border border-emerald-500/40 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono-crypto text-purple-200">
                  <span className="text-emerald-300 font-bold block mb-0.5 font-rajdhani uppercase text-sm">
                    100% Free Auto-Placement Engine
                  </span>
                  Users do not pay any extra entry fees for the matrix, and there are no cycle completion deductions. Users are placed in the matrix automatically upon any coin purchase.
                </div>
              </div>

              {/* Matrix Control Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-[#120626] border-2 border-amber-500/30 space-y-2">
                  <label className="text-xs uppercase text-amber-300 font-rajdhani font-bold block">
                    Matrix Direct Placement Income ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-amber-400 font-bold font-mono-crypto">$</span>
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
                      className="w-full bg-[#06020c] border border-amber-500/50 rounded-2xl py-2.5 pl-7 pr-3 text-base font-black font-mono-crypto text-amber-300 focus:outline-none"
                    />
                  </div>
                  <span className="text-[9px] text-purple-400 font-mono-crypto block">
                    The immediate parent (under whom the new user is directly placed) will instantly receive this ${localMatrix.placementIncomeUsd ?? 1.0} USD 
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-[#120626] border-2 border-fuchsia-500/30 space-y-2">
                  <label className="text-xs uppercase text-fuchsia-300 font-rajdhani font-bold block">
                    10-Level Upline Placement Distribution (%)
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
                      className="w-full bg-[#06020c] border border-fuchsia-500/50 rounded-2xl py-2.5 pl-3 pr-8 text-base font-black font-mono-crypto text-fuchsia-300 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-fuchsia-400 font-bold font-mono-crypto">
                      % / Level
                    </span>
                  </div>
                  <span className="text-[9px] text-purple-400 font-mono-crypto block">
                    From the placement income (${localMatrix.placementIncomeUsd ?? 1.0}), {localMatrix.uplineSharePercent ?? 10}% (${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)}) will be equally distributed to all 10 upline levels.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. RANK & ROYALTY REWARDS                                                 */}
          {/* ========================================================================= */}
          {activeSection === 'ranks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                <div>
                  <h3 className="text-sm font-black text-amber-300 font-cinzel uppercase flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    VIP Rank Rewards & Leadership Royalty Pool
                  </h3>
                  <p className="text-[10px] text-cyan-300 font-mono-crypto">
                    Dynamic Ranks: Set qualification direct requirements, team volume, cash bonuses, and royalty share
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#081426] border border-cyan-700/50 text-xs font-mono-crypto">
                    <span className="text-cyan-300">Royalty Pool: </span>
                    <strong className="text-amber-300 font-bold">
                      ${localSystem.royaltyPoolUsd?.toLocaleString() || '25,000'} USD
                    </strong>
                  </div>

                  <button
                    onClick={handleAddRank}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-rajdhani font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Rank</span>
                  </button>
                </div>
              </div>

              {/* Rank Cards */}
              <div className="space-y-3">
                {localRanks.map((rank, idx) => (
                  <div
                    key={rank.id}
                    className="p-4 rounded-3xl bg-[#081426] border border-cyan-500/30 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/40">
                          #{rank.rankNumber}
                        </span>
                        <input
                          type="text"
                          value={rank.name}
                          onChange={(e) => handleRankChange(idx, 'name', e.target.value)}
                          placeholder="Rank Title"
                          className="bg-[#050b16] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-100 w-44 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-[#050b16] px-2.5 py-1 rounded-xl border border-cyan-500/30">
                          <span className="text-[10px] text-cyan-300 font-mono-crypto">Royalty Share:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={rank.monthlyRoyaltyPercent || 0}
                            onChange={(e) => handleRankChange(idx, 'monthlyRoyaltyPercent', parseFloat(e.target.value) || 0)}
                            className="w-12 bg-transparent text-amber-300 font-bold text-xs font-mono-crypto focus:outline-none text-right"
                          />
                          <span className="text-[10px] text-amber-300 font-mono-crypto">%</span>
                        </div>

                        {localRanks.length > 1 && (
                          <button
                            onClick={() => handleDeleteRank(idx)}
                            className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 hover:text-white transition-colors cursor-pointer"
                            title="Delete this rank"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] uppercase text-amber-300 font-bold block mb-1">
                          Direct Business ($ USD)
                        </label>
                        <input
                          type="number"
                          step="5000"
                          min="0"
                          value={rank.requiredDirectVolume || 0}
                          onChange={(e) => handleRankChange(idx, 'requiredDirectVolume', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050b16] border border-amber-500/50 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-amber-300 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-cyan-300 font-bold block mb-1">
                          Team Business ($ USD)
                        </label>
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={rank.requiredTeamVolume || 0}
                          onChange={(e) => handleRankChange(idx, 'requiredTeamVolume', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050b16] border border-cyan-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-emerald-400 font-bold block mb-1">
                          Reward Value ($ USD)
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={rank.oneTimeBonusUsd}
                          onChange={(e) => handleRankChange(idx, 'oneTimeBonusUsd', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050b16] border border-emerald-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-emerald-300 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-amber-300 font-bold block mb-1">
                          Reward NXBC Coins
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={rank.rewardTokens}
                          onChange={(e) => handleRankChange(idx, 'rewardTokens', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050b16] border border-amber-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-amber-300 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. SMART CONTRACT & SECURITY CONTROLS                                     */}
          {/* ========================================================================= */}
          {activeSection === 'token_security' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-purple-500/20">
                <h3 className="text-sm font-black text-purple-300 font-cinzel uppercase flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Security & Safe System Controls
                </h3>
                <p className="text-[10px] text-purple-300 font-mono-crypto">Only safe operational controls are editable. Contract addresses, token parameters, phase data and payment routing are not editable here.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#13062b] to-[#0d031c] border-2 border-amber-500/40 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black"><KeyRound className="w-4 h-4" /></div>
                    <div><h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani tracking-wider">Master Admin Security PIN</h4><p className="text-[10px] text-purple-300/80 font-mono-crypto">Change the secret admin access PIN.</p></div>
                  </div>
                </div>
                <form onSubmit={handleChangePin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className="text-[9px] uppercase text-purple-300 font-rajdhani font-bold block mb-1">Current PIN</label><input type="password" value={currentPinInput} onChange={(e) => setCurrentPinInput(e.target.value)} className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:outline-none" /></div>
                    <div><label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block mb-1">New PIN</label><input type="password" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} className="w-full bg-[#06020c] border border-amber-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 focus:outline-none" /></div>
                    <div><label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block mb-1">Confirm PIN</label><input type="password" value={confirmPinInput} onChange={(e) => setConfirmPinInput(e.target.value)} className="w-full bg-[#06020c] border border-amber-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 focus:outline-none" /></div>
                  </div>
                  {pinChangeError && <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono-crypto">{pinChangeError}</div>}
                  {pinChangeSuccess && <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono-crypto">{pinChangeSuccess}</div>}
                  <div className="flex justify-end"><button type="submit" disabled={isChangingPin} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-rajdhani font-bold text-xs disabled:opacity-50">{isChangingPin ? 'Updating PIN...' : 'Update PIN'}</button></div>
                </form>
              </div>

              <div className="p-4 rounded-3xl bg-[#120626] border border-cyan-500/20 space-y-3">
                <div><label className="text-[9px] uppercase text-cyan-300 font-bold block">Social Media Links</label><p className="text-[9px] text-purple-300/80 font-mono-crypto">Stored in PostgreSQL and shown live on the user frontend.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([['x','X / Twitter URL'],['youtube','YouTube URL'],['telegram','Telegram URL'],['facebook','Facebook URL']] as const).map(([key,label]) => (
                    <div key={key}><label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">{label}</label><input type="url" value={localSystem.socialLinks?.[key] || ''} onChange={(e) => handleUpdateSystem({ socialLinks: { ...(localSystem.socialLinks || {}), [key]: e.target.value } })} className="w-full bg-[#06020c] border border-cyan-500/30 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:outline-none" /></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">Withdrawal Fee (%)</label>
                  <input type="number" min="0" max="20" step="0.5" value={localSystem.withdrawalFeePercent} onChange={(e) => handleUpdateSystem({ withdrawalFeePercent: parseFloat(e.target.value) || 0 })} className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold focus:outline-none" />
                </div>
                <div className="p-3.5 rounded-2xl bg-[#120626] border border-cyan-500/20">
                  <label className="text-[9px] uppercase text-cyan-300 font-bold block mb-1">FIFO Seller Share (%)</label>
                  <input type="number" min="0" max="100" step="1" value={Number.isFinite(Number(localSystem.sellQueueSharePercent)) ? localSystem.sellQueueSharePercent : 20} onChange={(e) => {
                    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    handleUpdateSystem({ sellQueueSharePercent: value });
                  }} className="w-full bg-[#06020c] border border-cyan-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-cyan-300 font-bold focus:outline-none" />
                  <p className="text-[8px] text-purple-300/80 font-mono-crypto mt-1">Company share automatically: {100 - (Number(localSystem.sellQueueSharePercent) || 0)}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-[#090316] border border-rose-500/40 flex items-center justify-between"><div><h4 className="text-xs font-bold text-rose-300 font-rajdhani uppercase">Emergency Presale Pause</h4><p className="text-[9px] text-purple-300/80 font-mono-crypto mt-0.5">Temporarily pauses new purchases.</p></div><button type="button" onClick={() => setLocalSystem({ ...localSystem, presalePaused: !localSystem.presalePaused })} className={`px-4 py-2 rounded-xl font-mono-crypto text-xs font-bold border ${localSystem.presalePaused ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'}`}>{localSystem.presalePaused ? '🛑 PAUSED' : '✓ ACTIVE'}</button></div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. LIVE REVENUE & COMMISSION SIMULATOR                                     */}
          {/* ========================================================================= */}
                  </main>
      </div>
    </div>
  );
};
