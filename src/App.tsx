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
import { WalletConnectModal } from './components/WalletConnectModal';
import { TeamPlanModal } from './components/TeamPlanModal';
import { MatrixPlanModal } from './components/MatrixPlanModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SecretAdminPage } from './components/SecretAdminPage';
import { GoldCoinGraphic } from './components/GoldCoinGraphic';
import {
  fetchOnChainTokenBalance,
  USDT_CONTRACT,
  NXBC_CONTRACT,
} from './utils/web3Helper';


const INITIAL_PHASES: PhaseConfig[] = [
  { id: 'p1', phaseNumber: 1, name: 'Phase 1', shortName: 'P1', rate: 0.01, rateLabel: '$0.01', totalSupply: 1000000, tokensSold: 0, status: 'active', multiplier: '1x Base', unlockRequirement: 'Live Now' },
  { id: 'p2', phaseNumber: 2, name: 'Phase 2', shortName: 'P2', rate: 0.10, rateLabel: '$0.10', totalSupply: 2500000, tokensSold: 0, status: 'upcoming', multiplier: '10x', unlockRequirement: 'After P1' },
  { id: 'p3', phaseNumber: 3, name: 'Phase 3', shortName: 'P3', rate: 1.00, rateLabel: '$1.00', totalSupply: 7000000, tokensSold: 0, status: 'upcoming', multiplier: '100x', unlockRequirement: 'After P2' },
  { id: 'p4', phaseNumber: 4, name: 'Phase 4', shortName: 'P4', rate: 10.00, rateLabel: '$10.00', totalSupply: 19500000, tokensSold: 0, status: 'upcoming', multiplier: '1,000x', unlockRequirement: 'After P3' },
  { id: 'p5', phaseNumber: 5, name: 'Phase 5', shortName: 'P5', rate: 100.00, rateLabel: '$100.00', totalSupply: 40000000, tokensSold: 0, status: 'upcoming', multiplier: '10,000x', unlockRequirement: 'After P4' },
];

