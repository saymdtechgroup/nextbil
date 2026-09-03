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
  p2Tokens?: PhaseAllocation;
  p3Tokens?: PhaseAllocation;
  p4Tokens?: PhaseAllocation;
  p5Tokens?: PhaseAllocation;
  totalTokensPurchased: number;
  isLocked: boolean;
  lockedTimestamp?: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'allocation_lock' | 'withdrawal' | 'referral_bonus' | 'matrix_spillover' | 'token_sell_settlement' | 'token_transfer';
  walletType?: 'token_sell' | 'mlm' | 'main';
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
  requiredDirectVolume: number; // Direct Business ($ USD)
  requiredTeamVolume: number;   // Team Business ($ USD)
  requiredDirects?: number;
  rewardType?: 'one_time' | 'salary' | 'travel' | 'car' | 'house' | 'fund';
  rewardTitle: string;          // e.g. "$100 USD Team Development Fund", "$100/mo for 12 Months Salary"
  oneTimeBonusUsd: number;
  monthlySalaryUsd?: number;
  salaryMonths?: number;
  rewardTokens: number;
  monthlyRoyaltyPercent: number;
  currentQualifiedCount: number;
  status: 'unlocked' | 'locked' | 'claimable';
}

export interface AdminSystemConfig {
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  receivingAddress?: string;
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


export interface PhaseAllocation {
  allocated: number;
  sold: number;
}

export interface UserEarnings {
  availableUsdt: number;
  withdrawnUsdt: number;
  tokenSellAvailableUsdt?: number;
  tokenSellWithdrawnUsdt?: number;
  mlmAvailableUsdt?: number;
  mlmWithdrawnUsdt?: number;
}

export interface QueueEntry {
  id: string;
  userId: string;
  phaseNumber: number;
  tokensRequested: number;
  tokensSold: number;
}

export interface TokenSellLedgerItem {
  id: string;
  phaseIndex: number;
  phaseName: string;
  tokenPrice: number;
  tokensSold: number;
  tokensReturned: number;
  grossUsdt: number;
  withdrawnUsdt: number;
  availableUsdt: number;
  status: 'unclaimed' | 'partially_claimed' | 'fully_claimed';
  timestamp: string;
}

