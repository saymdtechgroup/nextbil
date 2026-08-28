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

  // Core State: 6-Phase Sequential Roadmap & Live Status (Admin Managed)
  const [phases, setPhases] = useState<PhaseConfig[]>([
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
      multiplier: '10x (+900% ROI)',
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
      multiplier: '20x (+1,900% ROI)',
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
      multiplier: '30x (+2,900% ROI)',
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
      multiplier: '40x (+3,900% ROI)',
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
  ]);

  const activePhase = phases.find((p) => p.status === 'active') || phases[0];

  // Core State: Sell-Through Allocation
  const [allocation, setAllocation] = useState<AllocationState>({
    p2Percent: 20,
    p3Percent: 30,
    p4Percent: 20,
    p5Percent: 15,
    dexPercent: 15,
    unallocatedPercent: 0,
    totalTokensPurchased: 500000, // 500,000 NXBC purchased @ $0.01 = $5,000 USD
    isLocked: true,
    lockedTimestamp: '10:45 AM (Verified)',
  });

  // Wallet & Income State
  const [walletConnected, setWalletConnected] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>('0x71C8a94F16d823E489e2');
  const [claimableBalanceUsd, setClaimableBalanceUsd] = useState<number>(1248.50);
  const [levelIncomeUsd, setLevelIncomeUsd] = useState<number>(860.00);
  const [matrixIncomeUsd, setMatrixIncomeUsd] = useState<number>(388.50);

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

  // Transactions History
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      type: 'buy',
      title: 'Phase 1 Coin Purchase (500,000 NXBC)',
      amountTokens: 500000,
      amountUsd: 5000.00,
      timestamp: '2026-08-25 14:32',
      status: 'completed',
      txHash: '0x8f2a...39d1',
      phase: 'Phase 1 ($0.01)',
    },
    {
      id: 'tx-2',
      type: 'referral_bonus',
      title: 'Level 1 Commission (Direct Referral #884)',
      amountUsd: 250.00,
      timestamp: '2026-08-25 18:10',
      status: 'completed',
      txHash: '0x3c11...91ee',
    },
    {
      id: 'tx-3',
      type: 'matrix_spillover',
      title: '2x2 Matrix Cycle Spillover Bonus',
      amountUsd: 350.00,
      timestamp: '2026-08-26 04:22',
      status: 'completed',
      txHash: '0x7a89...442b',
    },
    {
      id: 'tx-4',
      type: 'withdrawal',
      title: 'Instant Smart Contract Withdrawal',
      amountUsd: 500.00,
      timestamp: '2026-08-26 06:15',
      status: 'completed',
      txHash: '0x10ae...ff90',
    },
  ]);

  // 10-Level Referral Plan Data (Dynamic via Admin)
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([
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
  ]);

  // 2x2 Matrix System Config (Dynamic via Admin)
  const [matrixConfig, setMatrixConfig] = useState<MatrixConfig>({
    placementIncomeUsd: 1.00,
    uplineSharePercent: 10,
    enabled: true,
  });

  // Rank Rewards & Leadership Pool (Dynamic via Admin)
  const [rankRewards, setRankRewards] = useState<RankReward[]>([
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
  ]);

  // General System & Global Parameters (Dynamic via Admin)
  const [systemConfig, setSystemConfig] = useState<AdminSystemConfig>({
    tokenName: 'NXBC Network Coin',
    tokenSymbol: 'NXBC',
    contractAddress: '0x71C8a94F16d823E489e273039d54B3F118a89F',
    minPurchaseUsd: 10,
    maxPurchaseUsd: 50000,
    presalePaused: false,
    directSponsorPercent: 5,
    withdrawalFeePercent: 2,
    matrixConfig: {
      placementIncomeUsd: 1.00,
      uplineSharePercent: 10,
      enabled: true,
    },
    royaltyPoolUsd: 25000,
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

    setAllocation((prev) => ({
      ...prev,
      p2Percent: sellAlloc.p2Percent,
      p3Percent: sellAlloc.p3Percent,
      p4Percent: sellAlloc.p4Percent,
      p5Percent: sellAlloc.p5Percent,
      dexPercent: sellAlloc.dexPercent,
      unallocatedPercent: sellAlloc.unallocatedPercent,
      totalTokensPurchased: prev.totalTokensPurchased + tokenAmount,
      isLocked: true,
      lockedTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

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

    // Credit direct sponsor and level 1 bonuses based on Admin dynamic percentages
    const directBonus = (usdAmount * systemConfig.directSponsorPercent) / 100;
    const l1Bonus = (usdAmount * (referralLevels[0]?.commissionPercent || 10)) / 100;
    const totalBonus = directBonus + l1Bonus;

    setClaimableBalanceUsd((prev) => prev + totalBonus);
    setLevelIncomeUsd((prev) => prev + totalBonus);

    // Record Transaction in PostgreSQL Backend
    fetch('/api/presale/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
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
      timestamp: 'Just now',
      status: 'completed',
      txHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
      phase: `${activePhase.name} ($${activePhase.rate.toFixed(2)})`,
    };
    setTransactions((prev) => [newTx, ...prev]);
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
        multiplier: '10x (+900% ROI)',
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
        multiplier: '20x (+1,900% ROI)',
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
        multiplier: '30x (+2,900% ROI)',
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
        multiplier: '40x (+3,900% ROI)',
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
    handleResetPhases();
    setReferralLevels([
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
    ]);
    setMatrixConfig({
      placementIncomeUsd: 1.00,
      uplineSharePercent: 10,
      enabled: true,
    });
    setSystemConfig({
      tokenName: 'NXBC Network Coin',
      tokenSymbol: 'NXBC',
      contractAddress: '0x71C8a94F16d823E489e273039d54B3F118a89F',
      minPurchaseUsd: 10,
      maxPurchaseUsd: 50000,
      presalePaused: false,
      directSponsorPercent: 5,
      withdrawalFeePercent: 2,
      matrixConfig: {
        placementIncomeUsd: 1.00,
        uplineSharePercent: 10,
        enabled: true,
      },
      royaltyPoolUsd: 25000,
    });
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
        onUpdatePhases={setPhases}
        onUpdateReferralLevels={setReferralLevels}
        onUpdateRankRewards={setRankRewards}
        onUpdateSystemConfig={setSystemConfig}
        onUpdateMatrixConfig={setMatrixConfig}
        onResetToDefaults={handleResetToDefaults}
        onExitAdmin={() => {
          setShowSecretAdminPage(false);
          if (activeSingleScreen === 'admin') {
            setActiveSingleScreen('home');
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
                NXBC is a next-generation utility coin designed for secure, high-yield P2P trading. By participating in this exclusive presale, early adopters secure their allocation at the lowest entry prices. This provides massive growth potential, automated instant payouts via our 80/20 FIFO smart contract, and guaranteed liquidity before the official Decentralized Exchange (DEX) launch.
              </p>
            </div>
          </div>

          {/* Top Controls: Removed Admin buttons and view mode switcher per user request */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Quick Demo Simulator Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="quick-buy-demo-btn"
                onClick={() =>
                  handleConfirmPurchase(100000, 1000, {
                    p2Percent: allocation.p2Percent,
                    p3Percent: allocation.p3Percent,
                    p4Percent: allocation.p4Percent,
                    p5Percent: allocation.p5Percent,
                    dexPercent: allocation.dexPercent,
                    unallocatedPercent: allocation.unallocatedPercent,
                  })
                }
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[11px] font-mono-crypto font-semibold text-amber-300 flex items-center gap-1 transition-all"
                title="Quickly add 100k Coins to test the 6-Box allocation schedule"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+100k Coins</span>
              </button>

              <button
                id="quick-bonus-demo-btn"
                onClick={handleAddDemoBonus}
                className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/40 text-[11px] font-mono-crypto font-semibold text-fuchsia-300 flex items-center gap-1 transition-all"
                title="Inject referral bonus to test Instant Withdrawal"
              >
                <TrendingUp className="w-3 h-3 text-fuchsia-400" />
                <span>+$300 Yield</span>
              </button>
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
                  onOpenAdmin={
                    walletConnected && walletAddress === '0xAdminSecretWalletAddress123'
                      ? () => setShowSecretAdminPage(true)
                      : undefined
                  }
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
        onUpdatePhases={setPhases}
        levels={referralLevels}
        onUpdateLevels={setReferralLevels}
        matrixConfig={matrixConfig}
        onUpdateMatrixConfig={setMatrixConfig}
        rankRewards={rankRewards}
        onUpdateRankRewards={setRankRewards}
        systemConfig={systemConfig}
        onUpdateSystemConfig={setSystemConfig}
        onResetToDefaults={handleResetToDefaults}
        onOpenSecretPage={() => {
          setAdminModalOpen(false);
          setShowSecretAdminPage(true);
        }}
      />
    </div>
  );
}
