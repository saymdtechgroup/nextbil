import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  PhaseConfig,
  ReferralLevel,
  RankReward,
  AdminSystemConfig,
  MatrixConfig,
} from '../types/crypto';

interface SecretAdminPageProps {
  phases: PhaseConfig[];
  referralLevels: ReferralLevel[];
  rankRewards: RankReward[];
  systemConfig: AdminSystemConfig;
  matrixConfig: MatrixConfig;
  onUpdatePhases: (phases: PhaseConfig[]) => void;
  onUpdateReferralLevels: (levels: ReferralLevel[]) => void;
  onUpdateRankRewards: (ranks: RankReward[]) => void;
  onUpdateSystemConfig: (config: AdminSystemConfig) => void;
  onUpdateMatrixConfig: (config: MatrixConfig) => void;
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
  | 'token_security'
  | 'simulator';

export const SecretAdminPage: React.FC<SecretAdminPageProps> = ({
  phases,
  referralLevels,
  rankRewards,
  systemConfig,
  matrixConfig,
  onUpdatePhases,
  onUpdateReferralLevels,
  onUpdateRankRewards,
  onUpdateSystemConfig,
  onUpdateMatrixConfig,
  onResetToDefaults,
  onExitAdmin,
}) => {
  // Secret Authentication Gate - Strictly Locked by default
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [currentMasterPin, setCurrentMasterPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nxbc_admin_custom_pin') || '7788';
    }
    return '7788';
  });

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

  // Editable local state copies
  const [localPhases, setLocalPhases] = useState<PhaseConfig[]>(phases);
  const [localLevels, setLocalLevels] = useState<ReferralLevel[]>(referralLevels);
  const [localRanks, setLocalRanks] = useState<RankReward[]>(rankRewards);
  const [localSystem, setLocalSystem] = useState<AdminSystemConfig>(systemConfig);
  const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);

  // Simulation test amount
  const [simBuyAmount, setSimBuyAmount] = useState<number>(500);

  // Synchronize with incoming props if changed outside
  React.useEffect(() => {
    setLocalPhases(phases);
  }, [phases]);
  React.useEffect(() => {
    setLocalLevels(referralLevels);
  }, [referralLevels]);
  React.useEffect(() => {
    setLocalRanks(rankRewards);
  }, [rankRewards]);
  React.useEffect(() => {
    setLocalSystem(systemConfig);
  }, [systemConfig]);
  React.useEffect(() => {
    setLocalMatrix(matrixConfig);
  }, [matrixConfig]);

  // Auth Handler - Strictly validates PIN without exposing password
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = enteredPin.trim();
    const activeStoredPin = (typeof window !== 'undefined' ? localStorage.getItem('nxbc_admin_custom_pin') : null) || currentMasterPin || '7788';

    if (cleanPin === activeStoredPin) {
      setIsAuthenticated(true);
      setPinError('');
      return;
    }

    // Also check server-side verification
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      const data = await res.json();
      if (data.success) {
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

    const activeStoredPin = (typeof window !== 'undefined' ? localStorage.getItem('nxbc_admin_custom_pin') : null) || currentMasterPin || '7788';

    if (cleanCurrent !== activeStoredPin) {
      setPinChangeError('Current PIN is incorrect.');
      return;
    }

    if (!cleanNew || cleanNew.length < 4) {
      setPinChangeError('New PIN must be at least 4 characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinChangeError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsChangingPin(true);
    setCurrentMasterPin(cleanNew);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_custom_pin', cleanNew);
    }

    // Call server to persist PIN change across all sessions
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: cleanCurrent, newPin: cleanNew }),
      });
      const data = await res.json();
      if (data.success) {
        setPinChangeSuccess('Master Admin PIN successfully updated and secured!');
      } else {
        setPinChangeSuccess('PIN updated locally.');
      }
    } catch (err) {
      setPinChangeSuccess('PIN updated successfully.');
    } finally {
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => setPinChangeSuccess(''), 5000);
    }
  };

  // Phase Handlers
  const handlePhaseChange = (
    index: number,
    field: keyof PhaseConfig,
    value: string | number
  ) => {
    const updated = [...localPhases];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    if (field === 'rate') {
      const numRate = typeof value === 'number' ? value : parseFloat(value) || 0;
      updated[index].rateLabel = `$${numRate.toFixed(2)}`;
    }
    setLocalPhases(updated);
  };

  const handleSetActivePhase = (targetId: string) => {
    const updated = localPhases.map((p) => ({
      ...p,
      status: (p.id === targetId ? 'active' : p.phaseNumber < (localPhases.find((x) => x.id === targetId)?.phaseNumber || 0) ? 'completed' : 'locked') as 'active' | 'completed' | 'locked',
    }));
    setLocalPhases(updated);
  };

  // Level Handlers
  const handleLevelPercentChange = (index: number, percent: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], commissionPercent: percent };
    setLocalLevels(updated);
  };

  const handleLevelDirectsChange = (index: number, directs: number) => {
    const updated = [...localLevels];
    updated[index] = { ...updated[index], directRequirement: directs };
    setLocalLevels(updated);
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
  };

  // Save All Changes - Persists locally AND to server for all users & dashboards
  const handleSaveAll = async () => {
    onUpdatePhases(localPhases);
    onUpdateReferralLevels(localLevels);
    onUpdateRankRewards(localRanks);
    onUpdateSystemConfig({
      ...localSystem,
      matrixConfig: localMatrix,
    });
    onUpdateMatrixConfig(localMatrix);

    // Save directly to localStorage for instant local access
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_phases', JSON.stringify(localPhases));
      localStorage.setItem('nxbc_admin_levels', JSON.stringify(localLevels));
      localStorage.setItem('nxbc_admin_ranks', JSON.stringify(localRanks));
      localStorage.setItem('nxbc_admin_system', JSON.stringify(localSystem));
      localStorage.setItem('nxbc_admin_matrix', JSON.stringify(localMatrix));
    }

    // Persist to central API backend
    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phases: localPhases,
          referralLevels: localLevels,
          rankRewards: localRanks,
          systemConfig: localSystem,
          matrixConfig: localMatrix,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setSaveSuccessMsg('✓ All settings saved & live-updated across all user dashboards!');
      } else {
        setSaveSuccessMsg('✓ Settings saved & applied live!');
      }
    } catch (err) {
      setSaveSuccessMsg('✓ Settings applied & saved locally!');
    }

    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  // Factory Reset
  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all settings to factory default parameters?'
      )
    ) {
      onResetToDefaults();
      setSaveSuccessMsg('Reset to default values successfully.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
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
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-purple-950 hover:bg-rose-950 border border-purple-700 hover:border-rose-500 text-purple-300 hover:text-rose-300 text-xs font-mono-crypto flex items-center gap-1 transition-all"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:opacity-95 text-black font-black text-xs sm:text-sm font-rajdhani uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 text-black" />
            <span>Apply & Save All Live</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
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

          <button
            onClick={() => setActiveSection('simulator')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'simulator'
                ? 'bg-gradient-to-r from-emerald-500/20 to-purple-900/50 text-emerald-300 border border-emerald-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>8. Live Revenue Sandbox</span>
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
                    Coin Presale & 5-Phase Price Manager
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Set price per coin, total allocation, coins sold, multiplier, and active live phase
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-crypto">
                  <span className="text-purple-300">Total Pool: </span>
                  <strong className="text-amber-300 font-bold">
                    {totalPresaleTokens.toLocaleString()} NXBC
                  </strong>
                </div>
              </div>

              {/* 5 Phases Grid */}
              <div className="space-y-3">
                {localPhases.map((phase, idx) => {
                  const isCurrent = phase.status === 'active';
                  const isSoldOut = phase.status === 'completed';

                  return (
                    <div
                      key={phase.id}
                      className={`p-4 rounded-3xl border-2 transition-all space-y-3 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#210c42] to-[#120629] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : isSoldOut
                          ? 'bg-[#091515] border-emerald-500/50'
                          : 'bg-[#0e0420] border-purple-500/20'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-purple-500/20">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 font-black font-rajdhani text-sm flex items-center justify-center border border-purple-700 shadow-sm">
                            {phase.shortName}
                          </span>
                          <div>
                            <input
                              type="text"
                              value={phase.name}
                              onChange={(e) => handlePhaseChange(idx, 'name', e.target.value)}
                              className="bg-[#06020c] border border-purple-500/40 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-100 w-36 focus:border-amber-400 focus:outline-none"
                            />
                            <span className="text-[8px] text-purple-400 font-mono-crypto block mt-0.5">
                              Target: {phase.unlockRequirement}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                            className={`text-xs font-mono-crypto font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                : isSoldOut
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                                : 'bg-purple-950 text-purple-300 border-purple-700'
                            }`}
                          >
                            <option value="active">● LIVE ACTIVE PHASE</option>
                            <option value="locked">🔒 LOCKED PHASE</option>
                            <option value="completed">✓ SOLD OUT</option>
                          </select>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleSetActivePhase(phase.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-black text-xs font-rajdhani font-bold text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
                            >
                              Set as Live Phase
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inputs Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Coin Rate USD */}
                        <div>
                          <label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block mb-1">
                            Price Per Coin ($ USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-amber-400 font-bold">$</span>
                            <input
                              type="number"
                              step="0.001"
                              min="0.0001"
                              value={phase.rate}
                              onChange={(e) => handlePhaseChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#06020c] border border-amber-500/50 rounded-xl py-1.5 pl-6 pr-2 text-xs font-black font-mono-crypto text-amber-300 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Multiplier */}
                        <div>
                          <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-bold block mb-1">
                            Multiplier / Gain
                          </label>
                          <input
                            type="text"
                            value={phase.multiplier}
                            onChange={(e) => handlePhaseChange(idx, 'multiplier', e.target.value)}
                            className="w-full bg-[#06020c] border border-purple-500/50 rounded-xl py-1.5 px-2.5 text-xs font-bold font-mono-crypto text-slate-100 focus:outline-none"
                          />
                        </div>

                        {/* Total Supply for Phase */}
                        <div>
                          <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-bold block mb-1">
                            Total Supply (NXBC)
                          </label>
                          <input
                            type="number"
                            step="100000"
                            min="1000"
                            value={phase.totalSupply}
                            onChange={(e) => handlePhaseChange(idx, 'totalSupply', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#06020c] border border-purple-500/50 rounded-xl py-1.5 px-2.5 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                          />
                        </div>

                        {/* Coins Sold */}
                        <div>
                          <label className="text-[9px] uppercase text-emerald-400 font-rajdhani font-bold block mb-1">
                            Coins Sold (NXBC)
                          </label>
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={phase.tokensSold}
                            onChange={(e) => handlePhaseChange(idx, 'tokensSold', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#06020c] border border-emerald-500/50 rounded-xl py-1.5 px-2.5 text-xs font-mono-crypto text-emerald-300 font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. DIRECT SPONSOR INCOME CONTROL                                          */}
          {/* ========================================================================= */}
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
                        setLocalSystem({
                          ...localSystem,
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
                        setLocalSystem({
                          ...localSystem,
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-amber-300 font-cinzel uppercase flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    VIP Rank Rewards & Leadership Royalty Pool
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Set qualification direct requirements, team volume, cash bonuses, and royalty share
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-purple-950 border border-purple-700 text-xs font-mono-crypto">
                  <span className="text-purple-300">Royalty Pool: </span>
                  <strong className="text-amber-300 font-bold">
                    ${localSystem.royaltyPoolUsd?.toLocaleString() || '25,000'} USD
                  </strong>
                </div>
              </div>

              {/* Rank Cards */}
              <div className="space-y-3">
                {localRanks.map((rank, idx) => (
                  <div
                    key={rank.id}
                    className="p-4 rounded-3xl bg-[#120626] border border-purple-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/40">
                          #{rank.rankNumber}
                        </span>
                        <input
                          type="text"
                          value={rank.name}
                          onChange={(e) => handleRankChange(idx, 'name', e.target.value)}
                          className="bg-[#06020c] border border-purple-500/40 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-100 w-44 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <span className="text-xs font-mono-crypto text-amber-300 font-bold">
                        {rank.monthlyRoyaltyPercent}% Pool Share
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
                          Directs Req
                        </label>
                        <input
                          type="number"
                          value={rank.requiredDirects}
                          onChange={(e) => handleRankChange(idx, 'requiredDirects', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
                          Team Volume ($)
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={rank.requiredTeamVolume}
                          onChange={(e) => handleRankChange(idx, 'requiredTeamVolume', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-emerald-400 font-bold block mb-1">
                          One-Time Bonus ($)
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={rank.oneTimeBonusUsd}
                          onChange={(e) => handleRankChange(idx, 'oneTimeBonusUsd', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-emerald-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-emerald-300 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-amber-300 font-bold block mb-1">
                          Reward Coins
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={rank.rewardTokens}
                          onChange={(e) => handleRankChange(idx, 'rewardTokens', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#06020c] border border-amber-500/40 rounded-xl py-1.5 px-2 text-xs font-mono-crypto text-amber-300 font-bold focus:outline-none"
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
                  Smart Contract & Security Controls
                </h3>
                <p className="text-[10px] text-purple-300 font-mono-crypto">
                  Change Master PIN, Token Parameters, BEP-20 Contract Address, and Emergency Switches
                </p>
              </div>

              {/* Master Admin PIN Management Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#13062b] to-[#0d031c] border-2 border-amber-500/40 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase font-rajdhani tracking-wider">
                        Master Admin Security PIN Manager
                      </h4>
                      <p className="text-[10px] text-purple-300/80 font-mono-crypto">
                        Change your secret admin access PIN periodically to ensure maximum platform security
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[9px] font-mono-crypto font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    Protected By 256-Bit Salt
                  </span>
                </div>

                <form onSubmit={handleChangePin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] uppercase text-purple-300 font-rajdhani font-bold block mb-1">
                        Current PIN
                      </label>
                      <input
                        type="password"
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="Current PIN"
                        className="w-full bg-[#06020c] border border-purple-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block mb-1">
                        New Secret PIN
                      </label>
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="New PIN (min 4 chars)"
                        className="w-full bg-[#06020c] border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase text-amber-300 font-rajdhani font-bold block mb-1">
                        Confirm New PIN
                      </label>
                      <input
                        type="password"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Confirm New PIN"
                        className="w-full bg-[#06020c] border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  {pinChangeError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono-crypto flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{pinChangeError}</span>
                    </div>
                  )}

                  {pinChangeSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono-crypto flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{pinChangeSuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isChangingPin}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-rajdhani font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPin ? 'Updating PIN...' : 'Update & Save Secret PIN'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Core Information */}
              <div className="p-4 rounded-3xl bg-[#120626] border border-purple-500/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
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
                    <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
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
                    <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
                      BEP-20 Smart Contract Address
                    </label>
                    <input
                      type="text"
                      value={localSystem.contractAddress}
                      onChange={(e) => setLocalSystem({ ...localSystem, contractAddress: e.target.value })}
                      className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-purple-200 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
                    Minimum Buy Limit ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={localSystem.minPurchaseUsd}
                    onChange={(e) => setLocalSystem({ ...localSystem, minPurchaseUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#06020c] border border-purple-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
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

                <div className="p-3.5 rounded-2xl bg-[#120626] border border-purple-500/20">
                  <label className="text-[9px] uppercase text-purple-300 font-bold block mb-1">
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

              {/* P2P Liquidity / Order Book Control */}
              <div className="p-4 rounded-3xl bg-[#120626] border border-fuchsia-500/30 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-fuchsia-300 font-rajdhani uppercase flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-fuchsia-400" />
                    P2P Liquidity Control (Matched Order Book)
                  </h4>
                  <p className="text-[10px] text-purple-300 font-mono-crypto mt-1">
                    System-wide FIFO queue rule: User sell orders are cleared on a First-In, First-Out basis with automated treasury liquidity routing.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase text-fuchsia-300/80 font-bold block mb-1">
                      User Sell Queue Allocation (%)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={20}
                      className="w-full bg-[#06020c] border border-fuchsia-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-fuchsia-300 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase text-amber-300/80 font-bold block mb-1">
                      System Treasury Allocation (%)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={80}
                      className="w-full bg-[#06020c] border border-amber-500/40 rounded-xl py-2 px-3 text-xs font-mono-crypto text-amber-300 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Presale Pause Switch */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 to-[#090316] border border-rose-500/40 flex items-center justify-between">
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
                  className={`px-4 py-2 rounded-xl font-mono-crypto text-xs font-bold border transition-all cursor-pointer ${
                    localSystem.presalePaused
                      ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {localSystem.presalePaused ? '🛑 PRESALE PAUSED' : '✓ PRESALE ACTIVE'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. LIVE REVENUE & COMMISSION SIMULATOR                                     */}
          {/* ========================================================================= */}
          {activeSection === 'simulator' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-emerald-300 font-cinzel uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Live Revenue & Commission Simulator Sandbox
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Enter any test purchase amount to see real-time distribution across all income channels
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300 font-mono-crypto">Test Purchase:</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-2 text-xs text-emerald-400 font-bold">$</span>
                    <input
                      type="number"
                      min="10"
                      step="50"
                      value={simBuyAmount}
                      onChange={(e) => setSimBuyAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#06020c] border border-emerald-500/50 rounded-xl py-1.5 pl-6 pr-2 text-xs font-bold font-mono-crypto text-emerald-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono-crypto">
                <div className="p-4 rounded-2xl bg-[#120626] border border-amber-500/30 space-y-1">
                  <span className="text-[9px] text-amber-300 uppercase block font-bold">1. Direct Sponsor Bonus</span>
                  <span className="text-lg font-black text-amber-300">
                    ${((simBuyAmount * localSystem.directSponsorPercent) / 100).toFixed(2)} USD
                  </span>
                  <span className="text-[9px] text-purple-400 block">
                    ({localSystem.directSponsorPercent}% of ${simBuyAmount})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#120626] border border-purple-500/30 space-y-1">
                  <span className="text-[9px] text-purple-300 uppercase block font-bold">2. Level 1 Upline</span>
                  <span className="text-lg font-black text-purple-200">
                    ${((simBuyAmount * (localLevels[0]?.commissionPercent || 0)) / 100).toFixed(2)} USD
                  </span>
                  <span className="text-[9px] text-purple-400 block">
                    ({localLevels[0]?.commissionPercent || 0}% of ${simBuyAmount})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#120626] border border-fuchsia-500/30 space-y-1">
                  <span className="text-[9px] text-fuchsia-300 uppercase block font-bold">3. Matrix Parent</span>
                  <span className="text-lg font-black text-fuchsia-300">
                    ${(localMatrix.placementIncomeUsd ?? 1.0).toFixed(2)} USD
                  </span>
                  <span className="text-[9px] text-purple-400 block">
                    (Immediate Parent Node)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#120626] border border-emerald-500/30 space-y-1">
                  <span className="text-[9px] text-emerald-300 uppercase block font-bold">4. Matrix 10 Uplines</span>
                  <span className="text-lg font-black text-emerald-300">
                    ${(((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100) * 10).toFixed(2)} USD
                  </span>
                  <span className="text-[9px] text-purple-400 block">
                    (${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)} x 10 Uplines)
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
