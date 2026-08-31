import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Smartphone,
  LayoutGrid,
  RefreshCw,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  Flame,
  Award,
  Crown,
  Settings,
  Wallet,
} from 'lucide-react';
import {
  AllocationState,
  Transaction,
  ReferralLevel,
  MatrixNode,
  ActiveScreen,
  ViewMode,
  PhaseConfig,
  MatrixConfig,
  RankReward,
  AdminSystemConfig,
} from './types/crypto';
import { AnalyticalBackground } from './components/AnalyticalBackground';
import { DeviceFrame } from './components/DeviceFrame';
import { BottomNavBar } from './components/BottomNavBar';
import { ScreenOneAcquisition } from './components/ScreenOneAcquisition';
import { ScreenTwoAssets } from './components/ScreenTwoAssets';
import { ScreenThreeWallet } from './components/ScreenThreeWallet';
import { ScreenTeam } from './components/ScreenTeam';
import { ScreenMine } from './components/ScreenMine';
import { BuyTokenModal } from './components/BuyTokenModal';
import { WalletConnectModal } from './components/WalletConnectModal';
import { TeamPlanModal } from './components/TeamPlanModal';
import { MatrixPlanModal } from './components/MatrixPlanModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SecretAdminPage } from './components/SecretAdminPage';
import { GoldCoinGraphic } from './components/GoldCoinGraphic';

