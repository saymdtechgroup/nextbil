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
  AdminSystemConfig, UserEarnings, QueueEntry,
} from './types/crypto';
import { AnalyticalBackground } from './components/AnalyticalBackground';
import { DeviceFrame } from './components/DeviceFrame';
import { BottomNavBar } from './components/BottomNavBar';
import { ScreenOneAcquisition } from './components/ScreenOneAcquisition';
import { ScreenTwoAssets } from './components/ScreenTwoAssets';
import { ScreenThreeWallet } from './components/ScreenThreeWallet';
import { LandingPage } from './components/LandingPage';
import { ScreenTeam } from './components/ScreenTeam';
import { ScreenMine } from './components/ScreenMine';
import { BuyTokenModal } from './components/BuyTokenModal';
import { SwapModal } from './components/SwapModal';
import { WalletConnectModal } from './components/WalletConnectModal';
import { TeamPlanModal } from './components/TeamPlanModal';
import { MatrixPlanModal } from './components/MatrixPlanModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SecretAdminPage } from './components/SecretAdminPage';
import { GoldCoinGraphic } from './components/GoldCoinGraphic';

export default function App() {
  // Default to 'single' full mobile screen mode
  const [isAppLaunched, setIsAppLaunched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeSingleScreen, setActiveSingleScreen] = useState<ActiveScreen>('home');
  const [showSecretAdminPage, setShowSecretAdminPage] = useState<boolean>(false);

  // Core State: 6-Phase Sequential Roadmap & Live Status (Admin Managed & Persisted)
  const [phases, setPhases] = useState<PhaseConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_phases');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If stored data contains the old demo 7,650,000 sold, reset to clean real state
          if (parsed?.[0]?.tokensSold === 7650000) {
            localStorage.removeItem('nxbc_admin_phases');
          } else {
            return parsed;
          }
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
        totalSupply: 1000000, // 10 Lakh (5 Lakh Sale, 5 Lakh Reserve)
        tokensSold: 0,
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Active Now',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 2500000, // 25 Lakh
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
        rate: 1.00,
        rateLabel: '$1.00',
        totalSupply: 7000000, // 70 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '100x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 10.00,
        rateLabel: '$10.00',
        totalSupply: 19500000, // 195 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '1000x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 100.00,
        rateLabel: '$100.00',
        totalSupply: 40000000, // 400 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '10000x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'DEX Launch',
        shortName: 'DEX',
        rate: 100.00,
        rateLabel: 'Market Rate',
        totalSupply: 0,
        tokensSold: 0,
        status: 'locked',
        multiplier: 'Open Market Trading',
        unlockRequirement: 'Phase 5 must be 100% sold to unlock',
      },
    ]});

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


  const [userEarnings, setUserEarnings] = useState<UserEarnings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_user_earnings');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return { availableUsdt: 0, withdrawnUsdt: 0 };
  });

  const [sellQueue, setSellQueue] = useState<QueueEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_sell_queue');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_user_earnings', JSON.stringify(userEarnings));
    }
  }, [userEarnings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_sell_queue', JSON.stringify(sellQueue));
    }
  }, [sellQueue]);

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
      // If currently on admin page, do not overwrite what the admin is viewing/editing
      if (
        typeof window !== 'undefined' &&
        (window.location.hash.toLowerCase().includes('admin') ||
          window.location.pathname.toLowerCase().includes('admin') ||
          window.location.search.toLowerCase().includes('admin'))
      ) {
        return;
      }

      try {
        const res = await fetch('/api/admin/configs');
        const data = await res.json();
        if (data?.success) {
          if (data.phases && Array.isArray(data.phases) && data.phases.length > 0) {
            setPhases((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.phases)) {
                localStorage.setItem('nxbc_admin_phases', JSON.stringify(data.phases));
                return data.phases;
              }
              return prev;
            });
          }
          if (data.referralLevels && Array.isArray(data.referralLevels) && data.referralLevels.length > 0) {
            setReferralLevels((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.referralLevels)) {
                localStorage.setItem('nxbc_admin_levels', JSON.stringify(data.referralLevels));
                return data.referralLevels;
              }
              return prev;
            });
          }
          if (data.rankRewards && Array.isArray(data.rankRewards) && data.rankRewards.length > 0) {
            setRankRewards((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.rankRewards)) {
                localStorage.setItem('nxbc_admin_ranks', JSON.stringify(data.rankRewards));
                return data.rankRewards;
              }
              return prev;
            });
          }
          if (data.systemConfig && typeof data.systemConfig === 'object') {
            setSystemConfig((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.systemConfig)) {
                localStorage.setItem('nxbc_admin_system', JSON.stringify(data.systemConfig));
                return data.systemConfig;
              }
              return prev;
            });
          }
          if (data.matrixConfig && typeof data.matrixConfig === 'object') {
            setMatrixConfig((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.matrixConfig)) {
                localStorage.setItem('nxbc_admin_matrix', JSON.stringify(data.matrixConfig));
                return data.matrixConfig;
              }
              return prev;
            });
          }
        }
      } catch (err) {}
    };

    fetchLatestServerConfigs();
    // Poll server every 5 seconds for live user dashboards
    const syncInterval = setInterval(fetchLatestServerConfigs, 5000);

    // Cross-tab storage listener for immediate instant sync across browser tabs
    const handleStorageEvent = (e: StorageEvent) => {
      // Ignore storage sync events if currently on admin page
      if (
        typeof window !== 'undefined' &&
        (window.location.hash.toLowerCase().includes('admin') ||
          window.location.pathname.toLowerCase().includes('admin'))
      ) {
        return;
      }

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
  const defaultPlanLevels: ReferralLevel[] = [
    { level: 1, commissionPercent: 3, directRequirement: 1, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 2, commissionPercent: 2, directRequirement: 2, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 3, commissionPercent: 1, directRequirement: 3, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 4, commissionPercent: 1, directRequirement: 4, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 5, commissionPercent: 0.5, directRequirement: 5, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 6, commissionPercent: 0.5, directRequirement: 6, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 7, commissionPercent: 0.5, directRequirement: 7, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 8, commissionPercent: 0.5, directRequirement: 8, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 9, commissionPercent: 0.5, directRequirement: 9, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
    { level: 10, commissionPercent: 0.5, directRequirement: 10, directMembers: 0, totalVolumeUsd: 0, earnedUsd: 0 },
  ];

  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_levels');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.[0]?.commissionPercent === 10 || parsed?.[1]?.commissionPercent === 5) {
            localStorage.setItem('nxbc_admin_levels', JSON.stringify(defaultPlanLevels));
            return defaultPlanLevels;
          }
          return parsed;
        } catch (e) {}
      }
    }
    return defaultPlanLevels;
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
  const defaultRankRewards: RankReward[] = [
    {
      id: 'rank-1',
      rankNumber: 1,
      name: 'Team Development Fund',
      requiredDirectVolume: 50000,
      requiredTeamVolume: 0,
      requiredDirects: 5,
      rewardType: 'fund',
      rewardTitle: '$100 Team Development Fund',
      oneTimeBonusUsd: 100,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 1,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-2',
      rankNumber: 2,
      name: 'Monthly Leadership Salary',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 0,
      requiredDirects: 10,
      rewardType: 'salary',
      rewardTitle: '$100 / Month (12 Months Salary)',
      oneTimeBonusUsd: 1200,
      monthlySalaryUsd: 100,
      salaryMonths: 12,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 2,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-3',
      rankNumber: 3,
      name: 'Travel Tour Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 150000,
      requiredDirects: 15,
      rewardType: 'travel',
      rewardTitle: '$500 International Travel Fund',
      oneTimeBonusUsd: 500,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 3,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-4',
      rankNumber: 4,
      name: 'Dream Car Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 2000000,
      requiredDirects: 20,
      rewardType: 'car',
      rewardTitle: 'Dream Car Fund ($50,000 USD Value)',
      oneTimeBonusUsd: 50000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 4,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-5',
      rankNumber: 5,
      name: 'Luxury House Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 5000000,
      requiredDirects: 25,
      rewardType: 'house',
      rewardTitle: 'Luxury House Fund ($100,000 USD Value)',
      oneTimeBonusUsd: 100000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 5,
      currentQualifiedCount: 0,
      status: 'locked',
    },
  ];

  const [rankRewards, setRankRewards] = useState<RankReward[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_ranks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed?.[0]?.name === 'Bronze Leader' ||
            parsed?.[0]?.requiredDirectVolume === undefined ||
            parsed?.[3]?.oneTimeBonusUsd !== 50000 ||
            parsed?.[4]?.oneTimeBonusUsd !== 100000 ||
            parsed?.[0]?.rewardTokens > 0
          ) {
            localStorage.setItem('nxbc_admin_ranks', JSON.stringify(defaultRankRewards));
            return defaultRankRewards;
          }
          return parsed;
        } catch (e) {}
      }
    }
    return defaultRankRewards;
  });

  // General System & Global Parameters (Dynamic via Admin & Persisted)
  const [systemConfig, setSystemConfig] = useState<AdminSystemConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_admin_system');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.directSponsorPercent === 5) {
            parsed.directSponsorPercent = 10;
            localStorage.setItem('nxbc_admin_system', JSON.stringify(parsed));
          }
          return parsed;
        } catch (e) {}
      }
    }
    return {
      tokenName: 'NXBC',
      tokenSymbol: 'NXBC',
      contractAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
      receivingAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
      minPurchaseUsd: 1,
      maxPurchaseUsd: 50000,
      minMlmQualifyUsd: 100,
      presalePaused: false,
      directSponsorPercent: 10,
      withdrawalFeePercent: 2,
      matrixConfig: {
        placementIncomeUsd: 1.00,
        uplineSharePercent: 10,
        enabled: true,
      },
      royaltyPoolUsd: 0,
    };
  });

  // 2x2 Matrix Structure Nodes Data (Clean Real Tree)
  const matrixNodes: MatrixNode[] = [
    { id: 'm-0', name: walletConnected ? 'You (Active)' : 'You (Root)', wallet: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Connect Wallet', position: 'root', status: walletConnected ? 'filled' : 'empty', avatarSeed: 'root', earningsUsd: 0 },
    { id: 'm-1', name: 'Open Slot', wallet: 'Empty', position: 'L1_left', status: 'empty', avatarSeed: 'l1', earningsUsd: 0 },
    { id: 'm-2', name: 'Open Slot', wallet: 'Empty', position: 'L1_right', status: 'empty', avatarSeed: 'l2', earningsUsd: 0 },
    { id: 'm-3', name: 'Open Slot', wallet: 'Empty', position: 'L2_LL', status: 'empty', avatarSeed: 'l3', earningsUsd: 0 },
    { id: 'm-4', name: 'Open Slot', wallet: 'Empty', position: 'L2_LR', status: 'empty', avatarSeed: 'l4', earningsUsd: 0 },
    { id: 'm-5', name: 'Open Slot', wallet: 'Empty', position: 'L2_RL', status: 'empty', avatarSeed: 'l5', earningsUsd: 0 },
    { id: 'm-6', name: 'Open Slot', wallet: 'Empty', position: 'L2_RR', status: 'empty', avatarSeed: 'l6', earningsUsd: 0 },
  ];

  // Modals state
  const [buyModalOpen, setBuyModalOpen] = useState<boolean>(false);
  const [swapModalOpen, setSwapModalOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  // 2-Token Balances: NXBUSD ($1.00 Utility Token) & USDT (BEP-20)
  const [nxbusdBalance, setNxbusdBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('nxbc_nxbusd_balance');
      if (s) return parseFloat(s) || 0;
    }
    return 0;
  });

  const [usdtBalance, setUsdtBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('nxbc_usdt_balance');
      if (s) return parseFloat(s) || 0;
    }
    return 250;
  });

  const handleSwapSuccess = (fromToken: 'USDT' | 'NXBUSD', toToken: 'USDT' | 'NXBUSD', amount: number) => {
    if (fromToken === 'USDT') {
      setUsdtBalance((prev) => {
        const next = Math.max(0, prev - amount);
        localStorage.setItem('nxbc_usdt_balance', next.toString());
        return next;
      });
      setNxbusdBalance((prev) => {
        const next = prev + amount;
        localStorage.setItem('nxbc_nxbusd_balance', next.toString());
        return next;
      });
    } else {
      setNxbusdBalance((prev) => {
        const next = Math.max(0, prev - amount);
        localStorage.setItem('nxbc_nxbusd_balance', next.toString());
        return next;
      });
      setUsdtBalance((prev) => {
        const next = prev + amount;
        localStorage.setItem('nxbc_usdt_balance', next.toString());
        return next;
      });
    }

    const newTx: Transaction = {
      id: `tx-swap-${Date.now()}`,
      type: 'referral_bonus',
      title: `1:1 Swap: ${amount} ${fromToken} ➔ ${amount} ${toToken}`,
      amountUsd: amount,
      timestamp: 'Just now',
      status: 'completed',
      txHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

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

    
    const p2TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p2Percent / 100));
    const p3TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p3Percent / 100));
    const p4TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p4Percent / 100));
    const p5TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p5Percent / 100));

    const updatedAlloc: AllocationState = {
      p2Percent: sellAlloc.p2Percent,
      p3Percent: sellAlloc.p3Percent,
      p4Percent: sellAlloc.p4Percent,
      p5Percent: sellAlloc.p5Percent,
      dexPercent: sellAlloc.dexPercent,
      unallocatedPercent: sellAlloc.unallocatedPercent,
      p2Tokens: {
        allocated: (allocation.p2Tokens?.allocated || 0) + p2TokensAllocated,
        sold: allocation.p2Tokens?.sold || 0,
      },
      p3Tokens: {
        allocated: (allocation.p3Tokens?.allocated || 0) + p3TokensAllocated,
        sold: allocation.p3Tokens?.sold || 0,
      },
      p4Tokens: {
        allocated: (allocation.p4Tokens?.allocated || 0) + p4TokensAllocated,
        sold: allocation.p4Tokens?.sold || 0,
      },
      p5Tokens: {
        allocated: (allocation.p5Tokens?.allocated || 0) + p5TokensAllocated,
        sold: allocation.p5Tokens?.sold || 0,
      },
      totalTokensPurchased: allocation.totalTokensPurchased + tokenAmount,
      isLocked: true,
      lockedTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Add to global sell queue
    const newQueueEntries = [];
    if (p2TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 2, tokensRequested: p2TokensAllocated, tokensSold: 0 });
    if (p3TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 3, tokensRequested: p3TokensAllocated, tokensSold: 0 });
    if (p4TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 4, tokensRequested: p4TokensAllocated, tokensSold: 0 });
    if (p5TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 5, tokensRequested: p5TokensAllocated, tokensSold: 0 });

    setSellQueue(prev => [...prev, ...newQueueEntries]);

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
  
  const handleSimulateExternalBuy = (amount: number) => {
    // Determine current active phase
    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) return; // No active phase
    const currentPhase = phases[activeIdx];
    
    // Total tokens purchased by the external buyer
    // 20% of this goes to fulfilling user queued sell orders
    const userAllocationFulfillment = Math.floor(amount * 0.20);
    let remainingToFulfill = userAllocationFulfillment;
    let earnedUsdt = 0;

    setSellQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      let queueUpdated = false;

      for (let i = 0; i < newQueue.length; i++) {
        const entry = newQueue[i];
        if (entry.phaseNumber === currentPhase.phaseNumber && entry.tokensSold < entry.tokensRequested) {
          queueUpdated = true;
          const tokensNeeded = entry.tokensRequested - entry.tokensSold;
          if (remainingToFulfill >= tokensNeeded) {
            // Completely fulfill this entry
            remainingToFulfill -= tokensNeeded;
            entry.tokensSold = entry.tokensRequested;
            earnedUsdt += tokensNeeded * currentPhase.rate;
          } else {
            // Partially fulfill
            entry.tokensSold += remainingToFulfill;
            earnedUsdt += remainingToFulfill * currentPhase.rate;
            remainingToFulfill = 0;
            break; // Used up all fulfillment allocation
          }
        }
      }
      return queueUpdated ? newQueue : prevQueue;
    });

    if (earnedUsdt > 0) {
      setUserEarnings((prev) => ({
        ...prev,
        availableUsdt: prev.availableUsdt + earnedUsdt
      }));
      
      // Update allocation state sold counts for the user
      setAllocation((prev) => {
         const newAlloc = { ...prev };
         const soldTokens = userAllocationFulfillment - remainingToFulfill;
         if (currentPhase.phaseNumber === 2 && newAlloc.p2Tokens) newAlloc.p2Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 3 && newAlloc.p3Tokens) newAlloc.p3Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 4 && newAlloc.p4Tokens) newAlloc.p4Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 5 && newAlloc.p5Tokens) newAlloc.p5Tokens.sold += soldTokens;
         return newAlloc;
      });
    }
    
    // Also increase total tokens sold in the phase so it moves forward
    setPhases((prevPhases) => {
      return prevPhases.map((p, idx) => {
        if (idx === activeIdx) {
           return { ...p, tokensSold: Math.min(p.totalSupply, p.tokensSold + amount) };
        }
        return p;
      });
    });
  };

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
        totalSupply: 1000000, // 10 Lakh (5 Lakh Sale, 5 Lakh Reserve)
        tokensSold: 0,
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Active Now',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 2500000, // 25 Lakh
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
        rate: 1.00,
        rateLabel: '$1.00',
        totalSupply: 7000000, // 70 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '100x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 10.00,
        rateLabel: '$10.00',
        totalSupply: 19500000, // 195 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '1000x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 100.00,
        rateLabel: '$100.00',
        totalSupply: 40000000, // 400 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '10000x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'DEX Launch',
        shortName: 'DEX',
        rate: 100.00,
        rateLabel: 'Market Rate',
        totalSupply: 0,
        tokensSold: 0,
        status: 'locked',
        multiplier: 'Open Market Trading',
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
      { level: 1, commissionPercent: 3, directRequirement: 1, directMembers: 8, totalVolumeUsd: 4500, earnedUsd: 135.00 },
      { level: 2, commissionPercent: 2, directRequirement: 2, directMembers: 14, totalVolumeUsd: 3800, earnedUsd: 76.00 },
      { level: 3, commissionPercent: 1, directRequirement: 3, directMembers: 22, totalVolumeUsd: 2900, earnedUsd: 29.00 },
      { level: 4, commissionPercent: 1, directRequirement: 4, directMembers: 31, totalVolumeUsd: 2200, earnedUsd: 22.00 },
      { level: 5, commissionPercent: 0.5, directRequirement: 5, directMembers: 18, totalVolumeUsd: 1800, earnedUsd: 9.00 },
      { level: 6, commissionPercent: 0.5, directRequirement: 6, directMembers: 15, totalVolumeUsd: 1500, earnedUsd: 7.50 },
      { level: 7, commissionPercent: 0.5, directRequirement: 7, directMembers: 12, totalVolumeUsd: 1200, earnedUsd: 6.00 },
      { level: 8, commissionPercent: 0.5, directRequirement: 8, directMembers: 10, totalVolumeUsd: 1400, earnedUsd: 7.00 },
      { level: 9, commissionPercent: 0.5, directRequirement: 9, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 7.50 },
      { level: 10, commissionPercent: 0.5, directRequirement: 10, directMembers: 9, totalVolumeUsd: 1500, earnedUsd: 7.50 },
    ];

    const defaultMatrix: MatrixConfig = {
      placementIncomeUsd: 1.00,
      uplineSharePercent: 10,
      enabled: true,
    };

    const defaultSystem: AdminSystemConfig = {
      tokenName: 'NXBC',
      tokenSymbol: 'NXBC',
      contractAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
      receivingAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
      minPurchaseUsd: 1,
      maxPurchaseUsd: 50000,
      minMlmQualifyUsd: 100,
      presalePaused: false,
      directSponsorPercent: 10,
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
    let remainingToDeduct = amountUsd;
    
    setUserEarnings(prev => {
      if (prev.availableUsdt >= remainingToDeduct) {
        return {
          availableUsdt: prev.availableUsdt - remainingToDeduct,
          withdrawnUsdt: prev.withdrawnUsdt + remainingToDeduct
        };
      } else {
        remainingToDeduct -= prev.availableUsdt;
        return {
          availableUsdt: 0,
          withdrawnUsdt: prev.withdrawnUsdt + prev.availableUsdt
        };
      }
    });

    setClaimableBalanceUsd((prev) => Math.max(0, prev - remainingToDeduct));
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      title: 'Guaranteed OTC Smart Contract Payout',
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

  // Show Landing Page if user hasn't entered dashboard yet
  if (!isAppLaunched) {
    return <LandingPage onLaunch={() => setIsAppLaunched(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#070312] text-slate-100 relative font-['Outfit',sans-serif] selection:bg-[#f59e0b] selection:text-black">
      {/* Background with Dark Analytical Graphs, Candlesticks & 3D Gold Coins */}
      <AnalyticalBackground />

      {/* Main Foreground Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-1 sm:px-4 py-2 sm:py-6 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 sm:mb-4 border-b border-purple-500/20 bg-[#0e0720]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border">
          <div className="flex items-center justify-between w-full md:w-auto">
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
            <button
              onClick={() => setIsAppLaunched(false)}
              className="md:hidden px-2.5 py-1 text-[10px] rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/30 whitespace-nowrap"
            >
              Landing Page
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsAppLaunched(false)}
              className="px-3 py-1.5 text-xs rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 transition-all"
            >
              ← Back to Landing Page
            </button>
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
                  onOpenSwapModal={() => setSwapModalOpen(true)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  onSimulateFillPhase={handleSimulateFillPhase}
                  onSimulateExternalBuy={handleSimulateExternalBuy}
                  onResetPhases={handleResetPhases}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  nxbusdBalance={nxbusdBalance}
                  usdtBalance={usdtBalance}
                />
              )}

              {activeSingleScreen === 'assets' && (
                <ScreenTwoAssets
                  userEarnings={userEarnings}
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
                  claimableBalanceUsd={claimableBalanceUsd + (userEarnings?.availableUsdt || 0)}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenSwapModal={() => setSwapModalOpen(true)}
                  nxbusdBalance={nxbusdBalance}
                  usdtBalance={usdtBalance}
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
                  onOpenSwapModal={() => setSwapModalOpen(true)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  onSimulateFillPhase={handleSimulateFillPhase}
                  onSimulateExternalBuy={handleSimulateExternalBuy}
                  onResetPhases={handleResetPhases}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  nxbusdBalance={nxbusdBalance}
                  usdtBalance={usdtBalance}
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
                  userEarnings={userEarnings}
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
                  claimableBalanceUsd={claimableBalanceUsd + (userEarnings?.availableUsdt || 0)}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenSwapModal={() => setSwapModalOpen(true)}
                  nxbusdBalance={nxbusdBalance}
                  usdtBalance={usdtBalance}
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
        receivingAddress={systemConfig.receivingAddress}
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

      {/* 1:1 USDT ⮂ NXBUSD Swap Modal */}
      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onSwapSuccess={handleSwapSuccess}
        nxbusdBalance={nxbusdBalance}
        usdtBalance={usdtBalance}
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
