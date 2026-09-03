import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Users table with Wallet and Referral hierarchy
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  referredBy: text('referred_by'), // sponsor referral code or wallet address
  matrixLevel: integer('matrix_level').notNull().default(1),
  isMatrixActive: boolean('is_matrix_active').notNull().default(false),
  isMlmQualified: boolean('is_mlm_qualified').notNull().default(false), // True once user cumulative investment >= $100 USD
  totalInvestedUsdt: doublePrecision('total_invested_usdt').notNull().default(0),
  directCount: integer('direct_count').notNull().default(0),
  totalTeamCount: integer('total_team_count').notNull().default(0),
  totalPurchasedTokens: doublePrecision('total_purchased_tokens').notNull().default(0),
  totalEarnedUsdt: doublePrecision('total_earned_usdt').notNull().default(0),
  totalWithdrawnUsdt: doublePrecision('total_withdrawn_usdt').notNull().default(0),
  availableUsdt: doublePrecision('available_usdt').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Matrix Structure (10-Level Binary/Matrix Placement)
export const matrixNodes = pgTable('matrix_nodes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  parentId: integer('parent_id'), // points to parent matrix node id
  level: integer('level').notNull().default(1), // depth level 1-10
  position: integer('position').notNull().default(1), // slot 1, 2, etc.
  isAutoUpgraded: boolean('is_auto_upgraded').notNull().default(false),
  earnedFromMatrix: doublePrecision('earned_from_matrix').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10-Level Referral Commission Earnings
export const levelEarnings = pgTable('level_earnings', {
  id: serial('id').primaryKey(),
  beneficiaryId: integer('beneficiary_id').references(() => users.id).notNull(),
  sourceUserId: integer('source_user_id').references(() => users.id).notNull(),
  levelNumber: integer('level_number').notNull(), // 1 to 10
  percentage: doublePrecision('percentage').notNull(),
  commissionUsdt: doublePrecision('commission_usdt').notNull(),
  txType: text('tx_type').notNull().default('token_purchase'), // 'token_purchase', 'matrix_join'
  createdAt: timestamp('created_at').defaultNow(),
});

// Token Presale & Package Purchases
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'buy_presale', 'p2p_buy', 'p2p_sell', 'withdrawal', 'matrix_entry'
  amountUsdt: doublePrecision('amount_usdt').notNull(),
  tokenAmount: doublePrecision('token_amount').notNull(),
  tokenPrice: doublePrecision('token_price').notNull(),
  phaseIndex: integer('phase_index').default(1), // Phase 1 ($0.10) to Phase 5 ($1.00)
  status: text('status').notNull().default('completed'), // 'pending', 'completed', 'failed'
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

// P2P FIFO Sell Order Book
export const sellOrders = pgTable('sell_orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amountTokens: doublePrecision('amount_tokens').notNull(),
  remainingTokens: doublePrecision('remaining_tokens').notNull(),
  tokenPrice: doublePrecision('token_price').notNull().default(0.10),
  totalUsdtValue: doublePrecision('total_usdt_value').notNull(),
  status: text('status').notNull().default('open'), // 'open', 'partially_filled', 'completed', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// System / Admin Dynamic Config
export const systemConfigs = pgTable('system_configs', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Phase-by-Phase Token Auto-Sell Internal Settlement Ledger
export const tokenSellLedgers = pgTable('token_sell_ledgers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  walletAddress: text('wallet_address').notNull(),
  phaseIndex: integer('phase_index').notNull(), // 2 for Phase 2, 3 for Phase 3, etc.
  phaseName: text('phase_name').notNull(),
  tokenPrice: doublePrecision('token_price').notNull(),
  tokensSold: doublePrecision('tokens_sold').notNull(),
  tokensReturned: doublePrecision('tokens_returned').notNull().default(0),
  grossUsdt: doublePrecision('gross_usdt').notNull(),
  withdrawnUsdt: doublePrecision('withdrawn_usdt').notNull().default(0),
  serviceFeeUsdt: doublePrecision('service_fee_usdt').notNull().default(0),
  status: text('status').notNull().default('unclaimed'), // 'unclaimed', 'partially_claimed', 'fully_claimed'
  returnTxHash: text('return_tx_hash'),
  payoutTxHash: text('payout_tx_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  matrixNodes: many(matrixNodes),
  earnings: many(levelEarnings, { relationName: 'beneficiaryEarnings' }),
  generatedEarnings: many(levelEarnings, { relationName: 'sourceEarnings' }),
  transactions: many(transactions),
  sellOrders: many(sellOrders),
  tokenSellLedgers: many(tokenSellLedgers),
}));

export const matrixNodesRelations = relations(matrixNodes, ({ one }) => ({
  user: one(users, {
    fields: [matrixNodes.userId],
    references: [users.id],
  }),
}));

export const levelEarningsRelations = relations(levelEarnings, ({ one }) => ({
  beneficiary: one(users, {
    fields: [levelEarnings.beneficiaryId],
    references: [users.id],
    relationName: 'beneficiaryEarnings',
  }),
  sourceUser: one(users, {
    fields: [levelEarnings.sourceUserId],
    references: [users.id],
    relationName: 'sourceEarnings',
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const sellOrdersRelations = relations(sellOrders, ({ one }) => ({
  user: one(users, {
    fields: [sellOrders.userId],
    references: [users.id],
  }),
}));