export default function App() {
  // Default to 'single' full mobile screen mode
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeSingleScreen, setActiveSingleScreen] = useState<ActiveScreen>('home');
  const [showSecretAdminPage, setShowSecretAdminPage] = useState<boolean>(false);

  // Core State: 6-Phase Sequential Roadmap & Live Status (Admin Managed & Persisted)
  const [phases, setPhases] = useState<PhaseConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_phases');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Phase 1',
        shortName: 'P1',
        rate: 0.01,
        rateLabel: '$0.01',
        totalSupply: 10000000, // 10,000,000 NXBC
        tokensSold: 7650000, // 7,650,000 NXBC (76.5%)
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Ends in 03d 14h 22m',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 15000000, // 15,000,000 NXBC
        tokensSold: 0,
        status: 'locked',
        multiplier: '10x Growth',
        unlockRequirement: 'Phase 1 must be 100% sold to unlock',
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Phase 3',
        shortName: 'P3',
        rate: 0.20,
        rateLabel: '$0.20',
        totalSupply: 20000000, // 20,000,000 NXBC
        tokensSold: 0,
        status: 'locked',
        multiplier: '20x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 0.30,
        rateLabel: '$0.30',
        totalSupply: 25000000, // 25,000,000 NXBC
        tokensSold: 0,
        status: 'locked',
        multiplier: '30x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 0.40,
        rateLabel: '$0.40',
        totalSupply: 30000000, // 30,000,000 NXBC
        tokensSold: 0,
        status: 'locked',
        multiplier: '40x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'Live DEX Launch',
        shortName: 'DEX',
        rate: 1500.00,
        rateLabel: '$1,500 – $3,000',
        totalSupply: 50000000, // 50,000,000 NXBC
        tokensSold: 0,
        status: 'locked',
        multiplier: '50x+ Open Market Trading',
        unlockRequirement: 'Phase 5 must be 100% sold to unlock',
      },
    ];
  });

  const activePhase = phases.find((p) => p.status === 'active') || phases[0];

  // Core State: Sell-Through Allocation (Clean Real State persisted in localStorage)
  const [allocation, setAllocation] = useState<AllocationState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_user_allocation');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      p2Percent: 20,
      p3Percent: 30,
      p4Percent: 20,
      p5Percent: 15,
      dexPercent: 15,
      unallocatedPercent: 0,
      totalTokensPurchased: 0,
      isLocked: false,
      lockedTimestamp: '',
    };
  });

  // Wallet & Income State (Loads persisted wallet if present, or checks injected web3)
  const [walletConnected, setWalletConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('nxbc_connected_wallet');
    }
    return false;
  });
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nxbc_connected_wallet') || '';
    }
    return '';
  });
  const [claimableBalanceUsd, setClaimableBalanceUsd] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_claimable_usd');
      if (stored) return parseFloat(stored) || 0;
    }
    return 0;
  });
  const [levelIncomeUsd, setLevelIncomeUsd] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_level_income');
      if (stored) return parseFloat(stored) || 0;
    }
    return 0;
  });
  const [matrixIncomeUsd, setMatrixIncomeUsd] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_matrix_income');
      if (stored) return parseFloat(stored) || 0;
    }
    return 0;
  });
  const [totalInvestedUsd, setTotalInvestedUsd] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_total_invested');
      if (stored) return parseFloat(stored) || 0;
    }
    return 0;
  });

  // Auto-detect injected Web3 (MetaMask / Trust Wallet / Binance Web3 / OKX)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eth =
        (window as any).trustwallet?.ethereum ||
        (window as any).ethereum ||
        (window as any).binancew3w?.ethereum ||
        (window as any).okxwallet;

      if (eth) {
        // Check if accounts already authorized
        eth
          .request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setWalletConnected(true);
              localStorage.setItem('nxbc_connected_wallet', accounts[0]);
            }
          })
          .catch((err: any) => console.log('Web3 silent account check:', err));

        // Listen to account switch in Trust Wallet / MetaMask
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
            localStorage.setItem('nxbc_connected_wallet', accounts[0]);
          } else {
            setWalletConnected(false);
            setWalletAddress('');
            localStorage.removeItem('nxbc_connected_wallet');
          }
        };

        eth.on?.('accountsChanged', handleAccountsChanged);
      }
    }
  }, []);

  // Secure URL-Only Admin Access (#admin, /admin, ?admin=true, ?panel=admin, #secret-admin)
  useEffect(() => {
    const checkAdminUrl = () => {
      if (typeof window !== 'undefined') {
        const fullUrl = window.location.href.toLowerCase();
        const hash = (window.location.hash || '').toLowerCase();
        const search = (window.location.search || '').toLowerCase();
        const pathname = (window.location.pathname || '').toLowerCase();

        if (
          hash.includes('admin') ||
          search.includes('admin') ||
          pathname.includes('/admin') ||
          pathname.endsWith('admin') ||
          fullUrl.includes('#admin') ||
          fullUrl.includes('?admin') ||
          fullUrl.includes('/admin') ||
          fullUrl.includes('panel=admin')
        ) {
          setShowSecretAdminPage(true);
        }
      }
    };

    checkAdminUrl();
    window.addEventListener('hashchange', checkAdminUrl);
    window.addEventListener('popstate', checkAdminUrl);

    // Periodic scanner every 400ms in case URL is modified without page reload
    const interval = setInterval(checkAdminUrl, 400);

    return () => {
      window.removeEventListener('hashchange', checkAdminUrl);
      window.removeEventListener('popstate', checkAdminUrl);
      clearInterval(interval);
    };
  }, []);

  // Real-time synchronization with Server Admin Configs & Cross-tab updates
  useEffect(() => {
    const fetchLatestServerConfigs = async () => {
      try {
        const res = await fetch('/api/admin/configs');
        const data = await res.json();
        if (data?.success) {
          if (data.phases && Array.isArray(data.phases) && data.phases.length > 0) {
            setPhases(data.phases);
            localStorage.setItem('nxbc_admin_phases', JSON.stringify(data.phases));
          }
          if (data.referralLevels && Array.isArray(data.referralLevels) && data.referralLevels.length > 0) {
            setReferralLevels(data.referralLevels);
            localStorage.setItem('nxbc_admin_levels', JSON.stringify(data.referralLevels));
          }
          if (data.rankRewards && Array.isArray(data.rankRewards) && data.rankRewards.length > 0) {
            setRankRewards(data.rankRewards);
            localStorage.setItem('nxbc_admin_ranks', JSON.stringify(data.rankRewards));
          }
          if (data.systemConfig && typeof data.systemConfig === 'object') {
            setSystemConfig(data.systemConfig);
            localStorage.setItem('nxbc_admin_system', JSON.stringify(data.systemConfig));
          }
          if (data.matrixConfig && typeof data.matrixConfig === 'object') {
            setMatrixConfig(data.matrixConfig);
            localStorage.setItem('nxbc_admin_matrix', JSON.stringify(data.matrixConfig));
          }
        }
      } catch (err) {}
    };

    fetchLatestServerConfigs();
    // Poll server every 3.5 seconds to keep user dashboard 100% updated in real-time
    const syncInterval = setInterval(fetchLatestServerConfigs, 3500);

    // Cross-tab storage listener for immediate instant sync across browser tabs
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'nxbc_admin_phases' && e.newValue) {
        try { setPhases(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'nxbc_admin_levels' && e.newValue) {
        try { setReferralLevels(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'nxbc_admin_ranks' && e.newValue) {
        try { setRankRewards(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'nxbc_admin_system' && e.newValue) {
        try { setSystemConfig(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'nxbc_admin_matrix' && e.newValue) {
        try { setMatrixConfig(JSON.parse(e.newValue)); } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Sync user with PostgreSQL backend when wallet connects
  useEffect(() => {
    if (walletConnected && walletAddress) {
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          referredBy: 'REFMASTER88',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            console.log('PostgreSQL synced user:', data.user);
          }
        })
        .catch((err) => console.log('PostgreSQL sync notice:', err));
    }
  }, [walletConnected, walletAddress]);

  // Transactions History (Persisted in localStorage)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_transactions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return [];
  });

  // 10-Level Referral Plan Data (Admin Managed & Persisted)
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_levels');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      { level: 1, commissionPercent: 10, directRequirement: 1, directMembers: 8, totalVolumeUsd: 4500, earnedUsd: 450.00 },
      { level: 2, commissionPercent: 5, directRequirement: 2, directMembers: 14, totalVolumeUsd: 3800, earnedUsd: 190.00 },
      { level: 3, commissionPercent: 3, directRequirement: 3, directMembers: 22, totalVolumeUsd: 2900, earnedUsd: 87.00 },
      { level: 4, commissionPercent: 2, directRequirement: 4, directMembers: 31, totalVolumeUsd: 2200, earnedUsd: 44.00 },
      { level: 5, commissionPercent: 1, directRequirement: 5, directMembers: 18, totalVolumeUsd: 1800, earnedUsd: 18.00 },
      { level: 6, commissionPercent: 1, directRequirement: 6, directMembers: 15, totalVolumeUsd: 1500, earnedUsd: 15.00 },
      { level: 7, commissionPercent: 1, directRequirement: 7, directMembers: 12, totalVolumeUsd: 1200, earnedUsd: 12.00 },
      { level: 8, commissionPercent: 1, directRequirement: 8, directMembers: 10, totalVolumeUsd: 1400, earnedUsd: 14.00 },
      { level: 9, commissionPercent: 1, directRequirement: 9, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 15.00 },
      { level: 10, commissionPercent: 1, directRequirement: 10, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 15.00 },
    ];
  });

  // 2x2 Matrix System Config (Dynamic via Admin & Persisted)
  const [matrixConfig, setMatrixConfig] = useState<MatrixConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_matrix');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      placementIncomeUsd: 1.00,
      uplineSharePercent: 10,
      enabled: true,
    };
  });

  // Rank Rewards & Leadership Pool (Dynamic via Admin & Persisted)
  const [rankRewards, setRankRewards] = useState<RankReward[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_ranks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'rank-1',
        rankNumber: 1,
        name: 'Bronze Leader',
        requiredDirects: 5,
        requiredTeamVolume: 5000,
        oneTimeBonusUsd: 150,
        rewardTokens: 10000,
        monthlyRoyaltyPercent: 1,
        currentQualifiedCount: 42,
        status: 'unlocked',
      },
      {
        id: 'rank-2',
        rankNumber: 2,
        name: 'Silver Director',
        requiredDirects: 10,
        requiredTeamVolume: 15000,
        oneTimeBonusUsd: 500,
        rewardTokens: 35000,
        monthlyRoyaltyPercent: 2,
        currentQualifiedCount: 18,
        status: 'claimable',
      },
      {
        id: 'rank-3',
        rankNumber: 3,
        name: 'Gold Executive',
        requiredDirects: 20,
        requiredTeamVolume: 50000,
        oneTimeBonusUsd: 1500,
        rewardTokens: 100000,
        monthlyRoyaltyPercent: 3,
        currentQualifiedCount: 7,
        status: 'locked',
      },
      {
        id: 'rank-4',
        rankNumber: 4,
        name: 'Platinum Vice President',
        requiredDirects: 35,
        requiredTeamVolume: 150000,
        oneTimeBonusUsd: 5000,
        rewardTokens: 300000,
        monthlyRoyaltyPercent: 4,
        currentQualifiedCount: 3,
        status: 'locked',
      },
      {
        id: 'rank-5',
        rankNumber: 5,
        name: 'Diamond President',
        requiredDirects: 50,
        requiredTeamVolume: 500000,
        oneTimeBonusUsd: 15000,
        rewardTokens: 1000000,
        monthlyRoyaltyPercent: 5,
        currentQualifiedCount: 1,
        status: 'locked',
      },
      {
        id: 'rank-6',
        rankNumber: 6,
        name: 'Crown Global Ambassador',
        requiredDirects: 100,
        requiredTeamVolume: 2000000,
        oneTimeBonusUsd: 50000,
        rewardTokens: 5000000,
        monthlyRoyaltyPercent: 5,
        currentQualifiedCount: 0,
        status: 'locked',
      },
    ];
  });

  // General System & Global Parameters (Dynamic via Admin & Persisted)
  const [systemConfig, setSystemConfig] = useState<AdminSystemConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_system');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      tokenName: 'NXBC',
      tokenSymbol: 'NXBC',
      contractAddress: '0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7',
      minPurchaseUsd: 10,
      maxPurchaseUsd: 50000,
      minMlmQualifyUsd: 100,
      presalePaused: false,
      directSponsorPercent: 5,
      withdrawalFeePercent: 2,
      matrixConfig: {
        placementIncomeUsd: 1.00,
        uplineSharePercent: 10,
        enabled: true,
      },
      royaltyPoolUsd: 25000,
    };
  });

  // 2x2 Matrix Structure Nodes Data (Reflecting User A, B, C, D, E, F, G tree with $1 base placement)
  const matrixNodes: MatrixNode[] = [
    { id: 'm-0', name: 'User A (You)', wallet: '0x71C...a89F', position: 'root', status: 'filled', avatarSeed: 'root', earningsUsd: 2.40 },
    { id: 'm-1', name: 'User B', wallet: '0x84A...12F4', position: 'L1_left', status: 'filled', avatarSeed: 'alex', earningsUsd: 2.00 },
    { id: 'm-2', name: 'User C', wallet: '0x99B...77C1', position: 'L1_right', status: 'filled', avatarSeed: 'elena', earningsUsd: 2.00 },
    { id: 'm-3', name: 'User D', wallet: '0x12C...98D0', position: 'L2_LL', status: 'filled', avatarSeed: 'spill1', earningsUsd: 0 },
    { id: 'm-4', name: 'User E', wallet: '0x44D...55A2', position: 'L2_LR', status: 'filled', avatarSeed: 'dao', earningsUsd: 0 },
    { id: 'm-5', name: 'User F', wallet: '0x88E...33B9', position: 'L2_RL', status: 'filled', avatarSeed: 'spill2', earningsUsd: 0 },
    { id: 'm-6', name: 'User G', wallet: '0x55F...00E3', position: 'L2_RR', status: 'filled', avatarSeed: 'sat', earningsUsd: 0 },
  ];

  // Modals state
  const [buyModalOpen, setBuyModalOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  // Purchase handler with sequential phase progression & immutable allocation lock
  const handleConfirmPurchase = (
    tokenAmount: number,
    usdAmount: number,
    sellAlloc: {
      p2Percent: number;
      p3Percent: number;
      p4Percent: number;
      p5Percent: number;
      dexPercent: number;
      unallocatedPercent: number;
    }
  ) => {
    // Check if presale is paused by Admin
    if (systemConfig.presalePaused) {
      alert('Presale is currently paused by the System.');
      return;
    }

    // Strict phase allotment boundary verification
    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) {
      alert('Presale has ended or no active phase available.');
      return;
    }

    const currentP = phases[activeIdx];
    const maxAvailable = currentP.totalSupply - currentP.tokensSold;

    if (tokenAmount > maxAvailable) {
      alert(
        `Strict Limit Exceeded: You cannot purchase more coins than the limit allocated by the System (${currentP.totalSupply.toLocaleString()} ${systemConfig.tokenSymbol}). Only ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol} are remaining in this phase.`
      );
      return;
    }

    const updatedAlloc: AllocationState = {
      p2Percent: sellAlloc.p2Percent,
      p3Percent: sellAlloc.p3Percent,
      p4Percent: sellAlloc.p4Percent,
      p5Percent: sellAlloc.p5Percent,
      dexPercent: sellAlloc.dexPercent,
      unallocatedPercent: sellAlloc.unallocatedPercent,
      totalTokensPurchased: allocation.totalTokensPurchased + tokenAmount,
      isLocked: true,
      lockedTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAllocation(updatedAlloc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_user_allocation', JSON.stringify(updatedAlloc));
    }

    // Sequential Phase Progress & 100% Transition Logic
    setPhases((prevPhases) => {
      const idx = prevPhases.findIndex((p) => p.status === 'active');
      if (idx === -1) return prevPhases;

      const p = prevPhases[idx];
      const newSold = p.tokensSold + tokenAmount;

      // If current phase hits exactly 100% (totalSupply), advance to next in sequence!
      if (newSold >= p.totalSupply) {
        const nextIdx = idx + 1;
        return prevPhases.map((phase, pIndex) => {
          if (pIndex === idx) {
            return { ...phase, tokensSold: phase.totalSupply, status: 'completed' as const };
          }
          if (pIndex === nextIdx) {
            return {
              ...phase,
              tokensSold: 0,
              status: 'active' as const,
            };
          }
          return phase;
        });
      }

      return prevPhases.map((phase, pIndex) =>
        pIndex === idx ? { ...phase, tokensSold: newSold } : phase
      );
    });

    // Update cumulative investment
    const newTotalInvested = totalInvestedUsd + usdAmount;
    setTotalInvestedUsd(newTotalInvested);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_total_invested', newTotalInvested.toString());
    }

    // $100 Cumulative Qualification Rule Check:
    // Only distribute / credit MLM referral commissions if user meets the cumulative threshold ($100 default)
    const minQualify = systemConfig.minMlmQualifyUsd || 100;
    const isNowQualified = newTotalInvested >= minQualify;

    if (isNowQualified) {
      // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages
      const directBonus = (usdAmount * systemConfig.directSponsorPercent) / 100;
      const l1Bonus = (usdAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
      const totalBonus = directBonus + l1Bonus;

      const newClaimable = claimableBalanceUsd + totalBonus;
      const newLevel = levelIncomeUsd + totalBonus;
      setClaimableBalanceUsd(newClaimable);
      setLevelIncomeUsd(newLevel);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nxbc_claimable_usd', newClaimable.toString());
        localStorage.setItem('nxbc_level_income', newLevel.toString());
      }
    }

    // Record Transaction in PostgreSQL Backend
    fetch('/api/presale/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress || '0x71C...a89F',
        amountUsdt: usdAmount,
        tokenAmount,
        tokenPrice: activePhase.rate,
        phaseIndex: activePhase.phaseNumber,
      }),
    })
      .then((res) => res.json())
      .then((res) => console.log('PostgreSQL Presale Purchase recorded:', res))
      .catch((err) => console.log('PostgreSQL purchase notice:', err));

    // Record Transaction History
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'buy',
      title: `${activePhase.name} Purchase (${tokenAmount.toLocaleString()} ${systemConfig.tokenSymbol})`,
      amountTokens: tokenAmount,
      amountUsd: usdAmount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      txHash: `0x${Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('')}...${Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
      phase: `${activePhase.name} ($${activePhase.rate.toFixed(2)})`,
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_transactions', JSON.stringify(updatedTxs));
    }
  };

  // Helper to reset all data back to clean state
  const handleResetAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nxbc_user_allocation');
      localStorage.removeItem('nxbc_total_invested');
      localStorage.removeItem('nxbc_claimable_usd');
      localStorage.removeItem('nxbc_level_income');
      localStorage.removeItem('nxbc_matrix_income');
      localStorage.removeItem('nxbc_transactions');
    }
    setAllocation({
      p2Percent: 20,
      p3Percent: 30,
      p4Percent: 20,
      p5Percent: 15,
      dexPercent: 15,
      unallocatedPercent: 0,
      totalTokensPurchased: 0,
      isLocked: false,
      lockedTimestamp: '',
    });
    setTotalInvestedUsd(0);
    setClaimableBalanceUsd(0);
    setLevelIncomeUsd(0);
    setMatrixIncomeUsd(0);
    setTransactions([]);
  };

  // Synchronized Update Handlers (Updates React state, persists to localStorage, and saves to Server API)
  const syncConfigsToServer = (partial: {
    phases?: PhaseConfig[];
    referralLevels?: ReferralLevel[];
    rankRewards?: RankReward[];
    systemConfig?: AdminSystemConfig;
    matrixConfig?: MatrixConfig;
  }) => {
    fetch('/api/admin/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch((err) => console.log('Admin API sync notice:', err));
  };

  const handleUpdatePhases = (newPhases: PhaseConfig[]) => {
    setPhases(newPhases);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_phases', JSON.stringify(newPhases));
    }
    syncConfigsToServer({ phases: newPhases });
  };

  const handleUpdateReferralLevels = (newLevels: ReferralLevel[]) => {
    setReferralLevels(newLevels);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_levels', JSON.stringify(newLevels));
    }
    syncConfigsToServer({ referralLevels: newLevels });
  };

  const handleUpdateRankRewards = (newRanks: RankReward[]) => {
    setRankRewards(newRanks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_ranks', JSON.stringify(newRanks));
    }
    syncConfigsToServer({ rankRewards: newRanks });
  };

  const handleUpdateSystemConfig = (newConfig: AdminSystemConfig) => {
    setSystemConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_system', JSON.stringify(newConfig));
    }
    syncConfigsToServer({ systemConfig: newConfig });
  };

  const handleUpdateMatrixConfig = (newMatrix: MatrixConfig) => {
    setMatrixConfig(newMatrix);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_matrix', JSON.stringify(newMatrix));
    }
    syncConfigsToServer({ matrixConfig: newMatrix });
  };

  // Helper to easily simulate 100% phase completion for sequential demo
  const handleSimulateFillPhase = () => {
    setPhases((prevPhases) => {
      const activeIdx = prevPhases.findIndex((p) => p.status === 'active');
      if (activeIdx === -1 || activeIdx >= prevPhases.length - 1) return prevPhases;

      const currentP = prevPhases[activeIdx];
      const nextIdx = activeIdx + 1;

      return prevPhases.map((p, idx) => {
        if (idx === activeIdx) {
          return { ...p, tokensSold: p.totalSupply, status: 'completed' as const };
        }
        if (idx === nextIdx) {
          return { ...p, tokensSold: 0, status: 'active' as const };
        }
        return p;
      });
    });
  };

  // Helper to reset phases back to Phase 1 defaults
  const handleResetPhases = () => {
    setPhases([
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Phase 1',
        shortName: 'P1',
        rate: 0.01,
        rateLabel: '$0.01',
        totalSupply: 10000000,
        tokensSold: 7650000,
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Ends in 03d 14h 22m',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 15000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '10x Growth',
        unlockRequirement: 'Phase 1 must be 100% sold to unlock',
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Phase 3',
        shortName: 'P3',
        rate: 0.20,
        rateLabel: '$0.20',
        totalSupply: 20000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '20x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 0.30,
        rateLabel: '$0.30',
        totalSupply: 25000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '30x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 0.40,
        rateLabel: '$0.40',
        totalSupply: 30000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '40x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'Live DEX Launch',
        shortName: 'DEX',
        rate: 1500.00,
        rateLabel: '$1500 - $3000',
        totalSupply: 50000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '50x+ Open Market Trading',
        unlockRequirement: 'Phase 5 must be 100% sold to unlock',
      },
    ]);
  };

  // Reset all to system defaults
  const handleResetToDefaults = () => {
    const defaultPhases: PhaseConfig[] = [
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Phase 1',
        shortName: 'P1',
        rate: 0.01,
        rateLabel: '$0.01',
        totalSupply: 10000000,
        tokensSold: 7650000,
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Ends in 03d 14h 22m',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 15000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '10x Growth',
        unlockRequirement: 'Phase 1 must be 100% sold to unlock',
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Phase 3',
        shortName: 'P3',
        rate: 0.20,
        rateLabel: '$0.20',
        totalSupply: 20000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '20x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 0.30,
        rateLabel: '$0.30',
        totalSupply: 25000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '30x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 0.40,
        rateLabel: '$0.40',
        totalSupply: 30000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '40x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'Live DEX Launch',
        shortName: 'DEX',
        rate: 1500.00,
        rateLabel: '$1500 - $3000',
        totalSupply: 50000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '50x+ Open Market Trading',
        unlockRequirement: 'Phase 5 must be 100% sold to unlock',
      },
    ];

    const defaultLevels: ReferralLevel[] = [
      { level: 1, commissionPercent: 10, directRequirement: 1, directMembers: 8, totalVolumeUsd: 4500, earnedUsd: 450.00 },
      { level: 2, commissionPercent: 5, directRequirement: 2, directMembers: 14, totalVolumeUsd: 3800, earnedUsd: 190.00 },
      { level: 3, commissionPercent: 3, directRequirement: 3, directMembers: 22, totalVolumeUsd: 2900, earnedUsd: 87.00 },
      { level: 4, commissionPercent: 2, directRequirement: 4, directMembers: 31, totalVolumeUsd: 2200, earnedUsd: 44.00 },
      { level: 5, commissionPercent: 1, directRequirement: 5, directMembers: 18, totalVolumeUsd: 1800, earnedUsd: 18.00 },
      { level: 6, commissionPercent: 1, directRequirement: 6, directMembers: 15, totalVolumeUsd: 1500, earnedUsd: 15.00 },
      { level: 7, commissionPercent: 1, directRequirement: 7, directMembers: 12, totalVolumeUsd: 1200, earnedUsd: 12.00 },
      { level: 8, commissionPercent: 1, directRequirement: 8, directMembers: 10, totalVolumeUsd: 1400, earnedUsd: 14.00 },
      { level: 9, commissionPercent: 1, directRequirement: 9, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 15.00 },
      { level: 10, commissionPercent: 1, directRequirement: 10, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 15.00 },
    ];

    const defaultMatrix: MatrixConfig = {
      placementIncomeUsd: 1.00,
      uplineSharePercent: 10,
      enabled: true,
    };

    const defaultSystem: AdminSystemConfig = {
      tokenName: 'NXBC',
      tokenSymbol: 'NXBC',
      contractAddress: '0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7',
      minPurchaseUsd: 10,
      maxPurchaseUsd: 50000,
      minMlmQualifyUsd: 100,
      presalePaused: false,
      directSponsorPercent: 5,
      withdrawalFeePercent: 2,
      matrixConfig: defaultMatrix,
      royaltyPoolUsd: 25000,
    };

    handleUpdatePhases(defaultPhases);
    handleUpdateReferralLevels(defaultLevels);
    handleUpdateMatrixConfig(defaultMatrix);
    handleUpdateSystemConfig(defaultSystem);
  };

  // Withdrawal handler
  const handleWithdraw = (amountUsd: number) => {
    setClaimableBalanceUsd((prev) => Math.max(0, prev - amountUsd));
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      title: 'Instant Smart Contract Withdrawal',
      amountUsd: amountUsd,
      timestamp: 'Just now',
      status: 'completed',
      txHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Simulate quick bonus drop
  const handleAddDemoBonus = () => {
    const bonus = 300;
    setClaimableBalanceUsd((prev) => prev + bonus);
    setLevelIncomeUsd((prev) => prev + bonus);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'referral_bonus',
      title: 'Tier 1 Referral Inflow Bonus',
      amountUsd: bonus,
      timestamp: 'Just now',
      status: 'completed',
      txHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // If Secret Admin Page is activated, render full-screen master portal
  if (showSecretAdminPage || activeSingleScreen === 'admin') {
    return (
      <SecretAdminPage
        phases={phases}
        referralLevels={referralLevels}
        rankRewards={rankRewards}
        systemConfig={systemConfig}
        matrixConfig={matrixConfig}
        onUpdatePhases={handleUpdatePhases}
        onUpdateReferralLevels={handleUpdateReferralLevels}
        onUpdateRankRewards={handleUpdateRankRewards}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onUpdateMatrixConfig={handleUpdateMatrixConfig}
        onResetToDefaults={handleResetToDefaults}
        onExitAdmin={() => {
          setShowSecretAdminPage(false);
          if (activeSingleScreen === 'admin') {
            setActiveSingleScreen('home');
          }
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070312] text-slate-100 relative font-['Outfit',sans-serif] selection:bg-[#f59e0b] selection:text-black">
      {/* Background with Dark Analytical Graphs, Candlesticks & 3D Gold Coins */}
      <AnalyticalBackground />

      {/* Main Foreground Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-1 sm:px-4 py-2 sm:py-6 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 sm:mb-4 border-b border-purple-500/20 bg-[#0e0720]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-100 font-cinzel">
                  {systemConfig.tokenSymbol}<span className="text-amber-400"> COIN</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono-crypto">
                  PRESALE PLATFORM
                </span>
                {systemConfig.presalePaused && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white animate-pulse">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/90 mt-1.5 max-w-2xl leading-relaxed">
                NXBC is a next-generation utility coin designed for secure, high-yield P2P trading. By participating in this exclusive presale, early adopters secure their allocation at the lowest entry prices. This provides massive growth potential, automated instant payouts via our FIFO smart contract, and guaranteed liquidity before the official Decentralized Exchange (DEX) launch.
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic View Rendering: Single Full Mobile Screen (Default) OR Trio Multi-Screen Grid */}
        {viewMode === 'single' ? (
          /* PURE FULL-WIDTH MOBILE SCREEN APPLICATION INTERFACE */
          <div className="flex-1 flex flex-col w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto bg-gradient-to-b from-[#110726] via-[#090317] to-[#0d051e] rounded-2xl sm:rounded-[32px] border border-amber-500/25 shadow-[0_15px_60px_rgba(0,0,0,0.8)] overflow-hidden relative my-0 sm:my-2">
            
            {/* Native Mobile App Header Bar Removed as per user request */}


            {/* Quick Screen Switcher Tabs */}
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#090317]/80 border-b border-purple-500/10 select-none">
              {[
                { id: 'home', label: 'Home (Acquisition)' },
                { id: 'assets', label: 'Assets (6-Box Grid)' },
                { id: 'team', label: '10-Level Team' },
                { id: 'withdraw', label: 'Withdraw' },
                { id: 'mine', label: 'Account' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSingleScreen(tab.id as ActiveScreen)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-rajdhani font-bold whitespace-nowrap transition-all ${
                    activeSingleScreen === tab.id
                      ? 'bg-gradient-to-r from-amber-500/30 to-fuchsia-600/30 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'text-purple-300/60 hover:text-purple-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Screen Body Content */}
            <div className="flex-1 pb-16 min-h-[520px]">
              {activeSingleScreen === 'home' && (
                <ScreenOneAcquisition
                  allocation={allocation}
                  phases={phases}
                  onUpdateAllocation={setAllocation}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  onSimulateFillPhase={handleSimulateFillPhase}
                  onResetPhases={handleResetPhases}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                />
              )}

              {activeSingleScreen === 'assets' && (
                <ScreenTwoAssets
                  allocation={allocation}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  matrixIncomeUsd={matrixIncomeUsd}
                />
              )}

              {activeSingleScreen === 'team' && (
                <ScreenTeam
                  levels={referralLevels}
                  rankRewards={rankRewards}
                  directSponsorPercent={systemConfig.directSponsorPercent}
                  onOpenTeamModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd || 100}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                />
              )}

              {activeSingleScreen === 'withdraw' && (
                <ScreenThreeWallet
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  claimableBalanceUsd={claimableBalanceUsd}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                />
              )}

              {activeSingleScreen === 'mine' && (
                <ScreenMine
                  walletAddress={walletAddress}
                  walletConnected={walletConnected}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  totalInvestedUsd={totalInvestedUsd}
                  minMlmQualifyUsd={systemConfig.minMlmQualifyUsd || 100}
                  onResetAllData={handleResetAllData}
                  onOpenAdmin={() => setShowSecretAdminPage(true)}
                />
              )}
            </div>

            {/* Docked Mobile Bottom Navigation Bar */}
            <BottomNavBar
              idPrefix="full-mobile-nav"
              activeScreen={activeSingleScreen}
              onSelectScreen={setActiveSingleScreen}
            />
          </div>
        ) : (
          /* TRIPLE SCREEN PANORAMIC SHOWCASE (3 Screens Side-by-Side) */
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Context Headline for the 3 Interconnected Screens */}
            <div className="text-center mb-6 max-w-2xl mx-auto">
              <span className="text-[11px] font-mono-crypto px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-fuchsia-600/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest inline-block mb-1.5">
                3 Interconnected Ecosystem Modules
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-rajdhani uppercase tracking-wide">
                {systemConfig.tokenSymbol} Community Presale Platform
              </h2>
              <p className="text-xs text-purple-200/70">
                Synchronized live state: Define future sell percentages on Screen 1 &bull; Track the 6-box sell schedule on Screen 2 &bull; Execute instant smart-contract withdrawal on Screen 3.
              </p>
            </div>

            {/* 3 Devices Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 xl:gap-8 items-start justify-center">
              
              {/* DEVICE 1: Coin Acquisition & Future Sell-Through Allocation (Home) */}
              <DeviceFrame
                screenNumber={1}
                screenTitle="Screen 1: Coin Acquisition"
                badgeText="Plan Sell-Through"
                badgeColor="gold"
                url="nxbc.network"
                isHero={false}
              >
                <ScreenOneAcquisition
                  allocation={allocation}
                  phases={phases}
                  onUpdateAllocation={setAllocation}
                  onOpenBuyModal={() => setBuyModalOpen(true)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  onSimulateFillPhase={handleSimulateFillPhase}
                  onResetPhases={handleResetPhases}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                />
                <BottomNavBar
                  idPrefix="s1-nav"
                  activeScreen="home"
                  onSelectScreen={(screen) => {
                    setViewMode('single');
                    setActiveSingleScreen(screen);
                  }}
                />
              </DeviceFrame>

              {/* DEVICE 2: User Assets, Sell Schedule (6-Box Grid) & Community (Assets) */}
              <DeviceFrame
                screenNumber={2}
                screenTitle="Screen 2: Assets & 6-Box Grid"
                badgeText="6 Phase Vectors"
                badgeColor="magenta"
                url="nxbc.network/assets"
                isHero={true}
              >
                <ScreenTwoAssets
                  allocation={allocation}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  levelIncomeUsd={levelIncomeUsd}
                  matrixIncomeUsd={matrixIncomeUsd}
                />
                <BottomNavBar
                  idPrefix="s2-nav"
                  activeScreen="assets"
                  onSelectScreen={(screen) => {
                    setViewMode('single');
                    setActiveSingleScreen(screen);
                  }}
                />
              </DeviceFrame>

              {/* DEVICE 3: Instant Withdrawal & Security (Wallet) */}
              <DeviceFrame
                screenNumber={3}
                screenTitle="Screen 3: Instant Withdrawal"
                badgeText="Hot Multi-Sig"
                badgeColor="purple"
                url="nxbc.network/wallet"
                isHero={false}
              >
                <ScreenThreeWallet
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  claimableBalanceUsd={claimableBalanceUsd}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                />
                <BottomNavBar
                  idPrefix="s3-nav"
                  activeScreen="withdraw"
                  onSelectScreen={(screen) => {
                    setViewMode('single');
                    setActiveSingleScreen(screen);
                  }}
                />
              </DeviceFrame>

            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <BuyTokenModal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        onConfirmPurchase={handleConfirmPurchase}
        currentRate={activePhase.rate}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        contractAddress={systemConfig.contractAddress}
        activePhaseInfo={{
          phaseNumber: activePhase.phaseNumber,
          name: activePhase.name,
          shortName: activePhase.shortName,
          totalSupply: activePhase.totalSupply,
          tokensSold: activePhase.tokensSold,
        }}
        initialAllocation={{
          p2Percent: allocation.p2Percent,
          p3Percent: allocation.p3Percent,
          p4Percent: allocation.p4Percent,
          p5Percent: allocation.p5Percent,
          dexPercent: allocation.dexPercent,
        }}
      />

      <WalletConnectModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSelectWallet={(name, addr) => {
          setWalletConnected(true);
          setWalletAddress(addr);
        }}
      />

      <TeamPlanModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        levels={referralLevels}
        rankRewards={rankRewards}
        directSponsorPercent={systemConfig.directSponsorPercent}
      />

      <MatrixPlanModal
        isOpen={matrixModalOpen}
        onClose={() => setMatrixModalOpen(false)}
        matrixNodes={matrixNodes}
        earnedMatrixUsd={matrixIncomeUsd}
        matrixConfig={matrixConfig}
      />

      {/* MASTER DYNAMIC ADMIN PANEL MODAL */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        phases={phases}
        onUpdatePhases={handleUpdatePhases}
        levels={referralLevels}
        onUpdateLevels={handleUpdateReferralLevels}
        matrixConfig={matrixConfig}
        onUpdateMatrixConfig={handleUpdateMatrixConfig}
        rankRewards={rankRewards}
        onUpdateRankRewards={handleUpdateRankRewards}
        systemConfig={systemConfig}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onResetToDefaults={handleResetToDefaults}
        onOpenSecretPage={() => {
          setAdminModalOpen(false);
          setShowSecretAdminPage(true);
        }}
      />
    </div>
  );
}
