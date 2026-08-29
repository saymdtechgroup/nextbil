export interface PhaseConfig {
  id: string;
  phaseNumber: number;
  name: string;
  shortName: string;
  rate: number;
  rateLabel: string;
  totalSupply: number;
  tokensSold: number;
  status: 'active' | 'completed' | 'locked';
  multiplier: string;
  unlockRequirement: string;
  targetDate?: string;
}

export interface AllocationState {
  p2Percent: number;
  p3Percent: number;
  p4Percent: number;
  p5Percent: number;
  dexPercent: number;
  unallocatedPercent: number;
  totalTokensPurchased: number;
  isLocked: boolean;
  lockedTimestamp?: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'allocation_lock' | 'withdrawal' | 'referral_bonus' | 'matrix_spillover';
  title: string;
  amountTokens?: number;
  amountUsd: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'processing';
  txHash: string;
  phase?: string;
}

export interface ReferralLevel {
  level: number;
  commissionPercent: number;
  directRequirement: number;
  directMembers: number;
  totalVolumeUsd: number;
  earnedUsd: number;
}

export interface MatrixConfig {
  placementIncomeUsd: number; // Base placement amount (e.g. $1.00)
  uplineSharePercent: number; // Percentage sent to each of the 10 upline levels (e.g. 10%)
  enabled: boolean;
}

export interface RankReward {
  id: string;
  rankNumber: number;
  name: string;
  requiredDirects: number;
  requiredTeamVolume: number;
  oneTimeBonusUsd: number;
  rewardTokens: number;
  monthlyRoyaltyPercent: number;
  currentQualifiedCount: number;
  status: 'unlocked' | 'locked' | 'claimable';
}

export interface AdminSystemConfig {
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  minPurchaseUsd: number;
  maxPurchaseUsd: number;
  minMlmQualifyUsd: number; // Minimum cumulative investment to qualify for MLM commissions (default $100)
  presalePaused: boolean;
  directSponsorPercent: number;
  withdrawalFeePercent: number;
  matrixConfig: MatrixConfig;
  royaltyPoolUsd: number;
}

export interface MatrixNode {
  id: string;
  name: string;
  wallet: string;
  position: 'root' | 'L1_left' | 'L1_right' | 'L2_LL' | 'L2_LR' | 'L2_RL' | 'L2_RR';
  status: 'filled' | 'empty' | 'spillover';
  avatarSeed: string;
  earningsUsd: number;
}

export type ActiveScreen = 'home' | 'assets' | 'team' | 'withdraw' | 'mine' | 'admin';
export type ViewMode = 'trio' | 'single';

