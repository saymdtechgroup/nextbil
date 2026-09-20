var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  levelEarnings: () => levelEarnings,
  levelEarningsRelations: () => levelEarningsRelations,
  matrixNodes: () => matrixNodes,
  matrixNodesRelations: () => matrixNodesRelations,
  rankAchievements: () => rankAchievements,
  sellOrders: () => sellOrders,
  sellOrdersRelations: () => sellOrdersRelations,
  systemConfigs: () => systemConfigs,
  tokenSellLedgers: () => tokenSellLedgers,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  walletAddress: (0, import_pg_core.text)("wallet_address").notNull().unique(),
  referralCode: (0, import_pg_core.text)("referral_code").notNull().unique(),
  referredBy: (0, import_pg_core.text)("referred_by"),
  // sponsor referral code or wallet address
  matrixLevel: (0, import_pg_core.integer)("matrix_level").notNull().default(1),
  isMatrixActive: (0, import_pg_core.boolean)("is_matrix_active").notNull().default(false),
  isMlmQualified: (0, import_pg_core.boolean)("is_mlm_qualified").notNull().default(false),
  // True once user cumulative investment >= $100 USD
  totalInvestedUsdt: (0, import_pg_core.doublePrecision)("total_invested_usdt").notNull().default(0),
  directCount: (0, import_pg_core.integer)("direct_count").notNull().default(0),
  totalTeamCount: (0, import_pg_core.integer)("total_team_count").notNull().default(0),
  totalDirectVolume: (0, import_pg_core.doublePrecision)("total_direct_volume").notNull().default(0),
  totalTeamVolume: (0, import_pg_core.doublePrecision)("total_team_volume").notNull().default(0),
  highestRankAchieved: (0, import_pg_core.integer)("highest_rank_achieved").notNull().default(0),
  totalPurchasedTokens: (0, import_pg_core.doublePrecision)("total_purchased_tokens").notNull().default(0),
  totalEarnedUsdt: (0, import_pg_core.doublePrecision)("total_earned_usdt").notNull().default(0),
  totalWithdrawnUsdt: (0, import_pg_core.doublePrecision)("total_withdrawn_usdt").notNull().default(0),
  availableUsdt: (0, import_pg_core.doublePrecision)("available_usdt").notNull().default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var matrixNodes = (0, import_pg_core.pgTable)("matrix_nodes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").references(() => users.id).notNull(),
  parentId: (0, import_pg_core.integer)("parent_id"),
  // points to parent matrix node id
  level: (0, import_pg_core.integer)("level").notNull().default(1),
  // depth level 1-10
  position: (0, import_pg_core.integer)("position").notNull().default(1),
  // slot 1, 2, etc.
  isAutoUpgraded: (0, import_pg_core.boolean)("is_auto_upgraded").notNull().default(false),
  earnedFromMatrix: (0, import_pg_core.doublePrecision)("earned_from_matrix").notNull().default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var levelEarnings = (0, import_pg_core.pgTable)("level_earnings", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  beneficiaryId: (0, import_pg_core.integer)("beneficiary_id").references(() => users.id).notNull(),
  sourceUserId: (0, import_pg_core.integer)("source_user_id").references(() => users.id).notNull(),
  levelNumber: (0, import_pg_core.integer)("level_number").notNull(),
  // 1 to 10
  percentage: (0, import_pg_core.doublePrecision)("percentage").notNull(),
  commissionUsdt: (0, import_pg_core.doublePrecision)("commission_usdt").notNull(),
  txType: (0, import_pg_core.text)("tx_type").notNull().default("token_purchase"),
  // 'token_purchase', 'matrix_join'
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var transactions = (0, import_pg_core.pgTable)("transactions", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").references(() => users.id).notNull(),
  type: (0, import_pg_core.text)("type").notNull(),
  // 'buy_presale', 'p2p_buy', 'p2p_sell', 'withdrawal', 'matrix_entry'
  amountUsdt: (0, import_pg_core.doublePrecision)("amount_usdt").notNull(),
  tokenAmount: (0, import_pg_core.doublePrecision)("token_amount").notNull(),
  tokenPrice: (0, import_pg_core.doublePrecision)("token_price").notNull(),
  phaseIndex: (0, import_pg_core.integer)("phase_index").default(1),
  // Phase 1 ($0.10) to Phase 5 ($1.00)
  status: (0, import_pg_core.text)("status").notNull().default("completed"),
  // 'pending', 'completed', 'failed'
  txHash: (0, import_pg_core.text)("tx_hash"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var sellOrders = (0, import_pg_core.pgTable)("sell_orders", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").references(() => users.id).notNull(),
  phaseNumber: (0, import_pg_core.integer)("phase_number").notNull().default(1),
  amountTokens: (0, import_pg_core.doublePrecision)("amount_tokens").notNull(),
  remainingTokens: (0, import_pg_core.doublePrecision)("remaining_tokens").notNull(),
  tokenPrice: (0, import_pg_core.doublePrecision)("token_price").notNull().default(0.1),
  totalUsdtValue: (0, import_pg_core.doublePrecision)("total_usdt_value").notNull(),
  status: (0, import_pg_core.text)("status").notNull().default("open"),
  // 'open', 'partially_filled', 'completed', 'cancelled'
  priority: (0, import_pg_core.integer)("priority").notNull().default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var rankAchievements = (0, import_pg_core.pgTable)("rank_achievements", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").references(() => users.id).notNull(),
  rankLevel: (0, import_pg_core.integer)("rank_level").notNull(),
  rewardUsdt: (0, import_pg_core.doublePrecision)("reward_usdt").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var systemConfigs = (0, import_pg_core.pgTable)("system_configs", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  key: (0, import_pg_core.text)("key").notNull().unique(),
  value: (0, import_pg_core.text)("value").notNull(),
  description: (0, import_pg_core.text)("description"),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var tokenSellLedgers = (0, import_pg_core.pgTable)("token_sell_ledgers", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").references(() => users.id).notNull(),
  walletAddress: (0, import_pg_core.text)("wallet_address").notNull(),
  phaseIndex: (0, import_pg_core.integer)("phase_index").notNull(),
  // 2 for Phase 2, 3 for Phase 3, etc.
  phaseName: (0, import_pg_core.text)("phase_name").notNull(),
  tokenPrice: (0, import_pg_core.doublePrecision)("token_price").notNull(),
  tokensSold: (0, import_pg_core.doublePrecision)("tokens_sold").notNull(),
  tokensReturned: (0, import_pg_core.doublePrecision)("tokens_returned").notNull().default(0),
  grossUsdt: (0, import_pg_core.doublePrecision)("gross_usdt").notNull(),
  withdrawnUsdt: (0, import_pg_core.doublePrecision)("withdrawn_usdt").notNull().default(0),
  serviceFeeUsdt: (0, import_pg_core.doublePrecision)("service_fee_usdt").notNull().default(0),
  status: (0, import_pg_core.text)("status").notNull().default("unclaimed"),
  // 'unclaimed', 'partially_claimed', 'fully_claimed'
  returnTxHash: (0, import_pg_core.text)("return_tx_hash"),
  payoutTxHash: (0, import_pg_core.text)("payout_tx_hash"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var usersRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
  matrixNodes: many(matrixNodes),
  earnings: many(levelEarnings, { relationName: "beneficiaryEarnings" }),
  generatedEarnings: many(levelEarnings, { relationName: "sourceEarnings" }),
  transactions: many(transactions),
  sellOrders: many(sellOrders),
  tokenSellLedgers: many(tokenSellLedgers),
  rankAchievements: many(rankAchievements)
}));
var matrixNodesRelations = (0, import_drizzle_orm.relations)(matrixNodes, ({ one }) => ({
  user: one(users, {
    fields: [matrixNodes.userId],
    references: [users.id]
  })
}));
var levelEarningsRelations = (0, import_drizzle_orm.relations)(levelEarnings, ({ one }) => ({
  beneficiary: one(users, {
    fields: [levelEarnings.beneficiaryId],
    references: [users.id],
    relationName: "beneficiaryEarnings"
  }),
  sourceUser: one(users, {
    fields: [levelEarnings.sourceUserId],
    references: [users.id],
    relationName: "sourceEarnings"
  })
}));
var transactionsRelations = (0, import_drizzle_orm.relations)(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  })
}));
var sellOrdersRelations = (0, import_drizzle_orm.relations)(sellOrders, ({ one }) => ({
  user: one(users, {
    fields: [sellOrders.userId],
    references: [users.id]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    global._postgresPool = connectionString ? new import_pg.Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 15e3
    }) : new import_pg.Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_ethers = require("ethers");
var import_crypto = require("crypto");
function hashPin(pin) {
  const salt = (0, import_crypto.randomBytes)(16).toString("hex");
  const hash = (0, import_crypto.scryptSync)(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPin(pin, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = (0, import_crypto.scryptSync)(pin, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && (0, import_crypto.timingSafeEqual)(a, b);
}
var pinAttempts = /* @__PURE__ */ new Map();
var adminSessions = /* @__PURE__ */ new Map();
var ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1e3;
function issueAdminSession() {
  const token = (0, import_crypto.randomBytes)(32).toString("hex");
  adminSessions.set(token, Date.now() + ADMIN_SESSION_TTL_MS);
  return token;
}
function requireAdmin(req, res) {
  const token = String(req.headers["x-admin-token"] || "");
  const expires = adminSessions.get(token);
  if (!token || !expires || expires <= Date.now()) {
    if (token) adminSessions.delete(token);
    res.status(401).json({ success: false, error: "Admin authentication required." });
    return false;
  }
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [token, expires] of adminSessions) if (expires <= now) adminSessions.delete(token);
}, 15 * 60 * 1e3);
var PIN_MAX_ATTEMPTS = 5;
var PIN_LOCKOUT_MS = 15 * 60 * 1e3;
function checkPinLockout(ip) {
  const entry = pinAttempts.get(ip);
  if (!entry) return { locked: false };
  if (entry.lockedUntil > Date.now()) {
    return { locked: true, retryAfterMs: entry.lockedUntil - Date.now() };
  }
  return { locked: false };
}
function recordPinFailure(ip) {
  const entry = pinAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= PIN_MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + PIN_LOCKOUT_MS;
    entry.count = 0;
  }
  pinAttempts.set(ip, entry);
}
function recordPinSuccess(ip) {
  pinAttempts.delete(ip);
}
var ERC20_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
var ERC20_TRANSFER_TOPIC = import_ethers.ethers.id("Transfer(address,address,uint256)");
var DEFAULT_NXBC_TOKEN_ADDRESS = "0x94D064AFDB04E3489C313054260929588b38dF85";
var DEFAULT_BSC_RPC = "https://bsc-dataseed.binance.org/";
var DEFAULT_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
var DEFAULT_PRESALE_ADDRESS = "0x0C4a86691B3937549BFa688211EbF56520B64981";
var DEFAULT_ADMIN_WALLET = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";
function settlementEndpointsEnabled() {
  return process.env.ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS === "true";
}
async function verifyPresalePurchaseOnChain(params) {
  const { txHash, buyer, usdtAmount, nxbcAmount } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { ok: false, error: "Invalid BSC transaction hash." };
  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 56n) return { ok: false, error: "Configured RPC is not BSC Mainnet (chainId 56)." };
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { ok: false, pending: true, error: "Purchase transaction is not mined yet." };
  if (receipt.status !== 1) return { ok: false, error: "Purchase transaction reverted on BSC." };
  if (receipt.from.toLowerCase() !== buyer.toLowerCase()) return { ok: false, error: "Purchase transaction sender does not match the buyer wallet." };
  const usdtAddress = (process.env.USDT_CONTRACT_ADDRESS || DEFAULT_USDT_ADDRESS).toLowerCase();
  const nxbcAddress = (process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS).toLowerCase();
  const adminWallet = (process.env.PRESALE_RECEIVING_WALLET || DEFAULT_ADMIN_WALLET).toLowerCase();
  const presaleAddress = (process.env.NXBC_PRESALE_CONTRACT_ADDRESS || process.env.NXBC_PRESALE_CONTRACT || DEFAULT_PRESALE_ADDRESS).toLowerCase();
  const iface = new import_ethers.ethers.Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
  const usdtRaw = import_ethers.ethers.parseUnits(Number(usdtAmount).toFixed(18), 18);
  const nxbcRaw = import_ethers.ethers.parseUnits(Number(nxbcAmount).toFixed(18), 18);
  let usdtPaid = false;
  let nxbcDelivered = false;
  for (const log of receipt.logs) {
    if (!log.topics?.[0] || log.topics[0].toLowerCase() !== ERC20_TRANSFER_TOPIC.toLowerCase()) continue;
    if (log.address.toLowerCase() !== usdtAddress && log.address.toLowerCase() !== nxbcAddress) continue;
    try {
      const parsed = iface.parseLog(log);
      if (!parsed || parsed.name !== "Transfer") continue;
      const from = String(parsed.args.from).toLowerCase();
      const to = String(parsed.args.to).toLowerCase();
      const value = parsed.args.value;
      if (log.address.toLowerCase() === usdtAddress && from === buyer.toLowerCase() && to === adminWallet && value >= usdtRaw) usdtPaid = true;
      if (log.address.toLowerCase() === nxbcAddress && from === presaleAddress && to === buyer.toLowerCase() && value >= nxbcRaw) nxbcDelivered = true;
    } catch {
    }
  }
  if (!usdtPaid) return { ok: false, error: "The BSC transaction does not contain the required USDT payment to the presale treasury." };
  if (!nxbcDelivered) return { ok: false, error: "The BSC transaction does not contain the expected NXBC delivery from the current presale contract." };
  return { ok: true };
}
async function verifyExactNxbcReturn(params) {
  const { txHash, expectedSender, expectedRecipient, expectedTokenAmount } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) {
    return { ok: false, error: "Invalid NXBC return transaction hash." };
  }
  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 56n) return { ok: false, error: "Configured RPC is not BSC Mainnet (chainId 56)." };
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { ok: false, error: "NXBC return transaction is not mined yet." };
  if (receipt.status !== 1) return { ok: false, error: "NXBC return transaction reverted on BSC." };
  if (receipt.from.toLowerCase() !== expectedSender.toLowerCase()) {
    return { ok: false, error: "NXBC return transaction sender does not match the withdrawing wallet." };
  }
  const tokenAddress = import_ethers.ethers.getAddress(process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS);
  const sender = import_ethers.ethers.getAddress(expectedSender);
  const recipient = import_ethers.ethers.getAddress(expectedRecipient);
  const expectedAmount = import_ethers.ethers.parseUnits(expectedTokenAmount.toFixed(18), 18);
  let matched = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;
    if (!log.topics?.[0] || log.topics[0].toLowerCase() !== ERC20_TRANSFER_TOPIC.toLowerCase()) continue;
    if (log.topics.length < 3 || !log.data) continue;
    try {
      const from = import_ethers.ethers.getAddress("0x" + log.topics[1].slice(-40));
      const to = import_ethers.ethers.getAddress("0x" + log.topics[2].slice(-40));
      const amount = BigInt(log.data);
      if (from === sender && to === recipient && amount === expectedAmount) {
        matched = true;
        return { ok: true, blockNumber: receipt.blockNumber, actualAmount: amount.toString() };
      }
    } catch {
    }
  }
  if (!matched) {
    return {
      ok: false,
      error: `NXBC return verification failed. Expected exactly ${expectedTokenAmount} NXBC from ${sender} to ${recipient}.`
    };
  }
  return { ok: false, error: "NXBC return verification failed." };
}
var SIGNATURE_MAX_AGE_MS = 5 * 60 * 1e3;
var usedSignatures = /* @__PURE__ */ new Set();
function buildWithdrawMessage(walletAddress, amountUsdt, walletType, timestamp2) {
  return `Authorize withdrawal
Wallet: ${walletAddress.toLowerCase()}
Amount: ${amountUsdt} USDT
Type: ${walletType}
Timestamp: ${timestamp2}`;
}
function verifyWalletSignature(message, signature, expectedAddress) {
  try {
    const recovered = import_ethers.ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
setInterval(() => {
  if (usedSignatures.size > 5e4) usedSignatures.clear();
}, 30 * 60 * 1e3);
async function finalizeConfirmedPurchase(user, tokenAmount, amountUsdt, phaseIndex) {
  try {
    const configRecord = await db.query.systemConfigs.findFirst({
      where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases")
    });
    if (configRecord && configRecord.value) {
      const phases = JSON.parse(configRecord.value);
      const activeIdx = phases.findIndex((p) => p.status === "active");
      if (activeIdx !== -1) {
        const currentP = phases[activeIdx];
        const newSold = currentP.tokensSold + Number(tokenAmount);
        if (newSold >= currentP.totalSupply) {
          phases[activeIdx].tokensSold = currentP.totalSupply;
          phases[activeIdx].status = "completed";
          if (activeIdx + 1 < phases.length) {
            phases[activeIdx + 1].status = "active";
            phases[activeIdx + 1].tokensSold = 0;
          }
        } else {
          phases[activeIdx].tokensSold = newSold;
        }
        await db.update(systemConfigs).set({ value: JSON.stringify(phases), updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(systemConfigs.key, "phases"));
        console.log(`[API] Phase progression updated safely in DB. Phase ${currentP.id} Sold: ${newSold}`);
      }
    }
  } catch (phaseErr) {
    console.error("Error updating phase progression in DB:", phaseErr);
  }
  let liveQualificationUsd = 100;
  try {
    const sys = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "systemConfig") });
    if (sys?.value) {
      const parsed = JSON.parse(sys.value);
      liveQualificationUsd = Math.max(0, Number(parsed.minMlmQualifyUsd ?? 100));
    }
  } catch {
  }
  const prevInvested = Number(user.totalInvestedUsdt || 0);
  const purchaseUsdt = Number(amountUsdt);
  const newInvested = prevInvested + purchaseUsdt;
  const wasMlmQualified = user.isMlmQualified || prevInvested >= liveQualificationUsd;
  const isNowMlmQualified = newInvested >= liveQualificationUsd;
  await db.update(users).set({
    totalPurchasedTokens: user.totalPurchasedTokens + Number(tokenAmount),
    totalInvestedUsdt: newInvested,
    isMlmQualified: isNowMlmQualified,
    updatedAt: /* @__PURE__ */ new Date()
  }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
  if (user.referredBy) {
    let tempSponsor = user.referredBy;
    let isDirect = true;
    while (tempSponsor) {
      const upUser = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.referralCode, tempSponsor) });
      if (!upUser) break;
      let updatedDirectVol = upUser.totalDirectVolume || 0;
      let updatedTeamVol = (upUser.totalTeamVolume || 0) + purchaseUsdt;
      if (isDirect) {
        updatedDirectVol += purchaseUsdt;
        isDirect = false;
      }
      const sysConfRows = await db.select().from(systemConfigs).where((0, import_drizzle_orm2.eq)(systemConfigs.key, "rankRewards"));
      let activeRanks = [
        { rankNumber: 1, requiredDirectVolume: 1e3, requiredTeamVolume: 5e3, requiredDirects: 3, oneTimeBonusUsd: 50 },
        { rankNumber: 2, requiredDirectVolume: 5e3, requiredTeamVolume: 2e4, requiredDirects: 5, oneTimeBonusUsd: 200 },
        { rankNumber: 3, requiredDirectVolume: 1e4, requiredTeamVolume: 1e5, requiredDirects: 10, oneTimeBonusUsd: 1500 },
        { rankNumber: 4, requiredDirectVolume: 1e5, requiredTeamVolume: 2e6, requiredDirects: 0, oneTimeBonusUsd: 5e4 },
        { rankNumber: 5, requiredDirectVolume: 1e5, requiredTeamVolume: 5e6, requiredDirects: 0, oneTimeBonusUsd: 1e5 }
      ];
      if (sysConfRows.length > 0) {
        try {
          const parsed = JSON.parse(sysConfRows[0].value);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            activeRanks = parsed.sort((a, b) => a.rankNumber - b.rankNumber);
          }
        } catch (e) {
        }
      }
      let newlyAchievedRank = upUser.highestRankAchieved || 0;
      let rankBonusToPay = 0;
      for (const rank of activeRanks) {
        if (rank.rankNumber > newlyAchievedRank) {
          if (updatedDirectVol >= (rank.requiredDirectVolume || 0) && updatedTeamVol >= (rank.requiredTeamVolume || 0) && true) {
            newlyAchievedRank = rank.rankNumber;
            rankBonusToPay += rank.oneTimeBonusUsd || 0;
            await db.insert(rankAchievements).values({
              userId: upUser.id,
              rankLevel: rank.rankNumber,
              rewardUsdt: rank.oneTimeBonusUsd || 0
            });
          } else {
            break;
          }
        }
      }
      let newTotalEarned = (upUser.totalEarnedUsdt || 0) + rankBonusToPay;
      let newAvailable = (upUser.availableUsdt || 0) + rankBonusToPay;
      await db.update(users).set({
        totalDirectVolume: updatedDirectVol,
        totalTeamVolume: updatedTeamVol,
        highestRankAchieved: newlyAchievedRank,
        totalEarnedUsdt: newTotalEarned,
        availableUsdt: newAvailable
      }).where((0, import_drizzle_orm2.eq)(users.id, upUser.id));
      if (rankBonusToPay > 0) {
        await db.insert(levelEarnings).values({
          beneficiaryId: upUser.id,
          sourceUserId: user.id,
          levelNumber: 0,
          percentage: 0,
          commissionUsdt: rankBonusToPay,
          txType: "rank_reward"
        });
      }
      tempSponsor = upUser.referredBy;
    }
  }
  if (isNowMlmQualified) {
    const commissionBaseAmount = wasMlmQualified ? purchaseUsdt : newInvested;
    let liveSystemConfig = {};
    let liveReferralLevels = [];
    try {
      const rows = await db.select().from(systemConfigs);
      const byKey = {};
      for (const row of rows) {
        try {
          byKey[row.key] = JSON.parse(row.value);
        } catch {
          byKey[row.key] = row.value;
        }
      }
      liveSystemConfig = byKey.systemConfig || {};
      liveReferralLevels = Array.isArray(byKey.referralLevels) ? byKey.referralLevels : [];
    } catch {
    }
    const directSponsorRate = Math.max(0, Number(liveSystemConfig.directSponsorPercent ?? 10)) / 100;
    const levelPercentages = Array.from({ length: 10 }, (_, i) => {
      const configured = liveReferralLevels.find((l) => Number(l.level) === i + 1);
      return Math.max(0, Number(configured?.commissionPercent ?? 0)) / 100;
    });
    let currentSponsorCode = user.referredBy;
    if (currentSponsorCode) {
      const directSponsor = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.referralCode, currentSponsorCode)
      });
      if (directSponsor) {
        const isDirectQualified = directSponsor.isMlmQualified || (directSponsor.totalInvestedUsdt || 0) >= liveQualificationUsd;
        if (isDirectQualified) {
          const sponsorBonusAmount = commissionBaseAmount * directSponsorRate;
          if (sponsorBonusAmount > 0) {
            await db.insert(levelEarnings).values({
              beneficiaryId: directSponsor.id,
              sourceUserId: user.id,
              levelNumber: 0,
              // 0 indicates Direct Sponsor
              percentage: directSponsorRate * 100,
              commissionUsdt: sponsorBonusAmount,
              txType: "token_purchase"
            });
            await db.update(users).set({
              totalEarnedUsdt: directSponsor.totalEarnedUsdt + sponsorBonusAmount,
              availableUsdt: directSponsor.availableUsdt + sponsorBonusAmount,
              updatedAt: /* @__PURE__ */ new Date()
            }).where((0, import_drizzle_orm2.eq)(users.id, directSponsor.id));
          }
        }
      }
    }
    for (let lvl = 0; lvl < levelPercentages.length && currentSponsorCode; lvl++) {
      const uplineUser = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.referralCode, currentSponsorCode)
      });
      if (!uplineUser) break;
      const isUplineQualified = uplineUser.isMlmQualified || (uplineUser.totalInvestedUsdt || 0) >= liveQualificationUsd;
      if (isUplineQualified) {
        const commissionAmount = commissionBaseAmount * levelPercentages[lvl];
        if (commissionAmount > 0) {
          await db.insert(levelEarnings).values({
            beneficiaryId: uplineUser.id,
            sourceUserId: user.id,
            levelNumber: lvl + 1,
            percentage: levelPercentages[lvl] * 100,
            commissionUsdt: commissionAmount,
            txType: "token_purchase"
          });
          await db.update(users).set({
            totalEarnedUsdt: uplineUser.totalEarnedUsdt + commissionAmount,
            availableUsdt: uplineUser.availableUsdt + commissionAmount,
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(users.id, uplineUser.id));
        }
      }
      currentSponsorCode = uplineUser.referredBy;
    }
  }
  if (!wasMlmQualified && isNowMlmQualified) {
    if (user.referredBy) {
      const sponsor = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.referralCode, user.referredBy) });
      if (sponsor) {
        await db.update(users).set({ directCount: sponsor.directCount + 1 }).where((0, import_drizzle_orm2.eq)(users.id, sponsor.id));
        let tempCode = user.referredBy;
        while (tempCode) {
          const up = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.referralCode, tempCode) });
          if (!up) break;
          await db.update(users).set({ totalTeamCount: up.totalTeamCount + 1 }).where((0, import_drizzle_orm2.eq)(users.id, up.id));
          tempCode = up.referredBy;
        }
      }
    }
    let sponsorNodeId = null;
    if (user.referredBy) {
      const sp = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.referralCode, user.referredBy) });
      if (sp) {
        const spNode = await db.query.matrixNodes.findFirst({ where: (0, import_drizzle_orm2.eq)(matrixNodes.userId, sp.id) });
        if (spNode) sponsorNodeId = spNode.id;
      }
    }
    const existingNodes = await db.select({ id: matrixNodes.id }).from(matrixNodes).limit(1);
    let placementParentId = null;
    if (existingNodes.length > 0) {
      let startNodeId = sponsorNodeId;
      if (!startNodeId) {
        const rootNode = await db.query.matrixNodes.findFirst({ orderBy: (0, import_drizzle_orm2.asc)(matrixNodes.id) });
        startNodeId = rootNode?.id || null;
      }
      if (startNodeId) {
        const queue = [startNodeId];
        while (queue.length > 0) {
          const currentId = queue.shift();
          const children = await db.select().from(matrixNodes).where((0, import_drizzle_orm2.eq)(matrixNodes.parentId, currentId)).orderBy((0, import_drizzle_orm2.asc)(matrixNodes.position));
          if (children.length < 2) {
            placementParentId = currentId;
            break;
          }
          for (const child of children) {
            queue.push(child.id);
          }
        }
      }
    }
    const childrenCount = placementParentId ? (await db.select().from(matrixNodes).where((0, import_drizzle_orm2.eq)(matrixNodes.parentId, placementParentId))).length : 0;
    const newPosition = childrenCount + 1;
    let newLevel = 1;
    if (placementParentId) {
      const pNode = await db.query.matrixNodes.findFirst({ where: (0, import_drizzle_orm2.eq)(matrixNodes.id, placementParentId) });
      if (pNode) newLevel = pNode.level + 1;
    }
    const [newMatrixNode] = await db.insert(matrixNodes).values({
      userId: user.id,
      parentId: placementParentId,
      level: newLevel,
      position: newPosition,
      isAutoUpgraded: false,
      earnedFromMatrix: 0
    }).returning();
    await db.update(users).set({ isMatrixActive: true, matrixLevel: 1 }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
    let matrixConfig = { placementIncomeUsd: 1, uplineSharePercent: 100, enabled: true };
    try {
      const matrixRow = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "matrixConfig") });
      if (matrixRow?.value) matrixConfig = { ...matrixConfig, ...JSON.parse(matrixRow.value) };
    } catch {
    }
    const matrixEnabled = matrixConfig.enabled !== false;
    const baseMatrixIncome = Math.max(0, Number(matrixConfig.placementIncomeUsd || 0));
    const matrixShare = Math.max(0, Number(matrixConfig.uplineSharePercent ?? 100)) / 100;
    const mIncomeUsd = baseMatrixIncome * matrixShare;
    let currentMatrixParentId = placementParentId;
    let matrixLvl = 1;
    while (matrixEnabled && currentMatrixParentId && matrixLvl <= 10 && mIncomeUsd > 0) {
      const parentMatrixNode = await db.query.matrixNodes.findFirst({ where: (0, import_drizzle_orm2.eq)(matrixNodes.id, currentMatrixParentId) });
      if (!parentMatrixNode) break;
      const uplineUser = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.id, parentMatrixNode.userId) });
      if (uplineUser && uplineUser.isMlmQualified) {
        await db.insert(levelEarnings).values({
          beneficiaryId: uplineUser.id,
          sourceUserId: user.id,
          levelNumber: matrixLvl,
          percentage: 0,
          commissionUsdt: mIncomeUsd,
          txType: "matrix_join"
        });
        await db.update(users).set({
          totalEarnedUsdt: uplineUser.totalEarnedUsdt + mIncomeUsd,
          availableUsdt: uplineUser.availableUsdt + mIncomeUsd,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm2.eq)(users.id, uplineUser.id));
        await db.update(matrixNodes).set({
          earnedFromMatrix: parentMatrixNode.earnedFromMatrix + mIncomeUsd
        }).where((0, import_drizzle_orm2.eq)(matrixNodes.id, parentMatrixNode.id));
      }
      currentMatrixParentId = parentMatrixNode.parentId;
      matrixLvl++;
    }
  }
  return { newInvested, isNowMlmQualified };
}
var DIRECT_INVITE_TTL_MS = 24 * 60 * 60 * 1e3;
var DIRECT_INVITE_PREFIX = "NXBC-DM-";
var hashDirectInvite = (token) => (0, import_crypto.createHash)("sha256").update(token).digest("hex");
async function ensureDirectBuyerTables() {
  await db.execute(import_drizzle_orm2.sql`CREATE TABLE IF NOT EXISTS direct_buyer_invites (id SERIAL PRIMARY KEY, seller_user_id INTEGER NOT NULL REFERENCES users(id), sell_order_id INTEGER NOT NULL REFERENCES sell_orders(id), phase_number INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, claimed_by_wallet TEXT, used_at TIMESTAMP, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
  await db.execute(import_drizzle_orm2.sql`CREATE INDEX IF NOT EXISTS direct_buyer_invites_order_idx ON direct_buyer_invites (sell_order_id)`);
}
async function createDirectBuyerInvite(sellerUserId, sellOrderId) {
  const order = await db.query.sellOrders.findFirst({ where: (0, import_drizzle_orm2.eq)(sellOrders.id, sellOrderId) });
  if (!order || Number(order.userId) !== Number(sellerUserId)) throw new Error("Sale order not found or not owned by this wallet.");
  if (Number(order.phaseNumber) < 2 || Number(order.phaseNumber) > 5) throw new Error("Direct Buyer Match is available only for Phase 2 to Phase 5.");
  if (!["open", "partially_filled"].includes(String(order.status)) || Number(order.remainingTokens || 0) <= 0) throw new Error("This sale order is no longer open.");
  const token = DIRECT_INVITE_PREFIX + (0, import_crypto.randomBytes)(24).toString("hex");
  const expiresAt = new Date(Date.now() + DIRECT_INVITE_TTL_MS);
  await db.execute(import_drizzle_orm2.sql`UPDATE direct_buyer_invites SET expires_at = NOW() WHERE sell_order_id=${sellOrderId} AND used_at IS NULL AND expires_at > NOW()`);
  await db.execute(import_drizzle_orm2.sql`INSERT INTO direct_buyer_invites (seller_user_id,sell_order_id,phase_number,token_hash,expires_at) VALUES (${sellerUserId},${sellOrderId},${Number(order.phaseNumber)},${hashDirectInvite(token)},${expiresAt})`);
  return { token, expiresAt, phaseNumber: Number(order.phaseNumber), remainingTokens: Number(order.remainingTokens || 0) };
}
async function matchDirectBuyerFirst(params) {
  const share = Math.max(0, Number(params.buyerTokenAmount) * 0.2);
  if (share <= 0 || !params.inviteToken) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  await ensureDirectBuyerTables();
  const rows = await db.execute(import_drizzle_orm2.sql`SELECT * FROM direct_buyer_invites WHERE token_hash=${hashDirectInvite(params.inviteToken)} LIMIT 1`);
  const invite = rows.rows?.[0] || rows[0];
  if (!invite || invite.used_at || new Date(invite.expires_at).getTime() <= Date.now()) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  const buyer = String(params.buyerWallet || "").toLowerCase();
  if (String(invite.claimed_by_wallet || "") && String(invite.claimed_by_wallet).toLowerCase() !== buyer) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  if (Number(invite.phase_number) !== Number(params.phaseNumber) || Number(invite.seller_user_id) === Number(params.buyerUserId)) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  const order = await db.query.sellOrders.findFirst({ where: (0, import_drizzle_orm2.eq)(sellOrders.id, Number(invite.sell_order_id)) });
  if (!order || Number(order.userId) !== Number(invite.seller_user_id) || !["open", "partially_filled"].includes(String(order.status))) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  const remaining = Math.max(0, Number(order.remainingTokens || 0)), filled = Math.min(share, remaining), price = Number(order.tokenPrice || 0);
  if (filled <= 0 || !Number.isFinite(price) || price <= 0) return { matched: 0, unmatched: share, match: null, inviteUsed: false };
  const nextRemaining = Math.max(0, remaining - filled), nextStatus = nextRemaining <= 1e-12 ? "completed" : "partially_filled", grossUsdt = filled * price;
  await db.update(sellOrders).set({ remainingTokens: nextRemaining, status: nextStatus }).where((0, import_drizzle_orm2.eq)(sellOrders.id, order.id));
  const seller = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.id, order.userId) });
  if (seller) {
    await db.update(users).set({ totalEarnedUsdt: Number(seller.totalEarnedUsdt || 0) + grossUsdt, availableUsdt: Number(seller.availableUsdt || 0) + grossUsdt, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(users.id, seller.id));
    await db.insert(tokenSellLedgers).values({ userId: seller.id, walletAddress: seller.walletAddress, phaseIndex: order.phaseNumber, phaseName: `Phase ${order.phaseNumber}`, tokenPrice: price, tokensSold: filled, tokensReturned: 0, grossUsdt, withdrawnUsdt: 0, serviceFeeUsdt: 0, status: "unclaimed" });
  }
  await db.execute(import_drizzle_orm2.sql`UPDATE direct_buyer_invites SET claimed_by_wallet=${buyer}, used_at=NOW() WHERE id=${Number(invite.id)} AND used_at IS NULL`);
  return { matched: filled, unmatched: Math.max(0, share - filled), inviteUsed: true, match: { orderId: order.id, sellerUserId: order.userId, phaseNumber: order.phaseNumber, tokensSold: filled, tokenPrice: price, grossUsdt, remainingOrderTokens: nextRemaining, status: nextStatus } };
}
async function matchVerifiedBuyerToPhaseQueue(params) {
  const userShareTokens = Math.max(0, params.buyerTokenAmount * 0.2);
  const adminShareTokens = Math.max(0, params.buyerTokenAmount - userShareTokens);
  if (userShareTokens <= 0) return { userShareTokens: 0, adminShareTokens, unmatchedUserShareTokens: 0, matches: [], directMatch: null };
  const direct = await matchDirectBuyerFirst({ buyerUserId: params.buyerUserId, buyerWallet: params.buyerWallet || "", phaseNumber: params.phaseNumber, buyerTokenAmount: params.buyerTokenAmount, inviteToken: params.directBuyerInviteToken });
  let remainingBuyerUserShare = direct.unmatched;
  const orders = await db.select().from(sellOrders).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(sellOrders.phaseNumber, params.phaseNumber), (0, import_drizzle_orm2.inArray)(sellOrders.status, ["open", "partially_filled"]))).orderBy((0, import_drizzle_orm2.asc)(sellOrders.createdAt), (0, import_drizzle_orm2.asc)(sellOrders.priority));
  const matches = [];
  for (const order of orders) {
    if (remainingBuyerUserShare <= 1e-12) break;
    if (Number(order.userId) === Number(params.buyerUserId)) continue;
    const remainingOrderTokens = Math.max(0, Number(order.remainingTokens || 0));
    if (remainingOrderTokens <= 0) continue;
    const filled = Math.min(remainingBuyerUserShare, remainingOrderTokens);
    if (filled <= 0) continue;
    const price = Number(order.tokenPrice || 0);
    if (!Number.isFinite(price) || price <= 0) continue;
    const grossUsdt = filled * price;
    const nextRemaining = Math.max(0, remainingOrderTokens - filled);
    const nextStatus = nextRemaining <= 1e-12 ? "completed" : "partially_filled";
    await db.update(sellOrders).set({
      remainingTokens: nextRemaining,
      status: nextStatus
    }).where((0, import_drizzle_orm2.eq)(sellOrders.id, order.id));
    const seller = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.id, order.userId) });
    if (seller) {
      await db.update(users).set({
        totalEarnedUsdt: Number(seller.totalEarnedUsdt || 0) + grossUsdt,
        availableUsdt: Number(seller.availableUsdt || 0) + grossUsdt,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm2.eq)(users.id, seller.id));
      await db.insert(tokenSellLedgers).values({
        userId: seller.id,
        walletAddress: seller.walletAddress,
        phaseIndex: order.phaseNumber,
        phaseName: `Phase ${order.phaseNumber}`,
        tokenPrice: price,
        tokensSold: filled,
        tokensReturned: 0,
        grossUsdt,
        withdrawnUsdt: 0,
        serviceFeeUsdt: 0,
        status: "unclaimed"
      });
    }
    matches.push({
      orderId: order.id,
      sellerUserId: order.userId,
      phaseNumber: order.phaseNumber,
      tokensSold: filled,
      tokenPrice: price,
      grossUsdt,
      remainingOrderTokens: nextRemaining,
      status: nextStatus
    });
    remainingBuyerUserShare -= filled;
  }
  return {
    userShareTokens,
    adminShareTokens,
    unmatchedUserShareTokens: Math.max(0, remainingBuyerUserShare),
    matches
  };
}
async function verifyPendingPresalePurchases() {
  const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
  const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
  const treasuryWallet = (process.env.PRESALE_RECEIVING_WALLET || "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261").toLowerCase();
  let pendingTxs = [];
  try {
    pendingTxs = await db.select().from(transactions).where(
      (0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(transactions.type, "buy_presale"), (0, import_drizzle_orm2.eq)(transactions.status, "pending_verification"))
    );
  } catch (err) {
    console.error("[PRESALE VERIFY] Failed to load pending purchases:", err.message);
    return;
  }
  if (pendingTxs.length === 0) return;
  const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
  const usdtInterface = new import_ethers.ethers.Interface(ERC20_ABI.concat([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]));
  let usdtDecimals = 18;
  try {
    const usdtContract = new import_ethers.ethers.Contract(usdtContractAddress, ERC20_ABI, provider);
    usdtDecimals = await usdtContract.decimals();
  } catch {
  }
  for (const txRecord of pendingTxs) {
    if (!txRecord.txHash) {
      await db.update(transactions).set({ status: "failed" }).where((0, import_drizzle_orm2.eq)(transactions.id, txRecord.id));
      continue;
    }
    try {
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.id, txRecord.userId) });
      if (!user) {
        console.error(`[PRESALE VERIFY] User ${txRecord.userId} not found for pending purchase #${txRecord.id}.`);
        continue;
      }
      const verification = await verifyPresalePurchaseOnChain({
        txHash: txRecord.txHash,
        buyer: user.walletAddress,
        usdtAmount: Number(txRecord.amountUsdt),
        nxbcAmount: Number(txRecord.tokenAmount)
      });
      if (verification.pending) continue;
      if (!verification.ok) {
        console.warn(`[PRESALE VERIFY] Purchase #${txRecord.id} failed strict on-chain verification: ${verification.error}`);
        await db.update(transactions).set({ status: "failed" }).where((0, import_drizzle_orm2.eq)(transactions.id, txRecord.id));
        continue;
      }
      await db.update(transactions).set({ status: "completed" }).where((0, import_drizzle_orm2.eq)(transactions.id, txRecord.id));
      await finalizeConfirmedPurchase(user, Number(txRecord.tokenAmount), Number(txRecord.amountUsdt), Number(txRecord.phaseIndex || 1));
      await matchVerifiedBuyerToPhaseQueue({
        buyerUserId: user.id,
        buyerWallet: user.walletAddress,
        phaseNumber: Number(txRecord.phaseIndex || 1),
        buyerTokenAmount: Number(txRecord.tokenAmount)
      });
      console.log(`[PRESALE VERIFY] Purchase #${txRecord.id} confirmed on-chain, finalized, and FIFO matched.`);
    } catch (err) {
      console.error(`[PRESALE VERIFY] Error checking tx ${txRecord.txHash}:`, err.message);
    }
  }
}
async function startServer() {
  try {
    await ensureDirectBuyerTables();
  } catch (e) {
    console.error("[DIRECT MATCH] table initialization failed:", e);
  }
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    const allowedOrigin = String(process.env.CORS_ORIGIN || "").trim();
    const requestOrigin = String(req.headers.origin || "");
    if (allowedOrigin && requestOrigin === allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Token");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.get("/api/health", async (req, res) => {
    try {
      const configs = await db.select().from(systemConfigs);
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || "").trim();
      const isPayoutBotConfigured = !!(rawKey && (rawKey.length === 64 || rawKey.length === 66));
      res.json({
        status: "ok",
        database: "postgresql_connected",
        configsCount: configs.length,
        payoutBotReady: isPayoutBotConfigured
      });
    } catch (err) {
      res.json({ status: "ok", database: "waiting_or_connecting", error: err?.message });
    }
  });
  app.get("/api/payout-bot/status", async (req, res) => {
    try {
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || "").trim();
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
      if (!rawKey) {
        return res.json({
          configured: false,
          message: "PAYOUT_HOT_WALLET_PRIVATE_KEY is not configured in .env on server.",
          usdtContractAddress,
          rpcUrl
        });
      }
      const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
      const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
      const wallet = new import_ethers.ethers.Wallet(formattedKey, provider);
      const bnbBalanceWei = await provider.getBalance(wallet.address);
      const bnbBalance = import_ethers.ethers.formatEther(bnbBalanceWei);
      const usdtContract = new import_ethers.ethers.Contract(usdtContractAddress, ERC20_ABI, provider);
      let usdtBalance = "0";
      try {
        const usdtRaw = await usdtContract.balanceOf(wallet.address);
        usdtBalance = import_ethers.ethers.formatUnits(usdtRaw, 18);
      } catch (err) {
        usdtBalance = "error_reading_usdt";
      }
      return res.json({
        configured: true,
        hotWalletAddress: wallet.address,
        bnbBalance: `${Number(bnbBalance).toFixed(5)} BNB`,
        usdtBalance: `$${Number(usdtBalance).toFixed(2)} USDT`,
        hasGas: Number(bnbBalance) > 1e-3,
        hasUsdt: Number(usdtBalance) > 0,
        rpcUrl,
        usdtContractAddress
      });
    } catch (err) {
      return res.status(500).json({ configured: false, error: err.message });
    }
  });
  app.get("/api/wallet/token-sell-ledger", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      if (!walletAddress || typeof walletAddress !== "string") {
        return res.status(400).json({ error: "walletAddress is required" });
      }
      const normalizedAddress = walletAddress.toLowerCase();
      const user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      if (!user) {
        return res.json({
          walletAddress: normalizedAddress,
          entries: [],
          totalGrossUsdt: 0,
          totalWithdrawnUsdt: 0,
          availableUsdt: 0,
          totalTokensSold: 0,
          totalTokensReturned: 0,
          pendingTokensToReturn: 0
        });
      }
      const entries = await db.select().from(tokenSellLedgers).where((0, import_drizzle_orm2.eq)(tokenSellLedgers.walletAddress, normalizedAddress)).orderBy((0, import_drizzle_orm2.asc)(tokenSellLedgers.phaseIndex), (0, import_drizzle_orm2.asc)(tokenSellLedgers.createdAt));
      let totalGrossUsdt = 0;
      let totalWithdrawnUsdt = 0;
      let availableUsdt = 0;
      let totalTokensSold = 0;
      let totalTokensReturned = 0;
      let pendingTokensToReturn = 0;
      const formattedEntries = entries.map((e) => {
        const remainingGross = Math.max(0, e.grossUsdt - e.withdrawnUsdt);
        const remainingTokens = Math.max(0, e.tokensSold - e.tokensReturned);
        totalGrossUsdt += e.grossUsdt;
        totalWithdrawnUsdt += e.withdrawnUsdt;
        availableUsdt += remainingGross;
        totalTokensSold += e.tokensSold;
        totalTokensReturned += e.tokensReturned;
        pendingTokensToReturn += remainingTokens;
        return {
          id: `ledger-${e.id}`,
          phaseIndex: e.phaseIndex,
          phaseName: e.phaseName,
          tokenPrice: e.tokenPrice,
          tokensSold: e.tokensSold,
          tokensReturned: e.tokensReturned,
          grossUsdt: e.grossUsdt,
          withdrawnUsdt: e.withdrawnUsdt,
          availableUsdt: remainingGross,
          pendingTokens: remainingTokens,
          serviceFeeUsdt: e.serviceFeeUsdt,
          status: e.status,
          returnTxHash: e.returnTxHash,
          payoutTxHash: e.payoutTxHash,
          createdAt: e.createdAt
        };
      });
      return res.json({
        walletAddress: normalizedAddress,
        entries: formattedEntries,
        totalGrossUsdt,
        totalWithdrawnUsdt,
        availableUsdt,
        totalTokensSold,
        totalTokensReturned,
        pendingTokensToReturn
      });
    } catch (error) {
      console.error("Error in /api/wallet/token-sell-ledger:", error);
      res.status(500).json({ error: error.message || "Failed to fetch token sell ledger" });
    }
  });
  app.post("/api/wallet/token-sell-ledger/record", async (req, res) => {
    if (!settlementEndpointsEnabled()) {
      return res.status(403).json({ success: false, error: "Unverified client-side token settlement is disabled. No internal balance can be created from browser data." });
    }
    try {
      const {
        walletAddress,
        phaseIndex,
        phaseName,
        tokenPrice,
        tokensSold,
        grossUsdt
      } = req.body;
      if (!walletAddress || !tokensSold || Number(tokensSold) <= 0) {
        return res.status(400).json({ error: "Invalid ledger payload" });
      }
      const normalizedAddress = walletAddress.toLowerCase();
      let user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      if (!user) {
        const refCode = `NX${normalizedAddress.substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: refCode,
          availableUsdt: 0
        }).returning();
        user = newUser;
      }
      const calculatedGross = Number(grossUsdt) || Number(tokensSold) * Number(tokenPrice);
      const [entry] = await db.insert(tokenSellLedgers).values({
        userId: user.id,
        walletAddress: normalizedAddress,
        phaseIndex: Number(phaseIndex) || 2,
        phaseName: phaseName || `Phase ${phaseIndex}`,
        tokenPrice: Number(tokenPrice) || 0.1,
        tokensSold: Number(tokensSold),
        tokensReturned: 0,
        grossUsdt: calculatedGross,
        withdrawnUsdt: 0,
        serviceFeeUsdt: 0,
        status: "unclaimed"
      }).returning();
      await db.update(users).set({
        availableUsdt: (user.availableUsdt || 0) + calculatedGross,
        totalEarnedUsdt: (user.totalEarnedUsdt || 0) + calculatedGross,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
      return res.json({
        success: true,
        entry,
        message: `Successfully recorded ${tokensSold} NXBC auto-sold in ${entry.phaseName} for $${calculatedGross.toFixed(2)} USDT!`
      });
    } catch (error) {
      console.error("Error in /api/wallet/token-sell-ledger/record:", error);
      res.status(500).json({ error: error.message || "Failed to record token sell entry" });
    }
  });
  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const {
        walletAddress,
        amountUsdt,
        walletType = "mlm",
        tokenReturnTxHash,
        tokensReturned = 0,
        signature,
        // hex signature from personal_sign of buildWithdrawMessage(...)
        timestamp: timestamp2
        // ms epoch used inside the signed message
      } = req.body;
      if (!walletAddress || !amountUsdt || Number(amountUsdt) <= 0) {
        return res.status(400).json({ error: "Invalid wallet address or withdrawal amount" });
      }
      if (!signature || !timestamp2) {
        return res.status(401).json({ error: "Missing signature/timestamp. Sign the withdrawal request with your wallet." });
      }
      const ageMs = Date.now() - Number(timestamp2);
      if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > SIGNATURE_MAX_AGE_MS) {
        return res.status(401).json({ error: "Signature expired. Please try again." });
      }
      const sigKey = `${walletAddress.toLowerCase()}:${signature}`;
      if (usedSignatures.has(sigKey)) {
        return res.status(401).json({ error: "This signed request was already used." });
      }
      const expectedMessage = buildWithdrawMessage(walletAddress, Number(amountUsdt), walletType, Number(timestamp2));
      if (!verifyWalletSignature(expectedMessage, signature, walletAddress)) {
        return res.status(401).json({ error: "Invalid signature. Withdrawal not authorized by wallet owner." });
      }
      usedSignatures.add(sigKey);
      const grossAmount = Number(amountUsdt);
      const normalizedAddress = walletAddress.toLowerCase();
      let withdrawalFeePercent = 0;
      try {
        const feeRow = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "systemConfig") });
        const parsedConfig = feeRow ? JSON.parse(feeRow.value) : null;
        withdrawalFeePercent = Number(parsedConfig?.withdrawalFeePercent);
      } catch {
        withdrawalFeePercent = 0;
      }
      if (!Number.isFinite(withdrawalFeePercent) || withdrawalFeePercent < 0 || withdrawalFeePercent > 100) {
        return res.status(500).json({ error: "Invalid withdrawal fee configuration. Admin must correct it before withdrawals." });
      }
      const serviceFee = grossAmount * (withdrawalFeePercent / 100);
      const netPayout = Math.max(0, grossAmount - serviceFee);
      const user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      if (!user) {
        return res.status(404).json({ error: "User not found. Nothing to withdraw." });
      }
      const currentAvailable = user.availableUsdt || 0;
      if (currentAvailable < grossAmount) {
        return res.status(400).json({
          error: "Insufficient available balance for this withdrawal.",
          availableUsdt: currentAvailable,
          requestedUsdt: grossAmount
        });
      }
      let phaseBreakdown = [];
      let totalCalculatedTokensToReturn = 0;
      const pendingLedgerUpdates = [];
      if (walletType === "token_sell") {
        const activeLedgerEntries = await db.select().from(tokenSellLedgers).where(
          (0, import_drizzle_orm2.and)(
            (0, import_drizzle_orm2.eq)(tokenSellLedgers.walletAddress, normalizedAddress),
            (0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(tokenSellLedgers.status, "unclaimed"), (0, import_drizzle_orm2.eq)(tokenSellLedgers.status, "partially_claimed"))
          )
        ).orderBy((0, import_drizzle_orm2.asc)(tokenSellLedgers.phaseIndex), (0, import_drizzle_orm2.asc)(tokenSellLedgers.createdAt));
        let remainingToDeduct = grossAmount;
        for (const entry of activeLedgerEntries) {
          if (remainingToDeduct <= 0) break;
          const entryRemainingGross = Math.max(0, entry.grossUsdt - entry.withdrawnUsdt);
          const deductFromEntry = Math.min(entryRemainingGross, remainingToDeduct);
          if (deductFromEntry > 0) {
            const tokensProportion = deductFromEntry / entry.grossUsdt * entry.tokensSold;
            const newWithdrawn = entry.withdrawnUsdt + deductFromEntry;
            const newReturned = entry.tokensReturned + tokensProportion;
            const newStatus = newWithdrawn >= entry.grossUsdt - 1e-3 ? "fully_claimed" : "partially_claimed";
            phaseBreakdown.push({
              phaseIndex: entry.phaseIndex,
              phaseName: entry.phaseName,
              tokensToReturn: Math.round(tokensProportion * 1e3) / 1e3,
              grossDeducted: deductFromEntry
            });
            totalCalculatedTokensToReturn += tokensProportion;
            remainingToDeduct -= deductFromEntry;
            pendingLedgerUpdates.push({
              entry,
              withdrawn: newWithdrawn,
              returned: newReturned,
              status: newStatus,
              fee: deductFromEntry * (withdrawalFeePercent / 100)
            });
          }
        }
      }
      if (walletType === "token_sell") {
        if (!tokenReturnTxHash) {
          return res.status(400).json({ error: "NXBC return transaction is required. USDT withdrawal is blocked until the return is verified on BSC." });
        }
        const exactExpectedTokens = totalCalculatedTokensToReturn;
        if (exactExpectedTokens <= 0) {
          return res.status(400).json({ error: "No exact NXBC return amount could be calculated from the user's settlement ledger." });
        }
        if (tokensReturned > 0 && Math.abs(Number(tokensReturned) - exactExpectedTokens) > 1e-9) {
          return res.status(400).json({ error: "Client-supplied NXBC return amount does not match the server-calculated exact amount." });
        }
        let treasuryAddress = process.env.NXBC_RETURN_TREASURY_ADDRESS || "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";
        try {
          treasuryAddress = import_ethers.ethers.getAddress(treasuryAddress);
        } catch {
          return res.status(500).json({ error: "Invalid NXBC return treasury address configuration." });
        }
        try {
          const priorUse = await db.query.tokenSellLedgers.findFirst({
            where: (0, import_drizzle_orm2.eq)(tokenSellLedgers.returnTxHash, tokenReturnTxHash)
          });
          if (priorUse) {
            return res.status(400).json({
              error: "This NXBC return transaction has already been used for a Token Sell withdrawal."
            });
          }
        } catch (replayCheckError) {
          console.error("[NXBC RETURN] Replay-check failed:", replayCheckError?.message);
          return res.status(500).json({ error: "Could not verify NXBC return transaction uniqueness. Withdrawal blocked." });
        }
        const verification = await verifyExactNxbcReturn({
          txHash: tokenReturnTxHash,
          expectedSender: walletAddress,
          expectedRecipient: treasuryAddress,
          expectedTokenAmount: exactExpectedTokens
        });
        if (!verification.ok) {
          return res.status(400).json({ error: verification.error || "NXBC return could not be verified on BSC. USDT withdrawal blocked." });
        }
      }
      const finalTokensReturned = walletType === "token_sell" ? totalCalculatedTokensToReturn : Number(tokensReturned) || 0;
      let txHash = "";
      let executionMode = "simulated_blockchain";
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || "").trim();
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
      if (rawKey && (rawKey.length === 64 || rawKey.length === 66)) {
        const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
        try {
          const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
          const wallet = new import_ethers.ethers.Wallet(formattedKey, provider);
          const usdtContract = new import_ethers.ethers.Contract(usdtContractAddress, ERC20_ABI, wallet);
          const decimals = 18;
          const parsedAmount = import_ethers.ethers.parseUnits(netPayout.toFixed(4), decimals);
          console.log(`[PAYOUT BOT] Sender Hot Wallet: ${wallet.address}`);
          console.log(`[PAYOUT BOT] Initiating automated ${walletType} payout of Gross: $${grossAmount} | Fee (${withdrawalFeePercent}%): $${serviceFee.toFixed(2)} | Net: $${netPayout.toFixed(2)} USDT to ${walletAddress}...`);
          const tx = await usdtContract.transfer(walletAddress, parsedAmount);
          console.log(`[PAYOUT BOT] Real BSC Transaction Broadcasted: https://bscscan.com/tx/${tx.hash}`);
          const payoutReceipt = await tx.wait(1);
          if (!payoutReceipt || payoutReceipt.status !== 1) {
            return res.status(503).json({
              error: "USDT payout transaction was broadcast but did not confirm successfully on BSC.",
              txHash: tx.hash,
              serviceFeePercent: withdrawalFeePercent
            });
          }
          txHash = tx.hash;
          executionMode = "real_bsc_blockchain";
        } catch (botError) {
          console.error("[PAYOUT BOT ERROR] On-chain USDT dispatch failed:", botError.message);
          if (botError.info?.error?.message) {
            console.error("[PAYOUT BOT REASON]:", botError.info.error.message);
          }
          return res.status(503).json({
            error: `USDT payout failed on BSC: ${botError?.message || "unknown payout error"}`,
            serviceFeePercent: withdrawalFeePercent
          });
        }
      } else {
        return res.status(503).json({
          error: "USDT payout wallet is not configured. No withdrawal was completed and no fake blockchain hash was generated.",
          serviceFeePercent: withdrawalFeePercent
        });
      }
      if (walletType === "token_sell") {
        for (const update of pendingLedgerUpdates) {
          await db.update(tokenSellLedgers).set({
            withdrawnUsdt: update.withdrawn,
            tokensReturned: update.returned,
            serviceFeeUsdt: (update.entry.serviceFeeUsdt || 0) + update.fee,
            status: update.status,
            returnTxHash: tokenReturnTxHash,
            payoutTxHash: txHash,
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(tokenSellLedgers.id, update.entry.id));
        }
      }
      const txTitle = walletType === "token_sell" ? `Token Auto-Sell Settlement Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee)` : `MLM & Community Earnings Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee)`;
      const [txRecord] = await db.insert(transactions).values({
        userId: user.id,
        type: "withdrawal",
        amountUsdt: netPayout,
        tokenAmount: finalTokensReturned,
        tokenPrice: 1,
        status: "completed",
        txHash
      }).returning();
      const newAvailable = Math.max(0, currentAvailable - grossAmount);
      await db.update(users).set({
        availableUsdt: newAvailable,
        totalWithdrawnUsdt: (user.totalWithdrawnUsdt || 0) + grossAmount,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
      return res.json({
        success: true,
        message: `${txTitle} processed successfully!`,
        txHash,
        walletType,
        grossAmount,
        serviceFee,
        netPayout,
        tokenReturnTxHash: tokenReturnTxHash || null,
        tokensReturned: finalTokensReturned,
        phaseBreakdown,
        executionMode,
        transaction: txRecord,
        newAvailableBalance: newAvailable
      });
    } catch (error) {
      console.error("Error in /api/wallet/withdraw:", error);
      res.status(500).json({ error: error.message || "Failed to process automatic withdrawal" });
    }
  });
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { walletAddress, referredBy } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "walletAddress is required" });
      }
      const normalizedAddress = walletAddress.toLowerCase();
      let existingUser = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      if (!existingUser) {
        const generatedRefCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: generatedRefCode,
          referredBy: referredBy || null,
          availableUsdt: 0
        }).returning();
        if (referredBy) {
          const sponsor = await db.query.users.findFirst({
            where: (0, import_drizzle_orm2.eq)(users.referralCode, referredBy.toUpperCase())
          });
          if (sponsor) {
            await db.update(users).set({ directCount: sponsor.directCount + 1, totalTeamCount: sponsor.totalTeamCount + 1 }).where((0, import_drizzle_orm2.eq)(users.id, sponsor.id));
          }
        }
        return res.json({ user: newUser, isNew: true });
      }
      return res.json({ user: existingUser, isNew: false });
    } catch (error) {
      console.error("Error in /api/users/sync:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress.toLowerCase())
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userTxs = await db.select().from(transactions).where((0, import_drizzle_orm2.eq)(transactions.userId, user.id)).orderBy((0, import_drizzle_orm2.desc)(transactions.createdAt)).limit(100);
      const userEarnings = await db.select().from(levelEarnings).where((0, import_drizzle_orm2.eq)(levelEarnings.beneficiaryId, user.id)).orderBy((0, import_drizzle_orm2.desc)(levelEarnings.createdAt)).limit(100);
      const earningTotals = await db.execute(import_drizzle_orm2.sql`
        SELECT
          COALESCE(SUM(CASE WHEN level_number > 0 THEN commission_usdt ELSE 0 END), 0) AS level_income_usdt,
          COALESCE(SUM(CASE WHEN tx_type = 'matrix_join' THEN commission_usdt ELSE 0 END), 0) AS matrix_income_usdt
        FROM level_earnings
        WHERE beneficiary_id = ${user.id}
      `);
      const earningRow = earningTotals?.rows?.[0] || {};
      res.json({
        user,
        transactions: userTxs,
        earnings: userEarnings,
        levelIncomeUsdt: Number(earningRow.level_income_usdt || 0),
        matrixIncomeUsdt: Number(earningRow.matrix_income_usdt || 0)
      });
    } catch (error) {
      console.error("Error in /api/users/:walletAddress:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/team/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || "").trim().toLowerCase();
      if (!walletAddress) return res.status(400).json({ error: "walletAddress is required" });
      const leader = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress) });
      if (!leader) return res.status(404).json({ error: "User not found" });
      const allUsers = await db.select().from(users);
      const allNodes = await db.select().from(matrixNodes).orderBy((0, import_drizzle_orm2.asc)(matrixNodes.id));
      const userById = new Map(allUsers.map((u) => [u.id, u]));
      const nodeById = new Map(allNodes.map((n) => [n.id, n]));
      const childrenByParent = /* @__PURE__ */ new Map();
      for (const node of allNodes) {
        if (node.parentId == null) continue;
        const children = childrenByParent.get(node.parentId) || [];
        children.push(node);
        childrenByParent.set(node.parentId, children);
      }
      for (const children of childrenByParent.values()) {
        children.sort((a, b) => (a.position || 0) - (b.position || 0));
      }
      const matrixLevels = {};
      const unilevelLevels = {};
      for (let i = 1; i <= 10; i++) {
        matrixLevels[String(i)] = [];
        unilevelLevels[String(i)] = [];
      }
      const toMemberRow = (member, level, position = 0, parentUser = null) => ({
        userId: member.id,
        walletAddress: member.walletAddress,
        referralCode: member.referralCode,
        sponsorReferralCode: member.referredBy || null,
        level,
        position,
        parentWalletAddress: parentUser?.walletAddress || null,
        status: member.isMlmQualified ? "active" : "investor",
        totalInvestedUsdt: Number(member.totalInvestedUsdt || 0),
        totalPurchasedTokens: Number(member.totalPurchasedTokens || 0),
        joinedAt: member.createdAt ? new Date(member.createdAt).toISOString() : null
      });
      const leaderNode = await db.query.matrixNodes.findFirst({ where: (0, import_drizzle_orm2.eq)(matrixNodes.userId, leader.id) });
      if (leaderNode) {
        const queue = [{ nodeId: leaderNode.id, level: 0 }];
        const seen = /* @__PURE__ */ new Set([leaderNode.id]);
        while (queue.length) {
          const current = queue.shift();
          if (current.level >= 10) continue;
          for (const child of childrenByParent.get(current.nodeId) || []) {
            if (seen.has(child.id)) continue;
            seen.add(child.id);
            const level = current.level + 1;
            const member = userById.get(child.userId);
            if (member) {
              const parentNode = child.parentId ? nodeById.get(child.parentId) : null;
              const parentUser = parentNode ? userById.get(parentNode.userId) : null;
              matrixLevels[String(level)].push(toMemberRow(member, level, child.position, parentUser));
            }
            queue.push({ nodeId: child.id, level });
          }
        }
      }
      const usersBySponsor = /* @__PURE__ */ new Map();
      for (const member of allUsers) {
        const sponsor = String(member.referredBy || "").trim().toUpperCase();
        if (!sponsor) continue;
        const children = usersBySponsor.get(sponsor) || [];
        children.push(member);
        usersBySponsor.set(sponsor, children);
      }
      const sponsorKeys = /* @__PURE__ */ new Set([String(leader.referralCode || "").trim().toUpperCase(), leader.walletAddress.toUpperCase()]);
      let currentMembers = [leader];
      const seenUsers = /* @__PURE__ */ new Set([leader.id]);
      for (let level = 1; level <= 10; level++) {
        const nextMembers = [];
        for (const parent of currentMembers) {
          const keys = [String(parent.referralCode || "").trim().toUpperCase(), String(parent.walletAddress || "").trim().toUpperCase()];
          for (const key of keys) {
            for (const member of usersBySponsor.get(key) || []) {
              if (seenUsers.has(member.id)) continue;
              seenUsers.add(member.id);
              unilevelLevels[String(level)].push(toMemberRow(member, level));
              nextMembers.push(member);
            }
          }
        }
        currentMembers = nextMembers;
      }
      const earnings = await db.select().from(levelEarnings).where((0, import_drizzle_orm2.eq)(levelEarnings.beneficiaryId, leader.id));
      const unilevelIncome = {};
      const matrixIncome = {};
      for (let i = 1; i <= 10; i++) {
        unilevelIncome[String(i)] = 0;
        matrixIncome[String(i)] = 0;
      }
      for (const earning of earnings) {
        const level = Number(earning.levelNumber);
        if (level < 1 || level > 10) continue;
        const amount = Number(earning.commissionUsdt || 0);
        if (earning.txType === "matrix_join") matrixIncome[String(level)] += amount;
        else if (earning.txType === "token_purchase") unilevelIncome[String(level)] += amount;
      }
      const counts = Object.fromEntries(Object.entries(matrixLevels).map(([k, v]) => [k, v.length]));
      const unilevelCounts = Object.fromEntries(Object.entries(unilevelLevels).map(([k, v]) => [k, v.length]));
      const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
      res.json({
        leader: { userId: leader.id, walletAddress: leader.walletAddress, referralCode: leader.referralCode },
        directMembers: unilevelLevels["1"],
        levels: matrixLevels,
        counts,
        totalMatrixMembers: sum(counts),
        totalDirectMembers: unilevelLevels["1"].length,
        matrixLevels,
        matrixCounts: counts,
        unilevelLevels,
        unilevelCounts,
        unilevelIncome,
        matrixIncome,
        totalUnilevelIncome: sum(unilevelIncome),
        totalMatrixIncome: sum(matrixIncome),
        maxLevel: 10,
        structure: "2x2 forced matrix"
      });
    } catch (error) {
      console.error("Error in /api/team/:walletAddress:", error);
      res.status(500).json({ error: error.message || "Failed to load team" });
    }
  });
  app.post("/api/presale/buy", async (req, res) => {
    try {
      const { walletAddress, amountUsdt, tokenAmount, tokenPrice, phaseIndex, txHash, directBuyerInviteToken } = req.body;
      if (!walletAddress || !amountUsdt || !tokenAmount) {
        return res.status(400).json({ error: "Missing required purchase fields" });
      }
      const configRecord = await db.query.systemConfigs.findFirst({
        where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases")
      });
      let activePhase = null;
      if (configRecord && configRecord.value) {
        const phases = JSON.parse(configRecord.value);
        activePhase = phases.find((p) => p.status === "active") || null;
      }
      let liveSystem = {};
      try {
        const systemRow = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "systemConfig") });
        if (systemRow?.value) liveSystem = JSON.parse(systemRow.value);
      } catch {
      }
      if (liveSystem.presalePaused === true) return res.status(403).json({ error: "Presale is currently paused by administrator." });
      if (!activePhase) {
        return res.status(400).json({ error: "No active presale phase is configured." });
      }
      const activePhasePrice = Number(activePhase.rate ?? activePhase.tokenPrice ?? activePhase.price);
      if (!Number.isFinite(activePhasePrice) || activePhasePrice <= 0) return res.status(500).json({ error: "Active phase has an invalid token price configuration." });
      const PRICE_TOLERANCE = 1e-4;
      if (Math.abs(Number(tokenPrice) - activePhasePrice) > PRICE_TOLERANCE) {
        return res.status(400).json({ error: "Submitted token price does not match the active phase price." });
      }
      const expectedTokens = Number(amountUsdt) / activePhasePrice;
      if (Math.abs(expectedTokens - Number(tokenAmount)) / Math.max(expectedTokens, 1) > 0.01) {
        return res.status(400).json({ error: "Token amount does not match amountUsdt / current phase price." });
      }
      const remainingInPhase = Math.max(0, Number(activePhase.totalSupply) - Number(activePhase.tokensSold));
      if (Number(tokenAmount) > remainingInPhase) {
        return res.status(400).json({ error: "Purchase exceeds remaining supply in the active phase.", remainingInPhase });
      }
      let purchaseStatus = "pending_verification";
      const hasValidTxHash = typeof txHash === "string" && /^0x[a-fA-F0-9]{64}$/.test(txHash);
      if (hasValidTxHash) {
        const chainCheck = await verifyPresalePurchaseOnChain({
          txHash,
          buyer: walletAddress,
          usdtAmount: Number(amountUsdt),
          nxbcAmount: Number(tokenAmount)
        });
        if (chainCheck.ok) purchaseStatus = "completed";
        else if (chainCheck.pending) purchaseStatus = "pending_verification";
        else purchaseStatus = "failed";
      }
      const normalizedAddress = walletAddress.toLowerCase();
      let user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      if (!user) {
        const generatedRefCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: generatedRefCode,
          referredBy: null,
          availableUsdt: 0
        }).returning();
        user = newUser;
      }
      if (purchaseStatus === "completed" && txHash) {
        const existingTx = await db.query.transactions.findFirst({ where: (0, import_drizzle_orm2.eq)(transactions.txHash, txHash) });
        if (existingTx) {
          return res.status(409).json({ success: false, error: "This blockchain transaction has already been recorded as a purchase.", transaction: existingTx });
        }
      }
      const [tx] = await db.insert(transactions).values({
        userId: user.id,
        type: "buy_presale",
        amountUsdt: Number(amountUsdt),
        tokenAmount: Number(tokenAmount),
        tokenPrice: activePhasePrice,
        phaseIndex: Number(activePhase.phaseNumber || phaseIndex || 1),
        status: purchaseStatus,
        txHash: hasValidTxHash ? txHash : null
      }).returning();
      if (purchaseStatus === "pending_verification") {
        return res.status(202).json({
          success: true,
          pending: true,
          message: "Purchase recorded as pending \u2014 awaiting a mined and fully verified BSC purchase transaction.",
          transaction: tx
        });
      }
      if (purchaseStatus === "failed") {
        return res.status(400).json({ success: false, error: "Purchase transaction could not be verified as a valid payment and NXBC delivery on BSC.", transaction: tx });
      }
      const { newInvested, isNowMlmQualified } = await finalizeConfirmedPurchase(
        user,
        Number(tokenAmount),
        Number(amountUsdt),
        Number(activePhase.phaseNumber || phaseIndex || 1)
      );
      const fifoSettlement = await matchVerifiedBuyerToPhaseQueue({
        buyerUserId: user.id,
        buyerWallet: normalizedAddress,
        phaseNumber: Number(activePhase.phaseNumber || phaseIndex || 1),
        buyerTokenAmount: Number(tokenAmount),
        directBuyerInviteToken: typeof directBuyerInviteToken === "string" ? directBuyerInviteToken : void 0
      });
      let tokenDispatchTxHash = txHash;
      const hotWalletDispatchEnabled = process.env.ENABLE_HOT_WALLET_DISPATCH === "true";
      if (hotWalletDispatchEnabled) {
        const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
        const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
        const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || "0x94D064AFDB04E3489C313054260929588b38dF85";
        if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {
          try {
            const provider = new import_ethers.ethers.JsonRpcProvider(rpcUrl);
            const wallet = new import_ethers.ethers.Wallet(privateKey, provider);
            const nxbcContract = new import_ethers.ethers.Contract(nxbcTokenContractAddress, ERC20_ABI, wallet);
            const parsedTokens = import_ethers.ethers.parseUnits(Number(tokenAmount).toString(), 18);
            console.log(`[TOKEN DISPATCH] Transferring ${tokenAmount} NXBC tokens directly to user wallet ${walletAddress}...`);
            const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens);
            console.log(`[TOKEN DISPATCH] Tokens sent on-chain! TxHash: ${transferTx.hash}`);
            tokenDispatchTxHash = transferTx.hash;
          } catch (dispatchErr) {
            console.error("[TOKEN DISPATCH] Automatic token dispatch notice:", dispatchErr?.message);
          }
        }
      }
      res.json({
        success: true,
        transaction: tx,
        tokenDispatchTxHash: tokenDispatchTxHash || null,
        totalInvestedUsdt: newInvested,
        isMlmQualified: isNowMlmQualified,
        statusNotice: isNowMlmQualified ? "MLM Leader Qualified ($100+ Total Investment)" : `Investor Mode ($${newInvested.toFixed(2)} / $100 USD to qualify for MLM commissions)`,
        fifoSettlement: {
          buyerTokens: Number(tokenAmount),
          userSharePercent: 20,
          adminSharePercent: 80,
          userShareTokens: fifoSettlement.userShareTokens,
          adminShareTokens: fifoSettlement.adminShareTokens,
          unmatchedUserShareTokens: fifoSettlement.unmatchedUserShareTokens,
          matches: fifoSettlement.matches
        }
      });
    } catch (error) {
      console.error("Error in /api/presale/buy:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/p2p/orders", async (req, res) => {
    try {
      const orders = await db.select({
        id: sellOrders.id,
        userId: sellOrders.userId,
        walletAddress: users.walletAddress,
        phaseNumber: sellOrders.phaseNumber,
        amountTokens: sellOrders.amountTokens,
        remainingTokens: sellOrders.remainingTokens,
        tokenPrice: sellOrders.tokenPrice,
        totalUsdtValue: sellOrders.totalUsdtValue,
        status: sellOrders.status,
        priority: sellOrders.priority,
        createdAt: sellOrders.createdAt
      }).from(sellOrders).leftJoin(users, (0, import_drizzle_orm2.eq)(sellOrders.userId, users.id)).where((0, import_drizzle_orm2.inArray)(sellOrders.status, ["open", "partially_filled"])).orderBy((0, import_drizzle_orm2.asc)(sellOrders.createdAt), (0, import_drizzle_orm2.asc)(sellOrders.priority));
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/presale/fifo-global", async (_req, res) => {
    try {
      const activeOrders = await db.select({
        id: sellOrders.id,
        userId: sellOrders.userId,
        walletAddress: users.walletAddress,
        phaseNumber: sellOrders.phaseNumber,
        amountTokens: sellOrders.amountTokens,
        remainingTokens: sellOrders.remainingTokens,
        tokenPrice: sellOrders.tokenPrice,
        status: sellOrders.status,
        priority: sellOrders.priority,
        createdAt: sellOrders.createdAt
      }).from(sellOrders).leftJoin(users, (0, import_drizzle_orm2.eq)(sellOrders.userId, users.id)).where((0, import_drizzle_orm2.inArray)(sellOrders.status, ["open", "partially_filled"])).orderBy((0, import_drizzle_orm2.asc)(sellOrders.phaseNumber), (0, import_drizzle_orm2.asc)(sellOrders.createdAt), (0, import_drizzle_orm2.asc)(sellOrders.priority), (0, import_drizzle_orm2.asc)(sellOrders.id));
      const byPhase = {};
      for (const row of activeOrders) {
        const phase = Number(row.phaseNumber);
        if (!byPhase[phase]) byPhase[phase] = [];
        byPhase[phase].push(row);
      }
      const maskWallet = (wallet) => {
        const w = String(wallet || "");
        if (w.length < 12) return "Unknown";
        return `${w.slice(0, 6)}...${w.slice(-4)}`;
      };
      const phases = Object.keys(byPhase).map(Number).sort((a, b) => a - b).map((phaseNumber) => {
        let aheadTokens = 0;
        const phaseOrders = byPhase[phaseNumber].map((row, index) => {
          const remaining = Math.max(0, Number(row.remainingTokens || 0));
          const position = index + 1;
          const order = {
            id: Number(row.id),
            userId: Number(row.userId),
            walletAddress: maskWallet(row.walletAddress),
            phaseNumber,
            amountTokens: Number(row.amountTokens || 0),
            remainingTokens: remaining,
            tokenPrice: Number(row.tokenPrice || 0),
            status: row.status,
            priority: Number(row.priority || 0),
            position,
            aheadTokens,
            expectedRemainingUsdt: remaining * Number(row.tokenPrice || 0),
            createdAt: row.createdAt
          };
          aheadTokens += remaining;
          return order;
        });
        return {
          phaseNumber,
          totalOrders: phaseOrders.length,
          totalQueuedTokens: phaseOrders.reduce((sum, o) => sum + o.remainingTokens, 0),
          orders: phaseOrders
        };
      });
      res.json({ success: true, phases, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      console.error("Error fetching global FIFO queue:", error);
      res.status(500).json({ success: false, error: "Failed to load global FIFO queue." });
    }
  });
  app.post("/api/swap/convert", async (req, res) => {
    if (!settlementEndpointsEnabled()) {
      return res.status(403).json({ success: false, error: "Unverified browser-side swaps are disabled. Use an on-chain verified settlement flow." });
    }
    try {
      const { walletAddress, fromToken, toToken, amount, txHash } = req.body;
      if (!walletAddress || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid swap parameters" });
      }
      const normalizedAddress = walletAddress.toLowerCase();
      let user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, normalizedAddress)
      });
      const confirmedTxHash = txHash || `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;
      if (user) {
        await db.insert(transactions).values({
          userId: user.id,
          type: "referral_bonus",
          amountUsdt: Number(amount),
          tokenAmount: Number(amount),
          tokenPrice: 1,
          status: "completed",
          txHash: confirmedTxHash
        });
      }
      return res.json({
        success: true,
        message: `Instant 1:1 swap executed: ${amount} ${fromToken} \u2794 ${amount} ${toToken}`,
        txHash: confirmedTxHash
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Swap execution failed" });
    }
  });
  app.get("/api/presale/allocation/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || "").toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: "Invalid wallet address." });
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress) });
      if (!user) return res.json({ success: true, totalPurchasedTokens: 0, allocations: {} });
      const orders = await db.select().from(sellOrders).where((0, import_drizzle_orm2.eq)(sellOrders.userId, user.id));
      const allocations = {};
      for (const o of orders) {
        const phase = Number(o.phaseNumber);
        if (!allocations[phase]) allocations[phase] = { allocated: 0, sold: 0 };
        allocations[phase].allocated += Number(o.amountTokens || 0);
        allocations[phase].sold += Math.max(0, Number(o.amountTokens || 0) - Number(o.remainingTokens || 0));
      }
      res.json({ success: true, totalPurchasedTokens: Number(user.totalPurchasedTokens || 0), allocations });
    } catch (error) {
      console.error("Error fetching phase allocation:", error);
      res.status(500).json({ error: "Failed to load phase allocation." });
    }
  });
  app.get("/api/presale/sale-orders/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || "").toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: "Invalid wallet address." });
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress) });
      if (!user) return res.json({ success: true, orders: [] });
      const orders = await db.select().from(sellOrders).where((0, import_drizzle_orm2.eq)(sellOrders.userId, user.id)).orderBy((0, import_drizzle_orm2.desc)(sellOrders.createdAt), (0, import_drizzle_orm2.desc)(sellOrders.id));
      res.json({
        success: true,
        orders: orders.map((o) => {
          const amount = Number(o.amountTokens || 0);
          const remaining = Math.max(0, Number(o.remainingTokens || 0));
          const sold = Math.max(0, amount - remaining);
          const price = Number(o.tokenPrice || 0);
          return {
            id: o.id,
            phaseNumber: Number(o.phaseNumber),
            amountTokens: amount,
            soldTokens: sold,
            remainingTokens: remaining,
            tokenPrice: price,
            expectedUsdt: amount * price,
            realizedUsdt: sold * price,
            remainingUsdt: remaining * price,
            status: o.status,
            createdAt: o.createdAt
          };
        })
      });
    } catch (error) {
      console.error("Error fetching personal sale orders:", error);
      res.status(500).json({ error: "Failed to load sale orders." });
    }
  });
  app.post("/api/presale/direct-buyer/invite", async (req, res) => {
    try {
      const walletAddress = String(req.body?.walletAddress || "").toLowerCase(), orderId = Number(req.body?.orderId);
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress) || !Number.isInteger(orderId)) return res.status(400).json({ error: "Valid wallet address and order ID are required." });
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress) });
      if (!user) return res.status(404).json({ error: "User not found." });
      await ensureDirectBuyerTables();
      const invite = await createDirectBuyerInvite(user.id, orderId);
      const proto = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0];
      const base = `${proto}://${req.get("host")}`;
      res.json({ success: true, inviteToken: invite.token, expiresAt: invite.expiresAt, phaseNumber: invite.phaseNumber, remainingTokens: invite.remainingTokens, shareUrl: `${base}/?directBuyer=${encodeURIComponent(invite.token)}` });
    } catch (error) {
      res.status(400).json({ error: error.message || "Could not create Direct Buyer Match invite." });
    }
  });
  app.get("/api/presale/direct-buyer/invite/:token", async (req, res) => {
    try {
      await ensureDirectBuyerTables();
      const rows = await db.execute(import_drizzle_orm2.sql`SELECT i.phase_number,i.sell_order_id,i.expires_at,i.used_at,o.remaining_tokens,o.token_price,u.wallet_address FROM direct_buyer_invites i JOIN sell_orders o ON o.id=i.sell_order_id JOIN users u ON u.id=i.seller_user_id WHERE i.token_hash=${hashDirectInvite(String(req.params.token || ""))} LIMIT 1`);
      const row = rows.rows?.[0] || rows[0];
      if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) return res.status(404).json({ error: "Invite is expired or already used." });
      res.json({ success: true, phaseNumber: Number(row.phase_number), remainingTokens: Number(row.remaining_tokens || 0), tokenPrice: Number(row.token_price || 0), sellerWalletMasked: `${String(row.wallet_address).slice(0, 6)}...${String(row.wallet_address).slice(-4)}`, expiresAt: row.expires_at });
    } catch {
      res.status(400).json({ error: "Invalid Direct Buyer Match invite." });
    }
  });
  app.post("/api/presale/allocation", async (req, res) => {
    try {
      const walletAddress = String(req.body?.walletAddress || "").toLowerCase();
      const allocations = Array.isArray(req.body?.allocations) ? req.body.allocations : [];
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: "Invalid wallet address." });
      if (!allocations.length) return res.json({ success: true, orders: [] });
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress) });
      if (!user) return res.status(404).json({ error: "User not found." });
      const totalPurchased = Number(user.totalPurchasedTokens || 0);
      if (totalPurchased <= 0) return res.status(400).json({ error: "No verified NXBC purchase is available for allocation." });
      const clean = allocations.map((a) => ({ phaseNumber: Number(a.phaseNumber), amountTokens: Number(a.amountTokens) })).filter((a) => Number.isInteger(a.phaseNumber) && a.phaseNumber >= 1 && a.phaseNumber <= 6 && Number.isFinite(a.amountTokens) && a.amountTokens > 0);
      const requested = clean.reduce((sum, a) => sum + a.amountTokens, 0);
      if (requested <= 0) return res.status(400).json({ error: "Allocation must contain at least one positive token amount." });
      const existing = await db.select().from(sellOrders).where((0, import_drizzle_orm2.eq)(sellOrders.userId, user.id));
      const activeReserved = existing.reduce((sum, o) => {
        if (["open", "partially_filled"].includes(String(o.status))) return sum + Math.max(0, Number(o.remainingTokens || 0));
        return sum;
      }, 0);
      const activeSoldNotReturned = await db.select().from(tokenSellLedgers).where((0, import_drizzle_orm2.eq)(tokenSellLedgers.userId, user.id));
      const pendingReturn = activeSoldNotReturned.reduce((sum, e) => sum + Math.max(0, Number(e.tokensSold || 0) - Number(e.tokensReturned || 0)), 0);
      const available = Math.max(0, totalPurchased - activeReserved - pendingReturn);
      if (requested > available + 1e-9) return res.status(400).json({ error: `Allocation exceeds available NXBC. You can allocate up to ${available} NXBC.`, availableTokens: available });
      const phaseRow = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases") });
      const configuredPhases = phaseRow?.value ? JSON.parse(phaseRow.value) : [];
      const maxPriorityRow = await db.select({ priority: sellOrders.priority }).from(sellOrders).orderBy((0, import_drizzle_orm2.desc)(sellOrders.priority)).limit(1);
      let priority = Number(maxPriorityRow[0]?.priority ?? 0);
      const created = [];
      for (const a of clean) {
        const phase = configuredPhases.find((p) => Number(p.phaseNumber) === a.phaseNumber);
        const price = Number(phase?.rate ?? phase?.tokenPrice ?? 0);
        if (!price || price <= 0) return res.status(400).json({ error: `Invalid price configuration for Phase ${a.phaseNumber}.` });
        priority += 1;
        const [order] = await db.insert(sellOrders).values({
          userId: user.id,
          phaseNumber: a.phaseNumber,
          amountTokens: a.amountTokens,
          remainingTokens: a.amountTokens,
          tokenPrice: price,
          totalUsdtValue: a.amountTokens * price,
          status: "open",
          priority
        }).returning();
        created.push(order);
      }
      res.json({ success: true, orders: created });
    } catch (error) {
      console.error("Error saving phase allocation:", error);
      res.status(500).json({ error: "Failed to save phase allocation." });
    }
  });
  app.post("/api/p2p/sell", async (req, res) => {
    if (!settlementEndpointsEnabled()) {
      return res.status(403).json({ success: false, error: "Unverified browser-side P2P sales are disabled. Tokens must be verified on-chain before a financial order is created." });
    }
    try {
      const { walletAddress, amountTokens, tokenPrice } = req.body;
      const user = await db.query.users.findFirst({
        where: (0, import_drizzle_orm2.eq)(users.walletAddress, walletAddress.toLowerCase())
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const phaseNum = req.body.phaseNumber ? Number(req.body.phaseNumber) : 1;
      let phasePrice = 0;
      try {
        const phaseRow = await db.query.systemConfigs.findFirst({ where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases") });
        const configuredPhases = phaseRow?.value ? JSON.parse(phaseRow.value) : [];
        const matchedPhase = configuredPhases.find((p) => Number(p.phaseNumber) === phaseNum);
        phasePrice = Number(matchedPhase?.rate ?? matchedPhase?.tokenPrice ?? 0);
      } catch {
      }
      const price = Number(tokenPrice ?? phasePrice);
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Invalid token price/phase price." });
      const totalUsdt = Number(amountTokens) * price;
      const maxPriorityRow = await db.select({ priority: sellOrders.priority }).from(sellOrders).orderBy((0, import_drizzle_orm2.desc)(sellOrders.priority)).limit(1);
      const nextPriority = Number(maxPriorityRow[0]?.priority ?? 0) + 1;
      const [order] = await db.insert(sellOrders).values({
        userId: user.id,
        phaseNumber: phaseNum,
        amountTokens: Number(amountTokens),
        remainingTokens: Number(amountTokens),
        tokenPrice: price,
        totalUsdtValue: totalUsdt,
        status: "open",
        priority: nextPriority
      }).returning();
      res.json({ success: true, order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/admin/sellqueue/reorder", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds.map(Number).filter(Number.isFinite) : [];
      if (!orderIds.length) return res.status(400).json({ error: "orderIds is required." });
      for (let i = 0; i < orderIds.length; i++) {
        await db.update(sellOrders).set({ priority: orderIds.length - i }).where((0, import_drizzle_orm2.eq)(sellOrders.id, orderIds[i]));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/admin/sellqueue/instant-fulfill", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const orderId = Number(req.body?.orderId);
      if (!Number.isFinite(orderId)) return res.status(400).json({ error: "Valid orderId is required." });
      const order = await db.query.sellOrders.findFirst({ where: (0, import_drizzle_orm2.eq)(sellOrders.id, orderId) });
      if (!order) return res.status(404).json({ error: "Sell order not found." });
      const remaining = Math.max(0, Number(order.remainingTokens));
      if (remaining <= 0 || order.status === "completed") return res.json({ success: true, order });
      const gross = remaining * Number(order.tokenPrice);
      await db.update(sellOrders).set({ remainingTokens: 0, status: "completed" }).where((0, import_drizzle_orm2.eq)(sellOrders.id, order.id));
      const user = await db.query.users.findFirst({ where: (0, import_drizzle_orm2.eq)(users.id, order.userId) });
      if (user) {
        await db.update(users).set({
          totalEarnedUsdt: Number(user.totalEarnedUsdt || 0) + gross,
          availableUsdt: Number(user.availableUsdt || 0) + gross,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
        await db.insert(tokenSellLedgers).values({
          userId: user.id,
          walletAddress: user.walletAddress,
          phaseIndex: order.phaseNumber,
          phaseName: `Phase ${order.phaseNumber}`,
          tokenPrice: Number(order.tokenPrice),
          tokensSold: remaining,
          tokensReturned: 0,
          grossUsdt: gross,
          withdrawnUsdt: 0,
          serviceFeeUsdt: 0,
          status: "unclaimed"
        });
      }
      res.json({ success: true, orderId: order.id, tokensSold: remaining, grossUsdt: gross });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  let inMemoryAdminPinHash = hashPin("7788");
  app.post("/api/admin/verify-pin", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lockout = checkPinLockout(ip);
      if (lockout.locked) {
        return res.status(429).json({
          success: false,
          error: `Too many incorrect attempts. Try again in ${Math.ceil((lockout.retryAfterMs || 0) / 6e4)} minute(s).`
        });
      }
      const { pin } = req.body;
      const cleanPin = (pin || "").trim();
      let currentPinHash = inMemoryAdminPinHash;
      try {
        const pinRecord = await db.query.systemConfigs.findFirst({
          where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "admin_pin")
        });
        if (pinRecord && pinRecord.value) {
          currentPinHash = pinRecord.value;
          inMemoryAdminPinHash = pinRecord.value;
        }
      } catch (dbErr) {
      }
      if (cleanPin && verifyPin(cleanPin, currentPinHash)) {
        recordPinSuccess(ip);
        const adminToken = issueAdminSession();
        return res.json({ success: true, message: "Authentication successful", adminToken });
      } else {
        recordPinFailure(ip);
        return res.status(401).json({ success: false, error: "Incorrect Security PIN. Access Denied." });
      }
    } catch (err) {
      res.status(500).json({ error: err?.message || "Server authentication error" });
    }
  });
  app.post("/api/admin/change-pin", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lockout = checkPinLockout(ip);
      if (lockout.locked) {
        return res.status(429).json({
          error: `Too many incorrect attempts. Try again in ${Math.ceil((lockout.retryAfterMs || 0) / 6e4)} minute(s).`
        });
      }
      const { currentPin, newPin } = req.body;
      const cleanCurrent = (currentPin || "").trim();
      const cleanNew = (newPin || "").trim();
      if (!cleanNew || cleanNew.length < 6 || !/^\d+$/.test(cleanNew)) {
        return res.status(400).json({ error: "New PIN must be at least 6 digits." });
      }
      let activePinHash = inMemoryAdminPinHash;
      try {
        const pinRecord = await db.query.systemConfigs.findFirst({
          where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "admin_pin")
        });
        if (pinRecord && pinRecord.value) {
          activePinHash = pinRecord.value;
        }
      } catch (dbErr) {
      }
      if (!cleanCurrent || !verifyPin(cleanCurrent, activePinHash)) {
        recordPinFailure(ip);
        return res.status(401).json({ error: "Current PIN is incorrect." });
      }
      recordPinSuccess(ip);
      const newHash = hashPin(cleanNew);
      inMemoryAdminPinHash = newHash;
      try {
        const existing = await db.query.systemConfigs.findFirst({
          where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "admin_pin")
        });
        if (existing) {
          await db.update(systemConfigs).set({ value: newHash, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(systemConfigs.key, "admin_pin"));
        } else {
          await db.insert(systemConfigs).values({ key: "admin_pin", value: newHash, description: "Master Admin Security PIN (hashed)" });
        }
      } catch (dbErr) {
        console.log("Database PIN update notice:", dbErr);
      }
      res.json({ success: true, message: "Admin PIN changed successfully!" });
    } catch (err) {
      res.status(500).json({ error: err?.message || "Failed to update PIN" });
    }
  });
  app.get("/api/presale/config", async (_req, res) => {
    try {
      const configRecord = await db.query.systemConfigs.findFirst({
        where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases")
      });
      if (!configRecord?.value) {
        return res.json({ success: true, phases: [] });
      }
      const phases = JSON.parse(configRecord.value);
      const safePhases = Array.isArray(phases) ? phases.map((p) => ({
        id: p.id,
        phaseNumber: Number(p.phaseNumber ?? 0),
        name: p.name,
        shortName: p.shortName,
        rate: Number(p.rate ?? p.tokenPrice ?? p.price ?? 0),
        rateLabel: p.rateLabel,
        totalSupply: Number(p.totalSupply ?? 0),
        tokensSold: Number(p.tokensSold ?? 0),
        status: p.status,
        multiplier: p.multiplier,
        unlockRequirement: p.unlockRequirement,
        targetDate: p.targetDate
      })) : [];
      res.json({ success: true, phases: safePhases });
    } catch (error) {
      console.error("Error in /api/presale/config:", error);
      res.status(500).json({ success: false, error: "Failed to load presale configuration." });
    }
  });
  app.get("/api/presale/trust-stats", async (_req, res) => {
    try {
      const result = await db.execute(import_drizzle_orm2.sql`
        SELECT
          COALESCE(SUM(token_amount), 0) AS total_tokens_sold,
          COALESCE(SUM(amount_usdt), 0) AS total_usdt_received,
          COUNT(*) AS completed_purchases
        FROM transactions
        WHERE type = 'buy_presale'
          AND status = 'completed'
      `);
      const row = result?.rows?.[0] || {};
      const completedPurchases = Number(row.completed_purchases || 0);
      if (completedPurchases > 0) {
        return res.json({
          success: true,
          totalTokensSold: Number(row.total_tokens_sold || 0),
          totalUsdtReceived: Number(row.total_usdt_received || 0),
          completedPurchases,
          source: "verified_transactions",
          verified: true
        });
      }
      const phaseRow = await db.query.systemConfigs.findFirst({
        where: (0, import_drizzle_orm2.eq)(systemConfigs.key, "phases")
      });
      let phaseTokens = 0;
      let phaseUsdt = 0;
      if (phaseRow?.value) {
        const phases = JSON.parse(phaseRow.value);
        if (Array.isArray(phases)) {
          for (const phase of phases) {
            const sold = Math.max(0, Number(phase.tokensSold || 0));
            const rate = Number(phase.rate ?? phase.tokenPrice ?? phase.price ?? 0);
            phaseTokens += sold;
            if (Number.isFinite(rate) && rate > 0) phaseUsdt += sold * rate;
          }
        }
      }
      return res.json({
        success: true,
        totalTokensSold: phaseTokens,
        totalUsdtReceived: phaseUsdt,
        completedPurchases: 0,
        source: "phase_config_fallback",
        verified: false
      });
    } catch (error) {
      console.error("Error in /api/presale/trust-stats:", error);
      res.status(500).json({ success: false, error: "Failed to load presale statistics." });
    }
  });
  app.get("/api/admin/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      let dbConfigs = {};
      try {
        const rows = await db.select().from(systemConfigs);
        for (const row of rows) {
          try {
            dbConfigs[row.key] = JSON.parse(row.value);
          } catch {
            dbConfigs[row.key] = row.value;
          }
        }
      } catch (dbErr) {
      }
      res.json({
        success: true,
        phases: dbConfigs.phases || null,
        referralLevels: dbConfigs.referralLevels || null,
        rankRewards: dbConfigs.rankRewards || null,
        systemConfig: dbConfigs.systemConfig || null,
        matrixConfig: dbConfigs.matrixConfig || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/admin/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { phases, referralLevels, rankRewards, systemConfig, matrixConfig } = req.body;
      const itemsToSave = [
        { key: "phases", value: phases ? JSON.stringify(phases) : null, desc: "Presale Phases and Coin Prices" },
        { key: "referralLevels", value: referralLevels ? JSON.stringify(referralLevels) : null, desc: "10-Level Commission Plan" },
        { key: "rankRewards", value: rankRewards ? JSON.stringify(rankRewards) : null, desc: "Leadership Rank Rewards" },
        { key: "systemConfig", value: systemConfig ? JSON.stringify(systemConfig) : null, desc: "System Parameters" },
        { key: "matrixConfig", value: matrixConfig ? JSON.stringify(matrixConfig) : null, desc: "2x2 Matrix System Config" }
      ];
      for (const item of itemsToSave) {
        if (!item.value) continue;
        try {
          const existing = await db.query.systemConfigs.findFirst({
            where: (0, import_drizzle_orm2.eq)(systemConfigs.key, item.key)
          });
          if (existing) {
            await db.update(systemConfigs).set({ value: item.value, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(systemConfigs.key, item.key));
          } else {
            await db.insert(systemConfigs).values({ key: item.key, value: item.value, description: item.desc });
          }
        } catch (dbErr) {
          console.log(`DB config save notice (${item.key}):`, dbErr);
        }
      }
      console.log("[ADMIN SYNC] Live configurations updated and persisted to PostgreSQL.");
      res.json({
        success: true,
        message: "Configurations updated successfully and applied to all users!"
      });
    } catch (error) {
      console.error("Error in /api/admin/configs POST:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/system/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const configs = await db.select().from(systemConfigs);
      res.json({ configs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        allowedHosts: true
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    verifyPendingPresalePurchases().catch((err) => console.error("[PRESALE VERIFY] Initial run failed:", err));
    setInterval(() => {
      verifyPendingPresalePurchases().catch((err) => console.error("[PRESALE VERIFY] Scheduled run failed:", err));
    }, 60 * 1e3);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