export default function App() {
  // Default to 'single' full mobile screen mode
  const [isAppLaunched, setIsAppLaunched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeSingleScreen, setActiveSingleScreen] = useState<ActiveScreen>('home');
  const [showSecretAdminPage, setShowSecretAdminPage] = useState<boolean>(false);

  // Core State: 6-Phase Sequential Roadmap & Live Status (Admin Managed & Persisted)
  const [phases, setPhases] = useState<PhaseConfig[]>(INITIAL_PHASES);

  const activePhase = phases.find((p) => p.status === 'active') || phases[0] || {
    phaseNumber: 1,
    name: 'Phase 1',
    shortName: 'P1',
    rate: 0.01,
    totalSupply: 1000000,
    tokensSold: 0
  };



  const [userEarnings, setUserEarnings] = useState<UserEarnings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_user_earnings');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return { availableUsdt: 0, withdrawnUsdt: 0 };
  });

  const [sellQueue, setSellQueue] = useState<QueueEntry[]>([]);
  
  // Fetch Live P2P Sell Orders
  const fetchSellOrders = async () => {
    try {
      const res = await fetch('/api/p2p/orders');
      if (res.ok) {
         const data = await res.json();
         if (data.orders) {
            const mappedQueue = data.orders.map((o: any) => ({
               id: o.id.toString(),
               userId: o.walletAddress || 'Unknown',
               phaseNumber: o.phaseNumber,
               tokensRequested: o.amountTokens,
               tokensSold: o.amountTokens - o.remainingTokens
            }));
            setSellQueue(mappedQueue);
         }
      }
      
      // Also sync user balances to reflect P2P fulfillment or rank rewards
      if (walletConnected && walletAddress) {
         const syncRes = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
         });
         if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.user) {
               setUserEarnings((prev) => ({
                  ...prev,
                  availableUsdt: Number(syncData.user.availableUsdt || 0),
                  mlmAvailableUsdt: Number(syncData.user.availableUsdt || 0),
                  withdrawnUsdt: Number(syncData.user.totalWithdrawnUsdt || 0),
                  tokenSellAvailableUsdt: Number(syncData.tokenSaleAvailableUsdt || prev.tokenSellAvailableUsdt || 0),
                  tokenSellWithdrawnUsdt: Number(syncData.tokenSaleWithdrawnUsdt || prev.tokenSellWithdrawnUsdt || 0),
               }));
               if (syncData.user.referralCode) {
                  setUserRefCode(syncData.user.referralCode);
               }
            }
         }
      }
    } catch (e) {
      console.error("Failed to fetch sell orders", e);
    }
  };

  useEffect(() => {
    fetchSellOrders();
    const interval = setInterval(fetchSellOrders, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_user_earnings', JSON.stringify(userEarnings));
    }
  }, [userEarnings]);

  // (Removed local storage effect for sellQueue)

  // Wallet & Income State (Loads persisted wallet if present, or checks injected web3)
  const [walletConnected, setWalletConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('nxbc_connected_wallet');
    }
    return false;
  });
  const [userRefCode, setUserRefCode] = useState<string>('NXBC-COMMUNITY-0000');
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

  // Public live presale state. Phase price/supply/sold/remaining/status are
  // authoritative on BSC and must never be replaced by admin/localStorage data.
  useEffect(() => {
    let cancelled = false;

    const syncLivePresale = async () => {
      try {
        const res = await fetch('/api/presale/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.success || !Array.isArray(data.phases) || data.phases.length === 0) return;

        const livePhases = data.phases.map((p: any, idx: number) => ({
          id: p.id ? String(p.id) : `p${idx + 1}`,
          phaseNumber: Number(p.phaseNumber || idx + 1),
          name: p.name || `Phase ${idx + 1}`,
          shortName: p.shortName || `P${idx + 1}`,
          rate: Number(p.rate || 0),
          rateLabel: p.rateLabel || `$${Number(p.rate || 0).toFixed(2)}`,
          totalSupply: Number(p.totalSupply || 0),
          tokensSold: Number(p.tokensSold || 0),
          status: p.status || 'upcoming',
          multiplier: '',
          unlockRequirement: p.unlockRequirement || '',
          targetDate: '',
        }));

        setPhases(livePhases);

        if (data.systemConfig && typeof data.systemConfig === 'object') {
          setSystemConfig((prev) => ({
            ...prev,
            ...data.systemConfig,
            sellQueueSharePercent: Number.isFinite(Number(data.systemConfig.sellQueueSharePercent))
              ? Number(data.systemConfig.sellQueueSharePercent)
              : (prev.sellQueueSharePercent ?? 20),
            withdrawalFeePercent: Number.isFinite(Number(data.systemConfig.withdrawalFeePercent))
              ? Number(data.systemConfig.withdrawalFeePercent)
              : (prev.withdrawalFeePercent ?? 2),
          }));
        }
      } catch (err) {
        console.warn('[LIVE PRESALE] Could not read BSC phase state:', err);
      }
    };

    syncLivePresale();
    const interval = window.setInterval(syncLivePresale, 5000);
    window.addEventListener('nxbc:refresh-presale', syncLivePresale);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('nxbc:refresh-presale', syncLivePresale);
    };
  }, []);

  // Admin configuration is private. Normal users must never use this endpoint
  // as a source for public phase financial data.
  useEffect(() => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('nxbc_admin_token') : null;
    if (!adminToken) return;

    const fetchAdminConfigs = async () => {
      try {
        const res = await fetch('/api/admin/configs', {
          headers: { 'x-admin-token': adminToken },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.success) return;

        // Do NOT copy data.phases here. Public phase financial state comes
        // exclusively from /api/presale/config -> BSC.
        if (Array.isArray(data.referralLevels) && data.referralLevels.length > 0) setReferralLevels(data.referralLevels);
        if (Array.isArray(data.rankRewards) && data.rankRewards.length > 0) setRankRewards(data.rankRewards);
        if (data.systemConfig && typeof data.systemConfig === 'object') setSystemConfig(data.systemConfig);
        if (data.matrixConfig && typeof data.matrixConfig === 'object') setMatrixConfig(data.matrixConfig);
      } catch (err) {
        console.warn('[ADMIN CONFIG] Could not load private admin config:', err);
      }
    };

    fetchAdminConfigs();
    const interval = window.setInterval(fetchAdminConfigs, 10000);
    return () => window.clearInterval(interval);
  }, []);

  // Cross-tab storage listener is intentionally limited to non-financial admin
  // configuration. It must not overwrite live BSC phase state.
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'nxbc_admin_levels' && e.newValue) {
        try { setReferralLevels(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'nxbc_admin_ranks' && e.newValue) {
        try { setRankRewards(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'nxbc_admin_system' && e.newValue) {
        try { setSystemConfig(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'nxbc_admin_matrix' && e.newValue) {
        try { setMatrixConfig(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Sync user with PostgreSQL backend when wallet connects
  useEffect(() => {
    if (walletConnected && walletAddress) {
      const sponsorRef = typeof window !== 'undefined' ? localStorage.getItem('nxbc_sponsor_ref') : null;
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          referredBy: sponsorRef || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            console.log('PostgreSQL synced user:', data.user);
            if (data.user.referralCode) {
              setUserRefCode(data.user.referralCode);
            }
          }
        })
        .catch((err) => console.log('PostgreSQL sync notice:', err));
    }
  }, [walletConnected, walletAddress]);

  // Transactions History (Persisted in localStorage)
  
  const [allocation, setAllocation] = useState<AllocationState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nxbc_user_allocation');
      if (stored) {
        try {
          return JSON.parse(stored);
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
    };
  });

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
          if (false) {
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
      requiredDirectVolume: 2000,
      requiredTeamVolume: 3000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$100 Team Development Fund',
      oneTimeBonusUsd: 100,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-2',
      rankNumber: 2,
      name: 'Charity Fund',
      requiredDirectVolume: 50000,
      requiredTeamVolume: 50000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$500 Charity Fund',
      oneTimeBonusUsd: 500,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-3',
      rankNumber: 3,
      name: 'Travel Tour Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 150000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: '$500 International Travel Fund',
      oneTimeBonusUsd: 500,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-4',
      rankNumber: 4,
      name: 'Dream Car Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 2000000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: 'Dream Car Fund ($50,000 USD Value)',
      oneTimeBonusUsd: 50000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
      currentQualifiedCount: 0,
      status: 'locked',
    },
    {
      id: 'rank-5',
      rankNumber: 5,
      name: 'Luxury House Fund',
      requiredDirectVolume: 100000,
      requiredTeamVolume: 5000000,
      requiredDirects: 0,
      rewardType: 'fund',
      rewardTitle: 'Luxury House Fund ($100,000 USD Value)',
      oneTimeBonusUsd: 100000,
      rewardTokens: 0,
      monthlyRoyaltyPercent: 0,
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
          if (parsed?.[0]?.requiredDirectVolume === 50000 || parsed?.[1]?.name === 'Monthly Leadership Salary') {
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
  const [systemConfig, setSystemConfig] = useState<AdminSystemConfig>({
    tokenName: 'NXBC',
    tokenSymbol: 'NXBC',
    contractAddress: '0x94D064AFDB04E3489C313054260929588b38dF85',
    receivingAddress: '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
    minPurchaseUsd: 0.01,
    maxPurchaseUsd: 50000,
    minMlmQualifyUsd: 100,
    presalePaused: false,
    directSponsorPercent: 10,
    withdrawalFeePercent: 2,
    matrixConfig: { placementIncomeUsd: 1, uplineSharePercent: 100, enabled: true },
    royaltyPoolUsd: 25000,
    sellQueueSharePercent: 20,
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
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  const [directBuyerInviteToken, setDirectBuyerInviteToken] = useState('');
  const [directBuyerInfo, setDirectBuyerInfo] = useState<any>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('directBuyer') || '';
    if (!token) return;
    setDirectBuyerInviteToken(token);
    fetch(`/api/presale/direct-buyer/invite/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.success) {
          setDirectBuyerInfo(data);
          setBuyModalOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  // Token Balances
  const [nxbcBalance, setNxbcBalance] = useState<number>(0);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);

  // Automatically fetch live on-chain balances when wallet is connected
  useEffect(() => {
    if (!walletAddress || !walletConnected) return;

    let isMounted = true;
    const fetchBalances = async () => {
      try {
        const [nxChainBalance, uBalance] = await Promise.all([
          fetchOnChainTokenBalance(NXBC_CONTRACT, walletAddress),
          fetchOnChainTokenBalance(USDT_CONTRACT, walletAddress),
        ]);
        if (isMounted) {
          
          setNxbcBalance(Math.max(0, nxChainBalance));
          setUsdtBalance(Math.max(0, uBalance));
        }
      } catch (e) {
        console.warn('Failed to sync on-chain balances:', e);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [walletAddress, walletConnected]);

    
  // Sync User Stats from PostgreSQL Database
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!walletAddress) return;
      try {
        const res = await fetch(`/api/users/${walletAddress}`);
        const data = await res.json();
        if (data && data.user) {
          setTotalInvestedUsd(Number(data.user.totalInvestedUsdt || 0));
          setClaimableBalanceUsd(Number(data.user.availableUsdt || 0));
          setLevelIncomeUsd(Number(data.levelIncomeUsdt || 0));
          setMatrixIncomeUsd(Number(data.matrixIncomeUsdt || 0));
          setUserEarnings((prev) => ({
            ...prev,
            availableUsdt: Number(data.user.availableUsdt || 0),
            mlmAvailableUsdt: Number(data.user.availableUsdt || 0),
            withdrawnUsdt: Number(data.user.totalWithdrawnUsdt || 0),
            tokenSellAvailableUsdt: Number(data.tokenSaleAvailableUsdt || 0),
            tokenSellWithdrawnUsdt: Number(data.tokenSaleWithdrawnUsdt || 0),
          }));

          // IMPORTANT: the database is the authoritative source for purchased NXBC.
          // The wallet is the user's ID in the DApp, so every connected wallet must
          // display its DB total instead of relying only on browser localStorage.
          const dbPurchasedTokens = Math.max(0, Number(data.user.totalPurchasedTokens || 0));
          setAllocation((prev) => {
            if (Number(prev.totalTokensPurchased || 0) === dbPurchasedTokens) return prev;
            const updated = { ...prev, totalTokensPurchased: dbPurchasedTokens };
            if (typeof window !== 'undefined') {
              localStorage.setItem('nxbc_user_allocation', JSON.stringify(updated));
            }
            return updated;
          });
          
          // Optionally calculate matrix specific income from earnings if needed, 
          // For now we map totalEarned to a mix or keep them separate.
          
          if (data.transactions) {
            const mappedTxs = data.transactions.map((t: any) => ({
              id: `tx-${t.id}`,
              type: t.type === 'buy_presale' ? 'buy' : 'income',
              title: t.type === 'buy_presale' ? `Purchase (${t.tokenAmount} NXBC)` : 'Income',
              amountTokens: t.tokenAmount,
              amountUsd: t.amountUsdt,
              timestamp: new Date(t.createdAt).toLocaleString(),
              status: t.status,
              txHash: t.txHash || '',
              phase: `Phase ${t.phaseIndex}`
            }));
            setTransactions(mappedTxs);
          }
        }
      } catch (err) {
        console.error("Failed to sync user stats from DB:", err);
      }
    };
    
    fetchUserStats();
    const interval = setInterval(fetchUserStats, 5000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Purchase handler:
  // - validates that the five user-facing buckets total exactly 100%
  // - never creates a fake Phase 6 / DEX sell order
  // - verifies the blockchain purchase through the backend first
  // - only then persists phase sell reservations
  // - keeps the database/backend authoritative for financial records
  const handleConfirmPurchase = async (
    tokenAmount: number,
    usdAmount: number,
    sellAlloc: {
      p2Percent: number;
      p3Percent: number;
      p4Percent: number;
      p5Percent: number;
      dexPercent: number;
      unallocatedPercent: number;
    },
    txHash?: string,
    currency: 'USDT' = 'USDT',
    directBuyerInviteToken?: string
  ) => {
    if (!walletAddress) {
      throw new Error('Please connect your wallet first.');
    }

    if (!txHash) {
      throw new Error('Purchase transaction hash is required.');
    }

    const safeTokenAmount = Number(tokenAmount);
    const safeUsdAmount = Number(usdAmount);

    if (!Number.isFinite(safeTokenAmount) || safeTokenAmount <= 0) {
      throw new Error('Invalid NXBC token amount.');
    }
    if (!Number.isFinite(safeUsdAmount) || safeUsdAmount <= 0) {
      throw new Error('Invalid USDT purchase amount.');
    }
    if (currency !== 'USDT') {
      throw new Error('Only USDT purchases are supported.');
    }

    if (systemConfig.presalePaused) {
      throw new Error('Presale is currently paused by the System.');
    }

    // Use the current server-synced phase state. The backend remains the final
    // authority and will verify the on-chain purchase before recording it.
    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) {
      throw new Error('Presale has ended or no active phase is available.');
    }

    const currentP = phases[activeIdx];
    const maxAvailable = Math.max(
      0,
      Number(currentP.totalSupply || 0) - Number(currentP.tokensSold || 0)
    );

    if (safeTokenAmount > maxAvailable + 0.000000001) {
      throw new Error(
        `Purchase exceeds the remaining ${currentP.shortName || `Phase ${currentP.phaseNumber}`} allocation. ` +
        `Maximum available: ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol}.`
      );
    }

    const p2Percent = Math.max(0, Number(sellAlloc.p2Percent || 0));
    const p3Percent = Math.max(0, Number(sellAlloc.p3Percent || 0));
    const p4Percent = Math.max(0, Number(sellAlloc.p4Percent || 0));
    const p5Percent = Math.max(0, Number(sellAlloc.p5Percent || 0));
    const dexPercent = Math.max(0, Number(sellAlloc.dexPercent || 0));

    const percentTotal = p2Percent + p3Percent + p4Percent + p5Percent + dexPercent;

    // DEX/LIVE is a display/allocation bucket only. It must not become a
    // Phase 6 sell order because the production presale has only P1-P5.
    if (Math.abs(percentTotal - 100) > 0.000001) {
      throw new Error(
        `Allocation must equal 100%. Current allocation is ${percentTotal.toFixed(2)}%.`
      );
    }

    const p2TokensAllocated = currentP.phaseNumber < 2 ? safeTokenAmount * p2Percent / 100 : 0;
    const p3TokensAllocated = currentP.phaseNumber < 3 ? safeTokenAmount * p3Percent / 100 : 0;
    const p4TokensAllocated = currentP.phaseNumber < 4 ? safeTokenAmount * p4Percent / 100 : 0;
    const p5TokensAllocated = currentP.phaseNumber < 5 ? safeTokenAmount * p5Percent / 100 : 0;
    const invalidPastAllocation = (currentP.phaseNumber >= 2 && p2Percent > 0) || (currentP.phaseNumber >= 3 && p3Percent > 0) || (currentP.phaseNumber >= 4 && p4Percent > 0) || (currentP.phaseNumber >= 5 && p5Percent > 0);
    if (invalidPastAllocation) throw new Error(`Allocation contains the current or a completed phase. Only future phases after P${currentP.phaseNumber} and DEX / LIVE are allowed.`);

    // DEX/LIVE receives the exact mathematical remainder so floating-point
    // rounding cannot create a hidden/unallocated token amount.
    const dexTokens =
      safeTokenAmount -
      p2TokensAllocated -
      p3TokensAllocated -
      p4TokensAllocated -
      p5TokensAllocated;

    const allocationTotal =
      p2TokensAllocated +
      p3TokensAllocated +
      p4TokensAllocated +
      p5TokensAllocated +
      dexTokens;

    if (Math.abs(allocationTotal - safeTokenAmount) > 0.000000001) {
      throw new Error('Allocation calculation mismatch. Purchase was not submitted.');
    }

    const updatedAlloc: AllocationState = {
      ...allocation,
      p2Percent,
      p3Percent,
      p4Percent,
      p5Percent,
      dexPercent,
      unallocatedPercent: 0,
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
      totalTokensPurchased: Number(allocation.totalTokensPurchased || 0) + safeTokenAmount,
      isLocked: true,
      lockedTimestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // STEP 1: backend verifies the on-chain transaction and finalizes the
    // purchase. Do not change balances/local financial state before success.
    const buyResponse = await fetch('/api/presale/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        amountUsdt: safeUsdAmount,
        tokenAmount: safeTokenAmount,
        tokenPrice: Number(currentP.rate || 0),
        phaseIndex: currentP.phaseNumber,
        txHash,
        directBuyerInviteToken: directBuyerInviteToken || undefined,
      }),
    });

    const buyData = await buyResponse.json().catch(() => ({}));

    if (!buyResponse.ok || !buyData.success) {
      throw new Error(
        buyData.error || 'Purchase could not be verified and recorded by the server.'
      );
    }

    // The direct-buyer token is single-use; clear it after the verified purchase
    // so a later normal purchase from the same browser cannot accidentally reuse it.
    if (directBuyerInviteToken) {
      setDirectBuyerInviteToken('');
      setDirectBuyerInfo(null);
      if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);
    }

    // STEP 2: save only P2-P5 sell reservations. DEX/LIVE is deliberately
    // excluded from the FIFO reservation API and therefore cannot create a
    // bogus FIFO number or an invalid Phase 6 allocation.
    const allocations = [
      { phaseNumber: 2, amountTokens: p2TokensAllocated },
      { phaseNumber: 3, amountTokens: p3TokensAllocated },
      { phaseNumber: 4, amountTokens: p4TokensAllocated },
      { phaseNumber: 5, amountTokens: p5TokensAllocated },
    ].filter((item) => item.amountTokens > 0);

    if (allocations.length > 0 || dexTokens > 0) {
      try {
        const allocationResponse = await fetch('/api/presale/allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            allocations,
            liveHoldTokens: dexTokens,
            purchaseTxHash: txHash,
          }),
        });

        const allocationData = await allocationResponse.json().catch(() => ({}));
        if (!allocationResponse.ok || !allocationData.success) {
          console.warn('First allocation attempt returned:', allocationData.error);
          // Quick retry in 600ms
          await new Promise((r) => setTimeout(r, 600));
          await fetch('/api/presale/allocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress,
              allocations,
              liveHoldTokens: dexTokens,
              purchaseTxHash: txHash,
            }),
          }).catch((err) => console.warn('Allocation retry error:', err));
        }
      } catch (allocErr) {
        console.warn('Phase sell allocation notice:', allocErr);
      }
    }

    // STEP 3: update local UI only after backend success.
    // Immediately re-read both blockchain balances so the Home/Buy UI reflects
    // the actual post-purchase wallet state instead of waiting for the 15s poll.
    try {
      const [freshNxbc, freshUsdt] = await Promise.all([
        fetchOnChainTokenBalance(NXBC_CONTRACT, walletAddress),
        fetchOnChainTokenBalance(USDT_CONTRACT, walletAddress),
      ]);
      setNxbcBalance(Math.max(0, freshNxbc));
      setUsdtBalance(Math.max(0, freshUsdt));

    } catch (balanceRefreshError) {
      console.warn('Immediate post-purchase wallet balance refresh failed:', balanceRefreshError);
    }

    setAllocation(updatedAlloc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_user_allocation', JSON.stringify(updatedAlloc));
    }

    // On-chain wallet balance is re-read by the balance polling effect.
    // Do not fabricate a local USDT/NXBC balance after purchase.

    // Refresh the DB-backed user state after the confirmed purchase.
    try {
      const userResponse = await fetch(`/api/users/${walletAddress}`);
      const userData = await userResponse.json().catch(() => ({}));
      if (userData?.user) {
        setTotalInvestedUsd(Number(userData.user.totalInvestedUsdt || 0));
        setClaimableBalanceUsd(Number(userData.user.availableUsdt || 0));
      }
    } catch (refreshError) {
      console.warn('User balance refresh after purchase failed:', refreshError);
    }

    // Reload personal sale orders so the Assets screen receives the real FIFO
    // number from the backend instead of inventing one on the frontend.
    try {
      window.dispatchEvent(new CustomEvent('nxbc:refresh-sale-orders'));
      window.dispatchEvent(new CustomEvent('nxbc:refresh-presale'));
    } catch {}

    setBuyModalOpen(false);
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
      headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' && localStorage.getItem('nxbc_admin_token') ? { 'x-admin-token': localStorage.getItem('nxbc_admin_token') as string } : {}) },
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
    
    // Dynamic user seller allocation fulfillment based on Admin systemConfig
    const userAllocationFulfillment = Math.floor(amount * ((systemConfig.sellQueueSharePercent ?? 20) / 100));
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
      const updatedPhases = prevPhases.map((p, idx) => {
        if (idx === activeIdx) {
           return { ...p, tokensSold: Math.min(p.totalSupply, p.tokensSold + amount) };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('nxbc_admin_phases', JSON.stringify(updatedPhases));
      }
      syncConfigsToServer({ phases: updatedPhases });
      return updatedPhases;
    });
  };

  const handleSimulateFillPhase = () => {
    setPhases((prevPhases) => {
      const activeIdx = prevPhases.findIndex((p) => p.status === 'active');
      if (activeIdx === -1 || activeIdx >= prevPhases.length - 1) return prevPhases;

      const currentP = prevPhases[activeIdx];
      const nextIdx = activeIdx + 1;

      const updatedPhases = prevPhases.map((p, idx) => {
        if (idx === activeIdx) {
          return { ...p, tokensSold: p.totalSupply, status: 'completed' as const };
        }
        if (idx === nextIdx) {
          return { ...p, tokensSold: 0, status: 'active' as const };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('nxbc_admin_phases', JSON.stringify(updatedPhases));
      }
      syncConfigsToServer({ phases: updatedPhases });
      return updatedPhases;
    });
  };

  // Helper to reset phases back to Phase 1 defaults
  const handleResetPhases = () => {
    const initialPhases: PhaseConfig[] = [
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
    ];
    setPhases(initialPhases);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_admin_phases', JSON.stringify(initialPhases));
    }
    syncConfigsToServer({ phases: initialPhases });
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
        rate: 1.00,
        rateLabel: '$1.00',
        totalSupply: 7000000,
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
        totalSupply: 19500000,
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
        totalSupply: 40000000,
        tokensSold: 0,
        status: 'locked',
        multiplier: '10000x Growth',
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
      contractAddress: '0x94D064AFDB04E3489C313054260929588b38dF85',
      receivingAddress: '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
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

  // Withdrawal handler - supports strictly separated Token Auto-Sell & MLM Earnings wallets
  const handleWithdraw = (amountUsd: number, walletType: 'token_sell' | 'mlm' = 'mlm', txHashParam?: string) => {
    if (amountUsd <= 0) {
      console.warn('Withdrawal rejected: invalid amount');
      return;
    }

    if (walletType === 'token_sell') {
      const availTokenSell = userEarnings?.tokenSellAvailableUsdt || 0;
      if (amountUsd > availTokenSell) {
        console.warn('Withdrawal rejected: insufficient token sell balance');
        return;
      }

      setUserEarnings(prev => ({
        ...prev,
        tokenSellAvailableUsdt: Math.max(0, (prev.tokenSellAvailableUsdt || 0) - amountUsd),
        tokenSellWithdrawnUsdt: (prev.tokenSellWithdrawnUsdt || 0) + amountUsd,
      }));

      const newTx: Transaction = {
        id: `tx-sell-${Date.now()}`,
        type: 'withdrawal',
        walletType: 'token_sell',
        title: 'Token Auto-Sell Settlement Payout',
        amountUsd: amountUsd,
        timestamp: 'Just now',
        status: 'completed',
        txHash: txHashParam || '',
      };
      setTransactions((prev) => [newTx, ...prev]);
    } else {
      if (amountUsd > claimableBalanceUsd) {
        console.warn('Withdrawal rejected: insufficient MLM earnings balance');
        return;
      }

      setClaimableBalanceUsd((prev) => {
        const next = Math.max(0, prev - amountUsd);
        if (typeof window !== 'undefined') localStorage.setItem('nxbc_claimable_usd', next.toString());
        return next;
      });

      const newTx: Transaction = {
        id: `tx-mlm-${Date.now()}`,
        type: 'withdrawal',
        walletType: 'mlm',
        title: 'MLM & Affiliate Earnings Payout',
        amountUsd: amountUsd,
        timestamp: 'Just now',
        status: 'completed',
        txHash: txHashParam || '',
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
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
        sellQueue={sellQueue}
        onUpdatePhases={handleUpdatePhases}
        onUpdateReferralLevels={handleUpdateReferralLevels}
        onUpdateRankRewards={handleUpdateRankRewards}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onUpdateMatrixConfig={handleUpdateMatrixConfig}
        onUpdateSellQueue={async (newQueue) => {
          const rateMap: Record<number, number> = {
            2: 0.10,
            3: 1.00,
            4: 10.00,
            5: 100.00,
          };
          phases.forEach((p) => {
            if (p.phaseNumber && p.rate) {
              rateMap[p.phaseNumber] = p.rate;
            }
          });

          // Sync fulfillment to PostgreSQL DB for the connected user
          if (walletAddress) {
            for (let i = 0; i < newQueue.length; i++) {
              const oldEntry = sellQueue[i];
              const newEntry = newQueue[i];
              if (newEntry && oldEntry && newEntry.tokensSold > oldEntry.tokensSold) {
                const newlySold = newEntry.tokensSold - oldEntry.tokensSold;
                const phasePrice = rateMap[newEntry.phaseNumber] || 0.10;
                const grossUsdt = newlySold * phasePrice;
                try {
                  await fetch('/api/wallet/token-sell-ledger/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      walletAddress: walletAddress,
                      phaseIndex: newEntry.phaseNumber,
                      phaseName: `Phase ${newEntry.phaseNumber}`,
                      tokenPrice: phasePrice,
                      tokensSold: newlySold,
                      grossUsdt: grossUsdt
                    })
                  });
                } catch (e) {
                  console.error("DB Sync Error:", e);
                }
              }
            }
          }

          try {
            if (typeof window !== 'undefined') {
              const adminToken = localStorage.getItem('nxbc_admin_token');
              if (adminToken) {
                await fetch('/api/admin/sellqueue/reorder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
                  body: JSON.stringify({ orderIds: newQueue.map((q) => Number(q.id)) })
                });
              }
            }
          } catch (e) { console.error('Queue reorder persistence error:', e); }
          setSellQueue(newQueue);
          if (typeof window !== 'undefined') localStorage.setItem('nxbc_sell_queue', JSON.stringify(newQueue));

          // Compute total fulfilled USDT based on phase rates
          let totalEarnedUsdt = 0;
          let p2Sold = 0;
          let p3Sold = 0;
          let p4Sold = 0;
          let p5Sold = 0;

          newQueue.forEach((entry) => {
            const sold = entry.tokensSold || 0;
            const rate = rateMap[entry.phaseNumber] || 0.10;
            totalEarnedUsdt += sold * rate;

            if (entry.phaseNumber === 2) p2Sold += sold;
            if (entry.phaseNumber === 3) p3Sold += sold;
            if (entry.phaseNumber === 4) p4Sold += sold;
            if (entry.phaseNumber === 5) p5Sold += sold;
          });

          if (totalEarnedUsdt > 0) {
            setUserEarnings((prev) => {
              const updated = {
                ...prev,
                availableUsdt: Math.max(prev.availableUsdt, totalEarnedUsdt - (prev.withdrawnUsdt || 0)),
              };
              if (typeof window !== 'undefined') {
                localStorage.setItem('nxbc_user_earnings', JSON.stringify(updated));
              }
              return updated;
            });

            setAllocation((prev) => {
              const updated = {
                ...prev,
                p2Tokens: prev.p2Tokens ? { ...prev.p2Tokens, sold: p2Sold } : undefined,
                p3Tokens: prev.p3Tokens ? { ...prev.p3Tokens, sold: p3Sold } : undefined,
                p4Tokens: prev.p4Tokens ? { ...prev.p4Tokens, sold: p4Sold } : undefined,
                p5Tokens: prev.p5Tokens ? { ...prev.p5Tokens, sold: p5Sold } : undefined,
              };
              if (typeof window !== 'undefined') {
                localStorage.setItem('nxbc_user_allocation', JSON.stringify(updated));
              }
              return updated;
            });
          }
        }}
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
          <div className="flex items-center justify-between w-full">
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
                  onSimulateExternalBuy={handleSimulateExternalBuy}
                  onResetPhases={handleResetPhases}
                  onNavigate={(screen) => {
                    setViewMode('single');
                    setActiveSingleScreen(screen);
                  }}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  nxbcBalance={nxbcBalance}
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
                  walletAddress={walletAddress}
                  walletConnected={walletConnected}
                  sellQueueSharePercent={systemConfig?.sellQueueSharePercent}
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
                  tokenSellBalanceUsd={userEarnings?.tokenSellAvailableUsdt || 0}
                  mlmBalanceUsd={claimableBalanceUsd}
                  allocation={allocation}
                  levelIncomeUsd={levelIncomeUsd}
                  matrixIncomeUsd={matrixIncomeUsd}
                  withdrawalFeePercent={systemConfig.withdrawalFeePercent}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  
                  nxbcBalance={nxbcBalance}
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
                  
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  onOpenTeamPlanModal={() => setTeamModalOpen(true)}
                  onOpenMatrixModal={() => setMatrixModalOpen(true)}
                  onSimulateFillPhase={handleSimulateFillPhase}
                  onSimulateExternalBuy={handleSimulateExternalBuy}
                  onResetPhases={handleResetPhases}
                  onNavigate={(screen) => {
                    setViewMode('single');
                    setActiveSingleScreen(screen);
                  }}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  nxbcBalance={nxbcBalance}
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
                  walletAddress={walletAddress}
                  walletConnected={walletConnected}
                  sellQueueSharePercent={systemConfig?.sellQueueSharePercent}
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
                  tokenSellBalanceUsd={userEarnings?.tokenSellAvailableUsdt || 0}
                  mlmBalanceUsd={claimableBalanceUsd}
                  allocation={allocation}
                  levelIncomeUsd={levelIncomeUsd}
                  matrixIncomeUsd={matrixIncomeUsd}
                  withdrawalFeePercent={systemConfig.withdrawalFeePercent}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  onToggleWallet={() => setWalletConnected(!walletConnected)}
                  onOpenWalletModal={() => setWalletModalOpen(true)}
                  
                  nxbcBalance={nxbcBalance}
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
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onConfirmPurchase={handleConfirmPurchase}
        currentRate={activePhase.rate}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        contractAddress={systemConfig.contractAddress}
        receivingAddress={systemConfig.receivingAddress}
        minPurchaseUsd={systemConfig.minPurchaseUsd}
        nxbcBalance={nxbcBalance}
                  usdtBalance={usdtBalance}
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
        directBuyerInviteToken={directBuyerInviteToken}
        directBuyerInfo={directBuyerInfo}
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
        referralCode={userRefCode}
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
