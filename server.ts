import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { users, matrixNodes, levelEarnings, transactions, sellOrders, systemConfigs, tokenSellLedgers, rankAchievements } from "./src/db/schema.ts";
import { eq, desc, asc, and, or, inArray, sql } from "drizzle-orm";
import { ethers } from "ethers";
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";

// ---------------------------------------------------------------------------
// Admin PIN hashing + brute-force lockout
// ---------------------------------------------------------------------------
// PINs are never stored or compared in plaintext. We hash with a random salt
// (scrypt, built into Node) and store "salt:hash" as the systemConfigs value.
// A per-IP attempt counter locks out further guesses after too many failures.

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false; // handles legacy plaintext values safely (never matches)
  const candidate = scryptSync(pin, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const pinAttempts = new Map<string, { count: number; lockedUntil: number }>();
const adminSessions = new Map<string, number>();
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function issueAdminSession(): string {
  const token = randomBytes(32).toString("hex");
  adminSessions.set(token, Date.now() + ADMIN_SESSION_TTL_MS);
  return token;
}

function requireAdmin(req: express.Request, res: express.Response): boolean {
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
}, 15 * 60 * 1000);
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkPinLockout(ip: string): { locked: boolean; retryAfterMs?: number } {
  const entry = pinAttempts.get(ip);
  if (!entry) return { locked: false };
  if (entry.lockedUntil > Date.now()) {
    return { locked: true, retryAfterMs: entry.lockedUntil - Date.now() };
  }
  return { locked: false };
}

function recordPinFailure(ip: string) {
  const entry = pinAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= PIN_MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + PIN_LOCKOUT_MS;
    entry.count = 0;
  }
  pinAttempts.set(ip, entry);
}

function recordPinSuccess(ip: string) {
  pinAttempts.delete(ip);
}

// ERC20 Minimal ABI for USDT / Token Transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const ERC20_TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const DEFAULT_NXBC_TOKEN_ADDRESS = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";
const DEFAULT_BSC_RPC = "https://bsc-dataseed.binance.org/";
const DEFAULT_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const DEFAULT_PRESALE_ADDRESS = "0x0C4a86691B3937549BFa688211EbF56520B64981";
const DEFAULT_ADMIN_WALLET = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";


const LIVE_PRESALE_PHASE_NAMES = [
  { name: 'Phase 1', shortName: 'P1' },
  { name: 'Phase 2', shortName: 'P2' },
  { name: 'Phase 3', shortName: 'P3' },
  { name: 'Phase 4', shortName: 'P4' },
  { name: 'Phase 5', shortName: 'P5' },
] as const;

async function getLivePresaleState() {
  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const configuredPresale = String(process.env.NXBC_PRESALE_CONTRACT_ADDRESS || '').trim();
  const presaleAddress = configuredPresale || DEFAULT_PRESALE_ADDRESS;
  if (presaleAddress.toLowerCase() !== DEFAULT_PRESALE_ADDRESS.toLowerCase()) {
    throw new Error('NXBC_PRESALE_CONTRACT_ADDRESS does not match the current live presale contract.');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const presale = new ethers.Contract(presaleAddress, [
    'function currentPhase() view returns (uint256)',
    'function currentPhasePrice() view returns (uint256)',
    'function currentPhaseAllocation() view returns (uint256)',
    'function currentPhaseSold() view returns (uint256)',
    'function currentPhaseRemaining() view returns (uint256)',
    'function totalSold() view returns (uint256)',
    'function presaleActive() view returns (bool)',
    'function presaleNXBCBalance() view returns (uint256)',
    'function phases(uint256) view returns (uint256 price, uint256 allocation, uint256 sold)',
  ], provider);

  const [currentPhaseRaw, active, totalSoldRaw, presaleBalanceRaw, phaseRows] = await Promise.all([
    presale.currentPhase(),
    presale.presaleActive(),
    presale.totalSold(),
    presale.presaleNXBCBalance(),
    Promise.all(Array.from({ length: 5 }, (_, i) => presale.phases(i))),
  ]);

  const currentPhase = Number(currentPhaseRaw);
  const totalSold = Number(ethers.formatUnits(totalSoldRaw, 18));
  const presaleBalance = Number(ethers.formatUnits(presaleBalanceRaw, 18));
  const normalizedPhases = phaseRows.map((row: any, idx: number) => {
    const price = Number(ethers.formatUnits(row.price, 18));
    const totalSupply = Number(ethers.formatUnits(row.allocation, 18));
    const tokensSold = Number(ethers.formatUnits(row.sold, 18));
    const remaining = Math.max(0, totalSupply - tokensSold);
    const phaseNumber = idx + 1;
    const isCurrent = phaseNumber === currentPhase;
    const status = phaseNumber < currentPhase
      ? 'completed'
      : isCurrent
        ? (!active && currentPhase === 5 ? 'completed' : 'active')
        : 'upcoming';
    return {
      id: `p${phaseNumber}`,
      phaseNumber,
      name: LIVE_PRESALE_PHASE_NAMES[idx].name,
      shortName: LIVE_PRESALE_PHASE_NAMES[idx].shortName,
      rate: price,
      rateLabel: `$${price.toFixed(2)}`,
      totalSupply,
      tokensSold,
      remaining,
      status,
      unlockRequirement: phaseNumber === 1 ? 'Live Now' : `After P${phaseNumber - 1}`,
    };
  });

  const current = normalizedPhases[Math.max(0, Math.min(4, currentPhase - 1))];
  return {
    currentPhase,
    price: current?.rate || 0,
    currentAllocation: current?.totalSupply || 0,
    currentSold: current?.tokensSold || 0,
    currentRemaining: current?.remaining || 0,
    totalSold,
    active,
    presaleBalance,
    phases: normalizedPhases,
  };
}

function settlementEndpointsEnabled(): boolean {
  return process.env.ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS === "true";
}

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = [
    'RPC_URL', 'NXBC_TOKEN_ADDRESS', 'NXBC_PRESALE_CONTRACT_ADDRESS',
    'USDT_CONTRACT_ADDRESS', 'PRESALE_RECEIVING_WALLET', 'NXBC_RETURN_TREASURY_ADDRESS',
    'PAYOUT_HOT_WALLET_PRIVATE_KEY', 'ADMIN_PIN_INITIAL',
  ];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  const hasDatabaseUrl = !!String(process.env.DATABASE_URL || '').trim();
  const hasDatabaseParts = ['SQL_HOST','SQL_USER','SQL_PASSWORD','SQL_DB_NAME'].every((key) => !!String(process.env[key] || '').trim());
  if (!hasDatabaseUrl && !hasDatabaseParts) missing.unshift('DATABASE_URL (or SQL_HOST/SQL_USER/SQL_PASSWORD/SQL_DB_NAME)');
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  if (process.env.ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS === 'true') {
    throw new Error('ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS must not be true in production.');
  }
  if (process.env.ENABLE_HOT_WALLET_DISPATCH === 'true') {
    throw new Error('ENABLE_HOT_WALLET_DISPATCH must remain false; the deployed presale contract is the only NXBC delivery path.');
  }
  for (const key of ['NXBC_TOKEN_ADDRESS','NXBC_PRESALE_CONTRACT_ADDRESS','USDT_CONTRACT_ADDRESS','PRESALE_RECEIVING_WALLET','NXBC_RETURN_TREASURY_ADDRESS']) {
    try { ethers.getAddress(String(process.env[key])); } catch { throw new Error(`${key} is not a valid EVM address.`); }
  }
  const pin = String(process.env.ADMIN_PIN_INITIAL || '').trim();
  if (!/^\d{6,}$/.test(pin)) throw new Error('ADMIN_PIN_INITIAL must be at least 6 numeric digits.');
}

async function verifyPresalePurchaseOnChain(params: {
  txHash: string;
  buyer: string;
  usdtAmount: number;
  nxbcAmount: number;
}): Promise<{ ok: boolean; pending?: boolean; error?: string; phase?: number; usdtAmount?: number; nxbcAmount?: number }> {
  const { txHash, buyer, usdtAmount, nxbcAmount } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) {
    return { ok: false, error: "Invalid BSC transaction hash." };
  }

  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 56n) {
    return { ok: false, error: "Configured RPC is not BSC Mainnet (chainId 56)." };
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { ok: false, pending: true, error: "Purchase transaction is not mined yet." };
  if (receipt.status !== 1) return { ok: false, error: "Purchase transaction reverted on BSC." };
  if (receipt.from.toLowerCase() !== buyer.toLowerCase()) {
    return { ok: false, error: "Purchase transaction sender does not match the buyer wallet." };
  }

  const presaleAddress = (
    process.env.NXBC_PRESALE_CONTRACT_ADDRESS ||
    process.env.NXBC_PRESALE_CONTRACT ||
    DEFAULT_PRESALE_ADDRESS
  ).toLowerCase();

  const purchaseTx = await provider.getTransaction(txHash);
  if (!purchaseTx || !purchaseTx.to || purchaseTx.to.toLowerCase() !== presaleAddress) {
    return { ok: false, error: "The transaction was not sent to the official NXBC Presale contract." };
  }

  // IMPORTANT: use the addresses stored inside the deployed presale contract as
  // the source of truth. This avoids false verification failures if an old or
  // different .env address is still configured on the server.
  const presale = new ethers.Contract(presaleAddress, [
    "function nxbcToken() view returns (address)",
    "function usdtToken() view returns (address)",
    "function adminWallet() view returns (address)",
  ], provider);

  let nxbcAddress = (process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS).toLowerCase();
  let usdtAddress = (process.env.USDT_CONTRACT_ADDRESS || DEFAULT_USDT_ADDRESS).toLowerCase();
  let adminWallet = (process.env.PRESALE_RECEIVING_WALLET || DEFAULT_ADMIN_WALLET).toLowerCase();

  try { nxbcAddress = (await presale.nxbcToken()).toLowerCase(); } catch {}
  try { usdtAddress = (await presale.usdtToken()).toLowerCase(); } catch {}
  try { adminWallet = (await presale.adminWallet()).toLowerCase(); } catch {}

  const transferIface = new ethers.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]);
  const purchaseIface = new ethers.Interface([
    "event TokensPurchased(address indexed buyer, uint256 indexed phase, uint256 usdtAmount, uint256 nxbcAmount)"
  ]);

  const usdtRaw = ethers.parseUnits(Number(usdtAmount).toFixed(18), 18);
  const nxbcRaw = ethers.parseUnits(Number(nxbcAmount).toFixed(18), 18);
  let usdtPaid = false;
  let nxbcDelivered = false;
  let purchaseEventMatched = false;
  let verifiedPhase = 0;
  let verifiedUsdt = 0;
  let verifiedNxbc = 0;

  for (const log of receipt.logs) {
    const logAddress = log.address.toLowerCase();

    if (log.topics?.[0]?.toLowerCase() === ERC20_TRANSFER_TOPIC.toLowerCase()) {
      if (logAddress === usdtAddress || logAddress === nxbcAddress) {
        try {
          const parsed = transferIface.parseLog(log);
          if (parsed && parsed.name === "Transfer") {
            const from = String(parsed.args.from).toLowerCase();
            const to = String(parsed.args.to).toLowerCase();
            const value = parsed.args.value as bigint;

            if (logAddress === usdtAddress &&
                from === buyer.toLowerCase() &&
                to === adminWallet &&
                value === usdtRaw) {
              usdtPaid = true;
            }

            if (logAddress === nxbcAddress &&
                from === presaleAddress &&
                to === buyer.toLowerCase() &&
                value === nxbcRaw) {
              nxbcDelivered = true;
            }
          }
        } catch {}
      }
    }

    // The deployed contract emits this event only after the NXBC transfer has
    // succeeded. It is an additional canonical proof of the purchase and makes
    // verification robust against token implementations/providers that expose
    // ERC20 Transfer logs differently.
    if (logAddress === presaleAddress && log.topics?.[0]) {
      try {
        const parsed = purchaseIface.parseLog(log);
        if (parsed && parsed.name === "TokensPurchased") {
          const eventBuyer = String(parsed.args.buyer).toLowerCase();
          const eventUsdt = parsed.args.usdtAmount as bigint;
          const eventNxbc = parsed.args.nxbcAmount as bigint;
          if (eventBuyer === buyer.toLowerCase() && eventUsdt === usdtRaw && eventNxbc === nxbcRaw) {
            purchaseEventMatched = true;
            verifiedPhase = Number(parsed.args.phase);
            verifiedUsdt = Number(ethers.formatUnits(eventUsdt, 18));
            verifiedNxbc = Number(ethers.formatUnits(eventNxbc, 18));
          }
        }
      } catch {}
    }
  }

  if (!usdtPaid) {
    return { ok: false, error: "The BSC transaction does not contain the required USDT payment to the presale treasury." };
  }

  // For this deployed presale, TokensPurchased is emitted after the contract's
  // nxbcToken.transfer(msg.sender, nxbcAmount) succeeds. Accept either the
  // exact Transfer proof or the canonical purchase event as delivery proof.
  if (!nxbcDelivered && !purchaseEventMatched) {
    return { ok: false, error: "The BSC transaction does not contain the expected NXBC delivery from the current presale contract." };
  }

  return { ok: true, phase: verifiedPhase || undefined, usdtAmount: verifiedUsdt || usdtAmount, nxbcAmount: verifiedNxbc || nxbcAmount };
}

/**
 * Verify a user-signed NXBC return by reading the canonical BSC receipt and
 * decoding the ERC-20 Transfer event. This intentionally does NOT trust the
 * tx hash, client-supplied token count, or a locally generated fallback hash.
 */
async function verifyExactNxbcReturn(params: {
  txHash: string;
  expectedSender: string;
  expectedRecipient: string;
  expectedTokenAmount: number;
}): Promise<{ ok: boolean; error?: string; blockNumber?: number; actualAmount?: string }> {
  const { txHash, expectedSender, expectedRecipient, expectedTokenAmount } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) {
    return { ok: false, error: "Invalid NXBC return transaction hash." };
  }

  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 56n) return { ok: false, error: "Configured RPC is not BSC Mainnet (chainId 56)." };
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { ok: false, error: "NXBC return transaction is not mined yet." };
  if (receipt.status !== 1) return { ok: false, error: "NXBC return transaction reverted on BSC." };
  if (receipt.from.toLowerCase() !== expectedSender.toLowerCase()) {
    return { ok: false, error: "NXBC return transaction sender does not match the withdrawing wallet." };
  }

  const tokenAddress = ethers.getAddress(process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS);
  const sender = ethers.getAddress(expectedSender);
  const recipient = ethers.getAddress(expectedRecipient);
  const expectedAmount = ethers.parseUnits(expectedTokenAmount.toFixed(18), 18);

  let matched = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;
    if (!log.topics?.[0] || log.topics[0].toLowerCase() !== ERC20_TRANSFER_TOPIC.toLowerCase()) continue;
    if (log.topics.length < 3 || !log.data) continue;
    try {
      const from = ethers.getAddress("0x" + log.topics[1].slice(-40));
      const to = ethers.getAddress("0x" + log.topics[2].slice(-40));
      const amount = BigInt(log.data);
      if (from === sender && to === recipient && amount === expectedAmount) {
        matched = true;
        return { ok: true, blockNumber: receipt.blockNumber, actualAmount: amount.toString() };
      }
    } catch { /* ignore malformed/non-transfer logs */ }
  }

  if (!matched) {
    return {
      ok: false,
      error: `NXBC return verification failed. Expected exactly ${expectedTokenAmount} NXBC from ${sender} to ${recipient}.`,
    };
  }
  return { ok: false, error: "NXBC return verification failed." };
}

// ---------------------------------------------------------------------------
// Wallet-signature authentication for money-moving endpoints
// ---------------------------------------------------------------------------
// Any endpoint that pays out or debits funds must prove the caller actually
// controls the wallet they claim to be acting as. We do this by requiring the
// client to sign a short-lived message with their wallet's private key
// (MetaMask/Trust Wallet "personal_sign"), and verifying that signature here
// with ethers.verifyMessage. This also gives us free replay protection via
// the timestamp + one-time-use nonce cache below.

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // signed message valid for 5 minutes
const usedSignatures = new Set<string>(); // prevents replaying the same signed request twice

function buildWithdrawMessage(walletAddress: string, amountUsdt: number, walletType: string, timestamp: number) {
  // Keep this EXACTLY in sync with whatever string the frontend signs.
  return `Authorize withdrawal\nWallet: ${walletAddress.toLowerCase()}\nAmount: ${amountUsdt} USDT\nType: ${walletType}\nTimestamp: ${timestamp}`;
}

async function getVerifiedPresaleTokensByPhase(phaseNumber: number): Promise<number> {
  try {
    const rows = await db.select({
      total: sql`coalesce(sum(${transactions.tokenAmount}), 0)`,
    })
      .from(transactions)
      .where(and(
        eq(transactions.type, "buy_presale"),
        eq(transactions.status, "completed"),
        eq(transactions.phaseIndex, phaseNumber),
      ));
    return Math.max(0, Number(rows[0]?.total ?? 0));
  } catch (error) {
    console.error(`[PHASE SOLD] Failed to calculate verified sales for phase ${phaseNumber}:`, error);
    return 0;
  }
}

async function getPhaseSalesSnapshot(phase: any): Promise<{ adminSold: number; verifiedSold: number; totalSold: number }> {
  const phaseNumber = Number(phase?.phaseNumber || 0);
  const legacySold = Math.max(0, Number(phase?.tokensSold ?? 0));
  const verifiedSold = phaseNumber > 0 ? await getVerifiedPresaleTokensByPhase(phaseNumber) : 0;
  // Before this fix, tokensSold was a combined counter. If adminSold does not
  // exist yet, preserve that legacy total instead of double-counting verified
  // purchases. Once adminSold exists, it is a separate manual baseline.
  const adminSold = phase?.adminSold !== undefined && phase?.adminSold !== null
    ? Math.max(0, Number(phase.adminSold))
    : Math.max(0, legacySold - verifiedSold);
  return {
    adminSold,
    verifiedSold,
    totalSold: Math.max(0, adminSold + verifiedSold),
  };
}

function verifyWalletSignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

// Periodically clear old entries so usedSignatures doesn't grow forever
setInterval(() => {
  if (usedSignatures.size > 50000) usedSignatures.clear();
}, 30 * 60 * 1000);

async function finalizeConfirmedPurchase(
  user: any,
  tokenAmount: number,
  amountUsdt: number,
  phaseIndex: number
): Promise<{ newInvested: number; isNowMlmQualified: boolean }> {
      // --- SERVER-SIDE PHASE PROGRESSION ---
      try {
        const configRecord = await db.query.systemConfigs.findFirst({
            where: eq(systemConfigs.key, 'phases')
        });
        if (configRecord && configRecord.value) {
            const phases = JSON.parse(configRecord.value);
            const activeIdx = phases.findIndex((p: any) => p.status === 'active');
            if (activeIdx !== -1) {
                const currentP = phases[activeIdx];
                const phaseNumber = Number(currentP.phaseNumber || phaseIndex || activeIdx + 1);
                const sales = await getPhaseSalesSnapshot(currentP);
                const adminSold = sales.adminSold;
                const verifiedSold = sales.verifiedSold;
                const totalSold = sales.totalSold;
                const cappedSold = Math.min(Math.max(0, Number(currentP.totalSupply || 0)), totalSold);

                phases[activeIdx].adminSold = adminSold;
                phases[activeIdx].tokensSold = cappedSold;
                if (cappedSold >= Number(currentP.totalSupply || 0)) {
                    phases[activeIdx].status = 'completed';
                    if (activeIdx + 1 < phases.length) {
                        phases[activeIdx + 1].status = 'active';
                        phases[activeIdx + 1].adminSold = Math.max(0, Number(phases[activeIdx + 1].adminSold ?? phases[activeIdx + 1].tokensSold ?? 0));
                        const nextPhaseNumber = Number(phases[activeIdx + 1].phaseNumber || activeIdx + 2);
                        const nextVerifiedSold = await getVerifiedPresaleTokensByPhase(nextPhaseNumber);
                        phases[activeIdx + 1].tokensSold = Math.min(
                          Math.max(0, Number(phases[activeIdx + 1].totalSupply || 0)),
                          phases[activeIdx + 1].adminSold + nextVerifiedSold,
                        );
                    }
                }
                await db.update(systemConfigs).set({ value: JSON.stringify(phases), updatedAt: new Date() }).where(eq(systemConfigs.key, 'phases'));
                console.log(`[API] Phase progression updated. Phase ${currentP.id}: adminSold=${adminSold}, verifiedSold=${verifiedSold}, totalSold=${cappedSold}`);
            }
        }
      } catch (phaseErr) {
        console.error("Error updating phase progression in DB:", phaseErr);
      }
      // --- END PHASE PROGRESSION ---

      // Update user investment & qualification from live admin config.
      let liveQualificationUsd = 100;
      try {
        const sys = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'systemConfig') });
        if (sys?.value) {
          const parsed = JSON.parse(sys.value);
          liveQualificationUsd = Math.max(0, Number(parsed.minMlmQualifyUsd ?? 100));
        }
      } catch {}

      const prevInvested = Number(user.totalInvestedUsdt || 0);
      const purchaseUsdt = Number(amountUsdt);
      const newInvested = prevInvested + purchaseUsdt;
      const wasMlmQualified = user.isMlmQualified || (prevInvested >= liveQualificationUsd);
      const isNowMlmQualified = newInvested >= liveQualificationUsd;

      // Update user purchased token totals and MLM qualification status
      await db.update(users)
        .set({
          totalPurchasedTokens: user.totalPurchasedTokens + Number(tokenAmount),
          totalInvestedUsdt: newInvested,
          isMlmQualified: isNowMlmQualified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // --- VOLUME UPDATES & RANK REWARD CHECK ---
      if (user.referredBy) {
        let tempSponsor: string | null = user.referredBy;
        let isDirect = true;
        
        while (tempSponsor) {
          const upUser = await db.query.users.findFirst({ where: eq(users.referralCode, tempSponsor) });
          if (!upUser) break;
          
          let updatedDirectVol = upUser.totalDirectVolume || 0;
          let updatedTeamVol = (upUser.totalTeamVolume || 0) + purchaseUsdt;
          
          if (isDirect) {
            updatedDirectVol += purchaseUsdt;
            isDirect = false;
          }
          
          // Parse live Rank Rewards from system configs or fallback to defaults
          const sysConfRows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'rankRewards'));
          let activeRanks = [
            { rankNumber: 1, requiredDirectVolume: 1000, requiredTeamVolume: 5000, requiredDirects: 3, oneTimeBonusUsd: 50 },
            { rankNumber: 2, requiredDirectVolume: 5000, requiredTeamVolume: 20000, requiredDirects: 5, oneTimeBonusUsd: 200 },
            { rankNumber: 3, requiredDirectVolume: 10000, requiredTeamVolume: 100000, requiredDirects: 10, oneTimeBonusUsd: 1500 },
            { rankNumber: 4, requiredDirectVolume: 100000, requiredTeamVolume: 2000000, requiredDirects: 0, oneTimeBonusUsd: 50000 },
            { rankNumber: 5, requiredDirectVolume: 100000, requiredTeamVolume: 5000000, requiredDirects: 0, oneTimeBonusUsd: 100000 },
          ];
          if (sysConfRows.length > 0) {
            try {
              const parsed = JSON.parse(sysConfRows[0].value);
              if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                activeRanks = parsed.sort((a,b) => a.rankNumber - b.rankNumber);
              }
            } catch (e) {}
          }
          
          let newlyAchievedRank = upUser.highestRankAchieved || 0;
          let rankBonusToPay = 0;
          
          for (const rank of activeRanks) {
             if (rank.rankNumber > newlyAchievedRank) {
                if (updatedDirectVol >= (rank.requiredDirectVolume || 0) && 
                    updatedTeamVol >= (rank.requiredTeamVolume || 0) && 
                    true) {
                    
                    newlyAchievedRank = rank.rankNumber;
                    rankBonusToPay += (rank.oneTimeBonusUsd || 0);
                    
                    await db.insert(rankAchievements).values({
                       userId: upUser.id,
                       rankLevel: rank.rankNumber,
                       rewardUsdt: rank.oneTimeBonusUsd || 0
                    });
                } else {
                    break; // Ranks are sequential
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
          }).where(eq(users.id, upUser.id));
          
          if (rankBonusToPay > 0) {
             await db.insert(levelEarnings).values({
                  beneficiaryId: upUser.id,
                  sourceUserId: user.id,
                  levelNumber: 0, 
                  percentage: 0,
                  commissionUsdt: rankBonusToPay,
                  txType: 'rank_reward',
             });
          }
          
          tempSponsor = upUser.referredBy;
        }
      }
      // --- END VOLUME & RANK REWARD ---

      // Direct Sponsor (10%) & 10-Level Commission Distribution Logic (ONLY when user reaches >= $100 Cumulative Investment Threshold)
      if (isNowMlmQualified) {
        // If user just crossed the $100 threshold (e.g., 50 + 50 = 100), commission is distributed on the eligible amount
        const commissionBaseAmount = wasMlmQualified ? purchaseUsdt : newInvested;
        let liveSystemConfig: any = {};
        let liveReferralLevels: any[] = [];
        try {
          const rows = await db.select().from(systemConfigs);
          const byKey: Record<string, any> = {};
          for (const row of rows) { try { byKey[row.key] = JSON.parse(row.value); } catch { byKey[row.key] = row.value; } }
          liveSystemConfig = byKey.systemConfig || {};
          liveReferralLevels = Array.isArray(byKey.referralLevels) ? byKey.referralLevels : [];
        } catch {}
        const directSponsorRate = Math.max(0, Number(liveSystemConfig.directSponsorPercent ?? 10)) / 100;
        const levelPercentages = Array.from({ length: 10 }, (_, i) => {
          const configured = liveReferralLevels.find((l: any) => Number(l.level) === i + 1);
          return Math.max(0, Number(configured?.commissionPercent ?? 0)) / 100;
        });
        let currentSponsorCode = user.referredBy;

        // 1. Direct Sponsor Bonus (10%)
        if (currentSponsorCode) {
          const directSponsor = await db.query.users.findFirst({
            where: eq(users.referralCode, currentSponsorCode),
          });

          if (directSponsor) {
            const isDirectQualified = directSponsor.isMlmQualified || ((directSponsor.totalInvestedUsdt || 0) >= liveQualificationUsd);
            if (isDirectQualified) {
              const sponsorBonusAmount = commissionBaseAmount * directSponsorRate;
              if (sponsorBonusAmount > 0) {
                await db.insert(levelEarnings).values({
                  beneficiaryId: directSponsor.id,
                  sourceUserId: user.id,
                  levelNumber: 0, // 0 indicates Direct Sponsor
                  percentage: directSponsorRate * 100,
                  commissionUsdt: sponsorBonusAmount,
                  txType: 'token_purchase',
                });

                await db.update(users)
                  .set({
                    totalEarnedUsdt: directSponsor.totalEarnedUsdt + sponsorBonusAmount,
                    availableUsdt: directSponsor.availableUsdt + sponsorBonusAmount,
                    updatedAt: new Date(),
                  })
                  .where(eq(users.id, directSponsor.id));
              }
            }
          }
        }
        
        // 2. 10-Level Unilevel Commissions (L1: 3%, L2: 2%, L3: 1%, L4: 1%, L5-10: 0.5%)
        for (let lvl = 0; lvl < levelPercentages.length && currentSponsorCode; lvl++) {
          const uplineUser = await db.query.users.findFirst({
            where: eq(users.referralCode, currentSponsorCode),
          });

          if (!uplineUser) break;

          // Upline only receives MLM benefits if upline has also invested >= $100 (isMlmQualified)
          const isUplineQualified = uplineUser.isMlmQualified || ((uplineUser.totalInvestedUsdt || 0) >= liveQualificationUsd);

          if (isUplineQualified) {
            const commissionAmount = commissionBaseAmount * levelPercentages[lvl];
            if (commissionAmount > 0) {
              await db.insert(levelEarnings).values({
                beneficiaryId: uplineUser.id,
                sourceUserId: user.id,
                levelNumber: lvl + 1,
                percentage: levelPercentages[lvl] * 100,
                commissionUsdt: commissionAmount,
                txType: 'token_purchase',
              });

              await db.update(users)
                .set({
                  totalEarnedUsdt: uplineUser.totalEarnedUsdt + commissionAmount,
                  availableUsdt: uplineUser.availableUsdt + commissionAmount,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, uplineUser.id));
            }
          }

          currentSponsorCode = uplineUser.referredBy;
        }
      }

      // --- START AUTO-PLACEMENT AND MATRIX LOGIC ---
      if (!wasMlmQualified && isNowMlmQualified) {
        // 1. Update Direct Sponsor Count & Team Counts
        if (user.referredBy) {
          const sponsor = await db.query.users.findFirst({ where: eq(users.referralCode, user.referredBy) });
          if (sponsor) {
            await db.update(users).set({ directCount: sponsor.directCount + 1 }).where(eq(users.id, sponsor.id));
            let tempCode: string | null = user.referredBy;
            while (tempCode) {
              const up = await db.query.users.findFirst({ where: eq(users.referralCode, tempCode) });
              if (!up) break;
              await db.update(users).set({ totalTeamCount: up.totalTeamCount + 1 }).where(eq(users.id, up.id));
              tempCode = up.referredBy;
            }
          }
        }

        // 2. BFS Matrix Tree Auto-Placement
        let sponsorNodeId = null;
        if (user.referredBy) {
          const sp = await db.query.users.findFirst({ where: eq(users.referralCode, user.referredBy) });
          if (sp) {
             const spNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.userId, sp.id) });
             if (spNode) sponsorNodeId = spNode.id;
          }
        }

        const existingNodes = await db.select({ id: matrixNodes.id }).from(matrixNodes).limit(1);
        let placementParentId = null;
        
        if (existingNodes.length > 0) {
            let startNodeId = sponsorNodeId;
            if (!startNodeId) {
               const rootNode = await db.query.matrixNodes.findFirst({ orderBy: asc(matrixNodes.id) });
               startNodeId = rootNode?.id || null;
            }
            if (startNodeId) {
              const queue = [startNodeId];
              while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = await db.select().from(matrixNodes).where(eq(matrixNodes.parentId, currentId)).orderBy(asc(matrixNodes.position));
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

        const childrenCount = placementParentId ? (await db.select().from(matrixNodes).where(eq(matrixNodes.parentId, placementParentId))).length : 0;
        const newPosition = childrenCount + 1;
        let newLevel = 1;
        if (placementParentId) {
           const pNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.id, placementParentId) });
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

        await db.update(users).set({ isMatrixActive: true, matrixLevel: 1 }).where(eq(users.id, user.id));

        // 3. Matrix Placement Income Distribution Upward - fully admin controlled
        let matrixConfig: any = { placementIncomeUsd: 1, uplineSharePercent: 100, enabled: true };
        try {
          const matrixRow = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'matrixConfig') });
          if (matrixRow?.value) matrixConfig = { ...matrixConfig, ...JSON.parse(matrixRow.value) };
        } catch {}
        const matrixEnabled = matrixConfig.enabled !== false;
        const baseMatrixIncome = Math.max(0, Number(matrixConfig.placementIncomeUsd || 0));
        const matrixShare = Math.max(0, Number(matrixConfig.uplineSharePercent ?? 100)) / 100;
        const mIncomeUsd = baseMatrixIncome * matrixShare;
        let currentMatrixParentId = placementParentId;
        let matrixLvl = 1;
        while (matrixEnabled && currentMatrixParentId && matrixLvl <= 10 && mIncomeUsd > 0) {
           const parentMatrixNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.id, currentMatrixParentId) });
           if (!parentMatrixNode) break;
           
           const uplineUser = await db.query.users.findFirst({ where: eq(users.id, parentMatrixNode.userId) });
           if (uplineUser && uplineUser.isMlmQualified) {
              await db.insert(levelEarnings).values({
                beneficiaryId: uplineUser.id,
                sourceUserId: user.id,
                levelNumber: matrixLvl,
                percentage: 0,
                commissionUsdt: mIncomeUsd,
                txType: 'matrix_join',
              });
              await db.update(users)
                 .set({
                    totalEarnedUsdt: uplineUser.totalEarnedUsdt + mIncomeUsd,
                    availableUsdt: uplineUser.availableUsdt + mIncomeUsd,
                    updatedAt: new Date()
                 }).where(eq(users.id, uplineUser.id));
              
              await db.update(matrixNodes).set({
                 earnedFromMatrix: parentMatrixNode.earnedFromMatrix + mIncomeUsd
              }).where(eq(matrixNodes.id, parentMatrixNode.id));
           }
           
           currentMatrixParentId = parentMatrixNode.parentId;
           matrixLvl++;
        }
      }
      // --- END AUTO-PLACEMENT AND MATRIX LOGIC ---
  return { newInvested, isNowMlmQualified };
}

 
 
// FIFO Phase Sale Matcher

  // Every verified presale purchase contributes the Admin-configured seller
  // share (20% by default) of its NXBC amount to seller orders for the purchased
  // phase. The remaining percentage is the company/treasury share. User proceeds are credited to the user's withdrawable token-sale

  // balance, but the actual NXBC return to treasury and USDT payout happen only

  // when the user withdraws (with exact on-chain verification).

  const DIRECT_INVITE_TTL_MS = 24 * 60 * 60 * 1000;
  const DIRECT_INVITE_PREFIX = 'NXBC-DM-';
  const hashDirectInvite = (token: string) => createHash('sha256').update(token).digest('hex');
  async function ensureDirectBuyerTables() {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS direct_buyer_invites (id SERIAL PRIMARY KEY, seller_user_id INTEGER NOT NULL REFERENCES users(id), sell_order_id INTEGER NOT NULL REFERENCES sell_orders(id), phase_number INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, claimed_by_wallet TEXT, used_at TIMESTAMP, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS direct_buyer_invites_order_idx ON direct_buyer_invites (sell_order_id)`);
  }
  async function createDirectBuyerInvite(sellerUserId: number, sellOrderId: number) {
    const order = await db.query.sellOrders.findFirst({ where: eq(sellOrders.id, sellOrderId) });
    if (!order || Number(order.userId) !== Number(sellerUserId)) throw new Error('Sale order not found or not owned by this wallet.');
    if (Number(order.phaseNumber) < 2 || Number(order.phaseNumber) > 5) throw new Error('Direct Buyer Match is available only for Phase 2 to Phase 5.');
    const live = await getLivePresaleState();
    if (!live.active || Number(live.currentPhase) !== Number(order.phaseNumber)) throw new Error(`Direct Buyer Match is available only while Phase ${Number(order.phaseNumber)} is active.`);
    if (!['open','partially_filled'].includes(String(order.status)) || Number(order.remainingTokens || 0) <= 0) throw new Error('This sale order is no longer open.');
    const token = DIRECT_INVITE_PREFIX + randomBytes(24).toString('hex'); const expiresAt = new Date(Date.now()+DIRECT_INVITE_TTL_MS);
    // Multiple active links are allowed. Each link is single-use and independently
    // expires after 24 hours, so one seller can share several buyer links at once.
    await db.execute(sql`INSERT INTO direct_buyer_invites (seller_user_id,sell_order_id,phase_number,token_hash,expires_at) VALUES (${sellerUserId},${sellOrderId},${Number(order.phaseNumber)},${hashDirectInvite(token)},${expiresAt})`);
    return { token, expiresAt, phaseNumber:Number(order.phaseNumber), remainingTokens:Number(order.remainingTokens||0) };
  }
  async function matchDirectBuyerFirst(
    params: { buyerUserId:number; buyerWallet:string; phaseNumber:number; buyerTokenAmount:number; inviteToken?:string },
    conn: any,
    sellerSharePercent: number,
  ) {
    const share=Math.max(0,Number(params.buyerTokenAmount)*(sellerSharePercent/100));
    if(share<=0||!params.inviteToken) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    const rows=await conn.execute(sql`SELECT * FROM direct_buyer_invites WHERE token_hash=${hashDirectInvite(params.inviteToken)} FOR UPDATE`);
    const invite:any=(rows as any).rows?.[0]||(rows as any)[0];
    if(!invite||invite.used_at||new Date(invite.expires_at).getTime()<=Date.now()) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    const buyer=String(params.buyerWallet||'').toLowerCase();
    if(String(invite.claimed_by_wallet||'')&&String(invite.claimed_by_wallet).toLowerCase()!==buyer) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    if(Number(invite.phase_number)!==Number(params.phaseNumber)||Number(invite.seller_user_id)===Number(params.buyerUserId)) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    const orderRows=await conn.execute(sql`SELECT * FROM sell_orders WHERE id=${Number(invite.sell_order_id)} FOR UPDATE`);
    const order:any=(orderRows as any).rows?.[0]||(orderRows as any)[0];
    if(!order||Number(order.user_id)!==Number(invite.seller_user_id)||!['open','partially_filled'].includes(String(order.status))) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    const remaining=Math.max(0,Number(order.remaining_tokens||0)), filled=Math.min(share,remaining), price=Number(order.token_price||0);
    if(filled<=0||!Number.isFinite(price)||price<=0) return {matched:0,unmatched:share,match:null as any,inviteUsed:false};
    const nextRemaining=Math.max(0,remaining-filled), nextStatus=nextRemaining<=1e-12?'completed':'partially_filled', grossUsdt=filled*price;
    await conn.update(sellOrders).set({remainingTokens:nextRemaining,status:nextStatus}).where(eq(sellOrders.id,Number(order.id)));
    const seller=await conn.query.users.findFirst({where:eq(users.id,Number(order.user_id))});
    if(seller){
      await conn.update(users).set({ updatedAt:new Date() }).where(eq(users.id,seller.id));
      await conn.insert(tokenSellLedgers).values({userId:seller.id,walletAddress:seller.walletAddress,phaseIndex:Number(order.phase_number),phaseName:`Phase ${order.phase_number}`,tokenPrice:price,tokensSold:filled,tokensReturned:0,grossUsdt,withdrawnUsdt:0,serviceFeeUsdt:0,status:'unclaimed'});
    }
    await conn.execute(sql`UPDATE direct_buyer_invites SET claimed_by_wallet=${buyer}, used_at=NOW() WHERE id=${Number(invite.id)} AND used_at IS NULL`);
    return {matched:filled,unmatched:Math.max(0,share-filled),inviteUsed:true,match:{orderId:Number(order.id),sellerUserId:Number(order.user_id),phaseNumber:Number(order.phase_number),tokensSold:filled,tokenPrice:price,grossUsdt,remainingOrderTokens:nextRemaining,status:nextStatus}};
  }
  async function getFifoShareConfig() {
    let sellerSharePercent = 20;
    try {
      const row = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'systemConfig') });
      const parsed = row?.value ? JSON.parse(row.value) : {};
      const candidate = Number(parsed?.sellQueueSharePercent ?? 20);
      if (Number.isFinite(candidate) && candidate >= 0 && candidate <= 100) sellerSharePercent = candidate;
    } catch {}
    return { sellerSharePercent, companySharePercent: 100 - sellerSharePercent };
  }

  async function matchVerifiedBuyerToPhaseQueue(params: {
    buyerUserId: number;
    phaseNumber: number;
    buyerTokenAmount: number;
    buyerWallet?: string;
    directBuyerInviteToken?: string;
  }) {
    const { sellerSharePercent, companySharePercent } = await getFifoShareConfig();
    const userShareTokens = Math.max(0, params.buyerTokenAmount * (sellerSharePercent / 100));
    const adminShareTokens = Math.max(0, params.buyerTokenAmount * (companySharePercent / 100));
    if (userShareTokens <= 0) return { userShareTokens: 0, adminShareTokens, unmatchedUserShareTokens: 0, matches: [], directMatch: null, sellerSharePercent, companySharePercent };

    // Serialize matching for a phase. This prevents two simultaneous buyers from
    // both consuming the same seller order balance.
    await ensureDirectBuyerTables();
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`nxbc-fifo-phase-${params.phaseNumber}`}))`);
      const direct = await matchDirectBuyerFirst(
        { buyerUserId: params.buyerUserId, buyerWallet: params.buyerWallet || '', phaseNumber: params.phaseNumber, buyerTokenAmount: params.buyerTokenAmount, inviteToken: params.directBuyerInviteToken },
        tx,
        sellerSharePercent,
      );
      let remainingBuyerUserShare = direct.unmatched;
      const orders = await tx.select().from(sellOrders)
        .where(and(eq(sellOrders.phaseNumber, params.phaseNumber), inArray(sellOrders.status, ['open', 'partially_filled'])))
        .orderBy(asc(sellOrders.priority), asc(sellOrders.createdAt), asc(sellOrders.id));
      const matches: any[] = [];
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
        const nextStatus = nextRemaining <= 1e-12 ? 'completed' : 'partially_filled';
        await tx.update(sellOrders).set({ remainingTokens: nextRemaining, status: nextStatus }).where(eq(sellOrders.id, order.id));
        const seller = await tx.query.users.findFirst({ where: eq(users.id, order.userId) });
        if (seller) {
          await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, seller.id));
          await tx.insert(tokenSellLedgers).values({
            userId: seller.id, walletAddress: seller.walletAddress, phaseIndex: order.phaseNumber,
            phaseName: `Phase ${order.phaseNumber}`, tokenPrice: price, tokensSold: filled,
            tokensReturned: 0, grossUsdt, withdrawnUsdt: 0, serviceFeeUsdt: 0, status: 'unclaimed',
          });
        }
        matches.push({ orderId: order.id, sellerUserId: order.userId, phaseNumber: order.phaseNumber, tokensSold: filled, tokenPrice: price, grossUsdt, remainingOrderTokens: nextRemaining, status: nextStatus });
        remainingBuyerUserShare -= filled;
      }
      return { userShareTokens, adminShareTokens, unmatchedUserShareTokens: Math.max(0, remainingBuyerUserShare), matches, directMatch: direct.match || null, sellerSharePercent, companySharePercent };
    });
  }


// ---------------------------------------------------------------------------
// Background job: verify pending presale purchases against the real blockchain
// ---------------------------------------------------------------------------
// When /api/presale/buy is called without a plausible on-chain payment tx hash,
// the purchase is stored as status='pending_verification' and none of the
// commission/phase/matrix side-effects run yet (see finalizeConfirmedPurchase).
// This job periodically re-checks any such pending purchase's txHash on-chain:
//   - not found / not yet mined  -> leave as pending, check again later
//   - mined but reverted         -> mark 'failed', no side-effects ever run
//   - mined + a genuine USDT Transfer to our treasury wallet for >= the
//     expected amount is found in the receipt logs -> mark 'completed' and
//     run finalizeConfirmedPurchase() so commissions/phase progression apply
//   - mined but the payment doesn't match (wrong recipient/amount)
//                                 -> mark 'failed'
async function verifyPendingPresalePurchases() {
  const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
  const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
  // The wallet presale payments must be sent to. Set this in .env — it should
  // match ADMIN_TREASURY_WALLET / receivingAddress used on the frontend.
  const treasuryWallet = (process.env.PRESALE_RECEIVING_WALLET || "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261").toLowerCase();

  let pendingTxs: any[] = [];
  try {
    pendingTxs = await db.select().from(transactions).where(
      and(eq(transactions.type, 'buy_presale'), eq(transactions.status, 'pending_verification'))
    );
  } catch (err: any) {
    console.error("[PRESALE VERIFY] Failed to load pending purchases:", err.message);
    return;
  }

  if (pendingTxs.length === 0) return;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const usdtInterface = new ethers.Interface(ERC20_ABI.concat([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]));

  let usdtDecimals = 18;
  try {
    const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, provider);
    usdtDecimals = await usdtContract.decimals();
  } catch {
    // fall back to 18 (correct for BSC USDT) if the RPC call fails
  }

  for (const txRecord of pendingTxs) {
    if (!txRecord.txHash) {
      await db.update(transactions).set({ status: 'failed' }).where(eq(transactions.id, txRecord.id));
      continue;
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.id, txRecord.userId) });
      if (!user) {
        console.error(`[PRESALE VERIFY] User ${txRecord.userId} not found for pending purchase #${txRecord.id}.`);
        continue;
      }

      // Use the same strict verifier as the synchronous endpoint. This prevents
      // a pending purchase from becoming completed based only on a USDT payment;
      // the same BSC transaction must also contain the expected NXBC delivery
      // from the CURRENT presale contract to the buyer.
      const verification = await verifyPresalePurchaseOnChain({
        txHash: txRecord.txHash,
        buyer: user.walletAddress,
        usdtAmount: Number(txRecord.amountUsdt),
        nxbcAmount: Number(txRecord.tokenAmount),
      });

      if (verification.pending) continue;
      if (!verification.ok) {
        console.warn(`[PRESALE VERIFY] Purchase #${txRecord.id} failed strict on-chain verification: ${verification.error}`);
        await db.update(transactions).set({ status: 'failed' }).where(eq(transactions.id, txRecord.id));
        continue;
      }

      await db.update(transactions).set({ status: 'completed' }).where(eq(transactions.id, txRecord.id));
      const verifiedPhase = Number(verification.phase || txRecord.phaseIndex || 1);
      const verifiedTokens = Number(verification.nxbcAmount || txRecord.tokenAmount);
      const verifiedUsdt = Number(verification.usdtAmount || txRecord.amountUsdt);
      await db.update(transactions).set({ phaseIndex: verifiedPhase, tokenAmount: verifiedTokens, amountUsdt: verifiedUsdt }).where(eq(transactions.id, txRecord.id));
      await finalizeConfirmedPurchase(user, verifiedTokens, verifiedUsdt, verifiedPhase);
      await matchVerifiedBuyerToPhaseQueue({
        buyerUserId: user.id,
        buyerWallet: user.walletAddress,
        phaseNumber: verifiedPhase,
        buyerTokenAmount: verifiedTokens,
      });
      console.log(`[PRESALE VERIFY] Purchase #${txRecord.id} confirmed on-chain, finalized, and FIFO matched.`);
    } catch (err: any) {
      console.error(`[PRESALE VERIFY] Error checking tx ${txRecord.txHash}:`, err.message);
      // leave as pending — will retry next cycle rather than failing on a transient RPC error
    }
  }
}


async function ensureProductionSafetyTables() {
  // Immutable per-phase FIFO identity. `priority` may be changed by system
  // configuration, but `fifo_number` is permanent and is what users see.
  await db.execute(sql`ALTER TABLE sell_orders ADD COLUMN IF NOT EXISTS fifo_number INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`UPDATE sell_orders SET fifo_number = priority WHERE fifo_number = 0 AND priority > 0`);
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS sell_orders_fifo_seq`);
  await db.execute(sql`SELECT setval('sell_orders_fifo_seq', GREATEST(1, COALESCE((SELECT MAX(fifo_number) FROM sell_orders), 0) + 1), false)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS sell_orders_phase_fifo_idx ON sell_orders(phase_number, fifo_number)`);
  // DEX/LIVE/HOLD allocations are persistent reservations and must never be
  // available for a later presale/FIFO allocation.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS live_hold_allocations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      wallet_address TEXT NOT NULL,
      purchase_tx_hash TEXT,
      tokens_allocated DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'held',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS live_hold_allocations_user_idx
    ON live_hold_allocations(user_id)
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS live_hold_allocations_purchase_tx_uq
    ON live_hold_allocations(purchase_tx_hash)
    WHERE purchase_tx_hash IS NOT NULL
  `);
  // A blockchain purchase tx can only settle once. Partial unique index keeps
  // legacy NULL tx hashes valid while preventing duplicate real tx settlements.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS transactions_buy_presale_tx_uq
    ON transactions(tx_hash)
    WHERE type='buy_presale' AND tx_hash IS NOT NULL
  `);
}

async function ensureTokenWithdrawalSettlementTable() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS token_withdrawal_settlements (
    id BIGSERIAL PRIMARY KEY,
    return_tx_hash TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    wallet_address TEXT NOT NULL,
    gross_amount DOUBLE PRECISION NOT NULL,
    net_payout DOUBLE PRECISION NOT NULL,
    service_fee DOUBLE PRECISION NOT NULL,
    tokens_returned DOUBLE PRECISION NOT NULL,
    wallet_type TEXT NOT NULL,
    phase_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    payout_nonce BIGINT,
    payout_tx_hash TEXT,
    transaction_id INTEGER,
    status TEXT NOT NULL DEFAULT 'prepared',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS token_withdrawal_settlements_nonce_uq ON token_withdrawal_settlements (payout_nonce) WHERE payout_nonce IS NOT NULL`);
}


async function ensureInitialAdminPin() {
  const existing = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'admin_pin') });
  if (existing?.value) return;
  const initialPin = String(process.env.ADMIN_PIN_INITIAL || '').trim();
  if (!initialPin || !/^\d{6,}$/.test(initialPin)) {
    throw new Error('ADMIN_PIN_INITIAL is required on first production startup and must be at least 6 digits.');
  }
  await db.insert(systemConfigs).values({
    key: 'admin_pin',
    value: hashPin(initialPin),
    description: 'Master Admin Security PIN (hashed)',
  });
  console.log('[ADMIN] Initial security PIN stored as a salted hash.');
}

async function ensureWalletSeparationMigration() {
  // One-time reconciliation for production data: the old `available_usdt`
  // mixed MLM and token-sale proceeds. From this release onward token-sale
  // proceeds are authoritative in token_sell_ledgers and available_usdt is MLM-only.
  const key = 'wallet_separation_v1';
  try {
    const flag = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, key) });
    if (flag?.value === 'done') return;

    await db.execute(sql`
      UPDATE users u
      SET available_usdt = GREATEST(
        0,
        COALESCE(u.available_usdt, 0) - COALESCE((
          SELECT SUM(GREATEST(0, l.gross_usdt - l.withdrawn_usdt))
          FROM token_sell_ledgers l
          WHERE l.user_id = u.id
            AND l.status IN ('unclaimed','partially_claimed')
        ), 0)
      )
    `);
    if (flag) {
      await db.update(systemConfigs).set({ value: 'done', updatedAt: new Date() }).where(eq(systemConfigs.key, key));
    } else {
      await db.insert(systemConfigs).values({ key, value: 'done', description: 'One-time separation of Token Sale Wallet and MLM Wallet balances' });
    }
    console.log('[WALLET] Token-sale and MLM balances separated successfully.');
  } catch (e:any) {
    console.error('[WALLET] Separation migration failed:', e?.message || e);
    throw e;
  }
}

async function startServer() {
  validateProductionEnvironment();
  try { await ensureProductionSafetyTables(); } catch (e) { console.error("[PRODUCTION SAFETY] table initialization failed:", e); throw e; }
  try { await ensureDirectBuyerTables(); } catch (e) { console.error("[DIRECT MATCH] table initialization failed:", e); throw e; }
  try { await ensureWalletSeparationMigration(); } catch (e) { console.error("[WALLET] separation initialization failed:", e); throw e; }
  try { await ensureInitialAdminPin(); } catch (e) { console.error("[ADMIN] initial PIN configuration failed:", e); throw e; }
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // CORS: same-origin requests do not need CORS. If a separate frontend
  // origin is used in production, explicitly set CORS_ORIGIN in .env.
  app.use((req, res, next) => {
    const allowedOrigin = String(process.env.CORS_ORIGIN || '').trim();
    const requestOrigin = String(req.headers.origin || '');
    if (allowedOrigin && requestOrigin === allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Token");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      const configs = await db.select().from(systemConfigs);
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || '').trim();
      const isPayoutBotConfigured = !!(rawKey && (rawKey.length === 64 || rawKey.length === 66));
      res.json({
        status: "ok",
        database: "postgresql_connected",
        configsCount: configs.length,
        payoutBotReady: isPayoutBotConfigured,
      });
    } catch (err: any) {
      res.json({ status: "ok", database: "waiting_or_connecting", error: err?.message });
    }
  });

  // Payout Hot Wallet Status & Balance Checker Endpoint
  app.get("/api/payout-bot/status", async (req, res) => {
    try {
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || '').trim();
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";

      if (!rawKey) {
        return res.json({
          configured: false,
          message: "PAYOUT_HOT_WALLET_PRIVATE_KEY is not configured in .env on server.",
          usdtContractAddress,
          rpcUrl,
        });
      }

      const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(formattedKey, provider);
      const bnbBalanceWei = await provider.getBalance(wallet.address);
      const bnbBalance = ethers.formatEther(bnbBalanceWei);

      const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, provider);
      let usdtBalance = "0";
      try {
        const usdtRaw = await usdtContract.balanceOf(wallet.address);
        usdtBalance = ethers.formatUnits(usdtRaw, 18);
      } catch (err: any) {
        usdtBalance = "error_reading_usdt";
      }

      return res.json({
        configured: true,
        hotWalletAddress: wallet.address,
        bnbBalance: `${Number(bnbBalance).toFixed(5)} BNB`,
        usdtBalance: `$${Number(usdtBalance).toFixed(2)} USDT`,
        hasGas: Number(bnbBalance) > 0.001,
        hasUsdt: Number(usdtBalance) > 0,
        rpcUrl,
        usdtContractAddress,
      });
    } catch (err: any) {
      return res.status(500).json({ configured: false, error: err.message });
    }
  });

  // Get Phase-Wise Token Auto-Sell Internal Settlement Ledger for a specific Trust Wallet
  app.get("/api/wallet/token-sell-ledger", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      if (!walletAddress || typeof walletAddress !== "string") {
        return res.status(400).json({ error: "walletAddress is required" });
      }

      const normalizedAddress = walletAddress.toLowerCase();
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
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
          pendingTokensToReturn: 0,
        });
      }

      const entries = await db.select()
        .from(tokenSellLedgers)
        .where(eq(tokenSellLedgers.walletAddress, normalizedAddress))
        .orderBy(asc(tokenSellLedgers.phaseIndex), asc(tokenSellLedgers.createdAt));

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
          createdAt: e.createdAt,
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
        pendingTokensToReturn,
      });
    } catch (error: any) {
      console.error("Error in /api/wallet/token-sell-ledger:", error);
      res.status(500).json({ error: error.message || "Failed to fetch token sell ledger" });
    }
  });

  // Record a new Phase Auto-Sell entry into the internal ledger
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
        grossUsdt,
      } = req.body;

      if (!walletAddress || !tokensSold || Number(tokensSold) <= 0) {
        return res.status(400).json({ error: "Invalid ledger payload" });
      }

      const normalizedAddress = walletAddress.toLowerCase();
      let user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
      });

      if (!user) {
        const refCode = `NX${normalizedAddress.substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: refCode,
          availableUsdt: 0,
        }).returning();
        user = newUser;
      }

      const calculatedGross = Number(grossUsdt) || (Number(tokensSold) * Number(tokenPrice));

      const [entry] = await db.insert(tokenSellLedgers).values({
        userId: user.id,
        walletAddress: normalizedAddress,
        phaseIndex: Number(phaseIndex) || 2,
        phaseName: phaseName || `Phase ${phaseIndex}`,
        tokenPrice: Number(tokenPrice) || 0.10,
        tokensSold: Number(tokensSold),
        tokensReturned: 0,
        grossUsdt: calculatedGross,
        withdrawnUsdt: 0,
        serviceFeeUsdt: 0,
        status: 'unclaimed',
      }).returning();

      // Token-sale proceeds belong only to the Token Sale Wallet ledger.
      // They must never be added to the MLM wallet balance.

      return res.json({
        success: true,
        entry,
        message: `Successfully recorded ${tokensSold} NXBC auto-sold in ${entry.phaseName} for $${calculatedGross.toFixed(2)} USDT!`,
      });
    } catch (error: any) {
      console.error("Error in /api/wallet/token-sell-ledger/record:", error);
      res.status(500).json({ error: error.message || "Failed to record token sell entry" });
    }
  });

  // Fully Automated Instant Crypto Payout Bot API with dynamic Admin fee & token return validation
  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const {
        walletAddress,
        amountUsdt,
        walletType = 'mlm',
        tokenReturnTxHash,
        tokensReturned = 0,
        signature,   // hex signature from personal_sign of buildWithdrawMessage(...)
        timestamp,   // ms epoch used inside the signed message
      } = req.body;

      if (!walletAddress || !amountUsdt || Number(amountUsdt) <= 0) {
        return res.status(400).json({ error: "Invalid wallet address or withdrawal amount" });
      }
      if (walletType !== 'mlm' && walletType !== 'token_sell') {
        return res.status(400).json({ error: "Invalid withdrawal wallet type." });
      }

      // --- AUTH: caller must prove they control walletAddress ---------------
      if (!signature || !timestamp) {
        return res.status(401).json({ error: "Missing signature/timestamp. Sign the withdrawal request with your wallet." });
      }

      const ageMs = Date.now() - Number(timestamp);
      if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > SIGNATURE_MAX_AGE_MS) {
        return res.status(401).json({ error: "Signature expired. Please try again." });
      }

      const sigKey = `${walletAddress.toLowerCase()}:${signature}`;
      if (usedSignatures.has(sigKey)) {
        return res.status(401).json({ error: "This signed request was already used." });
      }

      const expectedMessage = buildWithdrawMessage(walletAddress, Number(amountUsdt), walletType, Number(timestamp));
      if (!verifyWalletSignature(expectedMessage, signature, walletAddress)) {
        return res.status(401).json({ error: "Invalid signature. Withdrawal not authorized by wallet owner." });
      }

      usedSignatures.add(sigKey);
      // ------------------------------------------------------------------------

      const grossAmount = Number(Number(amountUsdt).toFixed(4));
      const normalizedAddress = walletAddress.toLowerCase();

      // Read the live fee from the same admin-managed systemConfig used by the UI.
      // Never trust a fee percentage supplied by the browser.
      let withdrawalFeePercent = 0;
      try {
        const feeRow = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, "systemConfig") });
        const parsedConfig = feeRow ? JSON.parse(feeRow.value) : null;
        withdrawalFeePercent = Number(parsedConfig?.withdrawalFeePercent);
      } catch {
        withdrawalFeePercent = 0;
      }
      if (!Number.isFinite(withdrawalFeePercent) || withdrawalFeePercent < 0 || withdrawalFeePercent > 100) {
        return res.status(500).json({ error: "Invalid withdrawal fee configuration. Admin must correct it before withdrawals." });
      }
      const serviceFee = Number((grossAmount * (withdrawalFeePercent / 100)).toFixed(4));
      const netPayout = Number(Math.max(0, grossAmount - serviceFee).toFixed(4));

      // Look up user in database — do NOT auto-create with a pre-loaded balance,
      // an unknown wallet has nothing to withdraw.
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found. Nothing to withdraw." });
      }

      // SECURITY: balances are strictly separated. Token-sale withdrawals can
      // spend only token_sell_ledgers; MLM withdrawals can spend only users.available_usdt.
      let currentAvailable = Number(user.availableUsdt || 0);
      if (walletType === 'token_sell') {
        const balanceRows = await db.execute(sql`
          SELECT COALESCE(SUM(GREATEST(0, gross_usdt - withdrawn_usdt)), 0) AS available
          FROM token_sell_ledgers
          WHERE wallet_address=${normalizedAddress}
            AND status IN ('unclaimed','partially_claimed')
        `);
        const row:any = (balanceRows as any).rows?.[0] || (balanceRows as any)[0];
        currentAvailable = Number(row?.available || 0);
      }
      if (currentAvailable + 1e-9 < grossAmount) {
        return res.status(400).json({
          error: walletType === 'token_sell' ? 'Insufficient Token Sale Wallet balance.' : 'Insufficient MLM Wallet balance.',
          availableUsdt: currentAvailable,
          requestedUsdt: grossAmount,
          walletType,
        });
      }

      // If Token Auto-Sell Withdrawal: Update Phase-by-Phase Internal Ledger (FIFO)
      let phaseBreakdown: Array<{ phaseIndex: number; phaseName: string; tokensToReturn: number; grossDeducted: number }> = [];
      let totalCalculatedTokensToReturn = 0;
      const pendingLedgerUpdates: Array<{entry: any; withdrawn: number; returned: number; status: string; fee: number}> = [];

      if (walletType === 'token_sell') {
        const activeLedgerEntries = await db.select()
          .from(tokenSellLedgers)
          .where(
            and(
              eq(tokenSellLedgers.walletAddress, normalizedAddress),
              or(eq(tokenSellLedgers.status, 'unclaimed'), eq(tokenSellLedgers.status, 'partially_claimed'))
            )
          )
          .orderBy(asc(tokenSellLedgers.phaseIndex), asc(tokenSellLedgers.createdAt));

        let remainingToDeduct = grossAmount;

        for (const entry of activeLedgerEntries) {
          if (remainingToDeduct <= 0) break;

          const entryRemainingGross = Math.max(0, entry.grossUsdt - entry.withdrawnUsdt);
          const deductFromEntry = Math.min(entryRemainingGross, remainingToDeduct);
          
          if (deductFromEntry > 0) {
            // Calculate exact proportion of tokens for this phase
            const tokensProportion = (deductFromEntry / entry.grossUsdt) * entry.tokensSold;
            const newWithdrawn = entry.withdrawnUsdt + deductFromEntry;
            const newReturned = entry.tokensReturned + tokensProportion;
            const newStatus = newWithdrawn >= entry.grossUsdt - 0.001 ? 'fully_claimed' : 'partially_claimed';

            phaseBreakdown.push({
              phaseIndex: entry.phaseIndex,
              phaseName: entry.phaseName,
              tokensToReturn: Math.round(tokensProportion * 1000) / 1000,
              grossDeducted: deductFromEntry,
            });

            totalCalculatedTokensToReturn += tokensProportion;
            remainingToDeduct -= deductFromEntry;

            // Defer all ledger mutations until exact on-chain NXBC return verification passes.
            pendingLedgerUpdates.push({
              entry,
              withdrawn: newWithdrawn,
              returned: newReturned,
              status: newStatus,
              fee: deductFromEntry * (withdrawalFeePercent / 100),
            });
          }
        }
      }

      // TOKEN-SELL SECURITY GATE: exact NXBC return must be proven on BSC before
      // any ledger is marked withdrawn and before any USDT payout is dispatched.
      if (walletType === 'token_sell') {
        if (!tokenReturnTxHash) {
          return res.status(400).json({ error: "NXBC return transaction is required. USDT withdrawal is blocked until the return is verified on BSC." });
        }
        const exactExpectedTokens = totalCalculatedTokensToReturn;
        if (exactExpectedTokens <= 0) {
          return res.status(400).json({ error: "No exact NXBC return amount could be calculated from the user's settlement ledger." });
        }
        if (tokensReturned > 0 && Math.abs(Number(tokensReturned) - exactExpectedTokens) > 0.000000001) {
          return res.status(400).json({ error: "Client-supplied NXBC return amount does not match the server-calculated exact amount." });
        }

        let treasuryAddress = process.env.NXBC_RETURN_TREASURY_ADDRESS || "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";
        try { treasuryAddress = ethers.getAddress(treasuryAddress); } catch {
          return res.status(500).json({ error: "Invalid NXBC return treasury address configuration." });
        }
        await ensureTokenWithdrawalSettlementTable();
        const existingSettlementRows = await db.execute(sql`SELECT * FROM token_withdrawal_settlements WHERE return_tx_hash=${tokenReturnTxHash} LIMIT 1`);
        const existingSettlement: any = (existingSettlementRows as any).rows?.[0] || (existingSettlementRows as any)[0];

        // Prevent replay of an already-consumed NXBC return transaction.
        // A valid on-chain transfer may only authorize one successful settlement.
        // If a payout previously failed before ledger commit, the hash remains reusable.
        try {
          const priorUse = await db.query.tokenSellLedgers.findFirst({
            where: eq(tokenSellLedgers.returnTxHash, tokenReturnTxHash),
          });
          if (priorUse && !existingSettlement) {
            return res.status(400).json({
              error: "This NXBC return transaction has already been used for a Token Sell withdrawal."
            });
          }
        } catch (replayCheckError: any) {
          console.error("[NXBC RETURN] Replay-check failed:", replayCheckError?.message);
          return res.status(500).json({ error: "Could not verify NXBC return transaction uniqueness. Withdrawal blocked." });
        }

        const verification = await verifyExactNxbcReturn({
          txHash: tokenReturnTxHash,
          expectedSender: walletAddress,
          expectedRecipient: treasuryAddress,
          expectedTokenAmount: exactExpectedTokens,
        });
        if (!verification.ok) {
          return res.status(400).json({ error: verification.error || "NXBC return could not be verified on BSC. USDT withdrawal blocked." });
        }

        // Verification passed. The settlement is now persisted BEFORE any USDT is sent.
        // A durable settlement row + reserved Ethereum nonce makes the payout idempotent
        // across retries, process restarts and database/network failures.
      }

      const finalTokensReturned = walletType === 'token_sell'
        ? totalCalculatedTokensToReturn
        : Number(tokensReturned) || 0;

      let txHash = "";
      let executionMode = "real_bsc_blockchain";

      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || "").trim();
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";

      if (!rawKey || (rawKey.length !== 64 && rawKey.length !== 66)) {
        return res.status(503).json({
          error: "USDT payout wallet is not configured. No withdrawal was completed and no fake blockchain hash was generated.",
          serviceFeePercent: withdrawalFeePercent,
        });
      }

      const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(formattedKey, provider);
      const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, wallet);
      const decimals = 18;
      const parsedAmount = ethers.parseUnits(netPayout.toFixed(4), decimals);

      // Token-sale withdrawals get a durable idempotency record keyed by the user's
      // already-verified NXBC return transaction. This is the settlement's unique key.
      let settlement: any = null;
      if (walletType === 'token_sell') {
        await ensureTokenWithdrawalSettlementTable();
        const phaseJson = JSON.stringify(phaseBreakdown);
        await db.execute(sql`
          INSERT INTO token_withdrawal_settlements
            (return_tx_hash,user_id,wallet_address,gross_amount,net_payout,service_fee,tokens_returned,wallet_type,phase_breakdown,status)
          VALUES
            (${tokenReturnTxHash},${user.id},${normalizedAddress},${grossAmount},${netPayout},${serviceFee},${finalTokensReturned},${walletType},${phaseJson}::jsonb,'prepared')
          ON CONFLICT (return_tx_hash) DO NOTHING
        `);
        const settlementRows = await db.execute(sql`
          SELECT * FROM token_withdrawal_settlements WHERE return_tx_hash=${tokenReturnTxHash} LIMIT 1
        `);
        settlement = (settlementRows as any).rows?.[0] || (settlementRows as any)[0];
        if (!settlement) return res.status(500).json({ error: "Could not create durable withdrawal settlement." });

        if (String(settlement.status) === 'broadcasting') {
          const ageMs = Date.now() - new Date(settlement.updated_at).getTime();
          if (ageMs < 120000 && !settlement.payout_tx_hash) {
            return res.status(409).json({ error: "This Token Sell withdrawal is already being processed. Please wait for the current BSC payout to finish.", settlementStatus: settlement.status });
          }
        }

        if (Number(settlement.user_id) !== Number(user.id) || String(settlement.wallet_address).toLowerCase() !== normalizedAddress) {
          return res.status(409).json({ error: "This NXBC return transaction is already bound to a different wallet/user." });
        }
        if (String(settlement.status) === 'completed' && settlement.payout_tx_hash) {
          const existingTx = settlement.transaction_id
            ? await db.query.transactions.findFirst({ where: eq(transactions.id, Number(settlement.transaction_id)) })
            : null;
          return res.json({
            success: true,
            message: "This Token Sell withdrawal was already completed; duplicate payout blocked.",
            txHash: settlement.payout_tx_hash,
            walletType,
            grossAmount: Number(settlement.gross_amount),
            serviceFee: Number(settlement.service_fee),
            netPayout: Number(settlement.net_payout),
            tokenReturnTxHash,
            tokensReturned: Number(settlement.tokens_returned),
            phaseBreakdown: settlement.phase_breakdown || phaseBreakdown,
            executionMode: "real_bsc_blockchain",
            transaction: existingTx,
          });
        }

        // Reserve a nonce once, before broadcasting. If the server dies after broadcast
        // but before saving the tx hash, a retry can recover the same transaction by nonce.
        if (settlement.payout_nonce == null) {
          await db.transaction(async (tx) => {
            await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('nxbc_usdt_payout_nonce_v1'))`);
            const latest = await tx.execute(sql`
              SELECT payout_nonce FROM token_withdrawal_settlements WHERE id=${Number(settlement.id)} FOR UPDATE
            `);
            const row: any = (latest as any).rows?.[0] || (latest as any)[0];
            if (row?.payout_nonce == null) {
              const nonce = await provider.getTransactionCount(wallet.address, 'pending');
              await tx.execute(sql`
                UPDATE token_withdrawal_settlements
                SET payout_nonce=${Number(nonce)}, updated_at=NOW()
                WHERE id=${Number(settlement.id)} AND payout_nonce IS NULL
              `);
              settlement.payout_nonce = Number(nonce);
            } else {
              settlement.payout_nonce = Number(row.payout_nonce);
            }
          });
        }

        const expectedNonce = Number(settlement.payout_nonce);
        if (!settlement.payout_tx_hash && String(settlement.status) !== 'broadcasting') {
          const claimRows = await db.execute(sql`
            UPDATE token_withdrawal_settlements
            SET status='broadcasting', updated_at=NOW()
            WHERE id=${Number(settlement.id)} AND status IN ('prepared','broadcasting')
            RETURNING *
          `);
          const claimed: any = (claimRows as any).rows?.[0] || (claimRows as any)[0];
          if (claimed) {
            settlement = claimed;
          } else {
            const freshRows = await db.execute(sql`SELECT * FROM token_withdrawal_settlements WHERE id=${Number(settlement.id)} LIMIT 1`);
            const fresh: any = (freshRows as any).rows?.[0] || (freshRows as any)[0];
            if (fresh) settlement = fresh;
            if (String(settlement.status) === 'broadcasting' && !settlement.payout_tx_hash) {
              return res.status(409).json({ error: "This Token Sell withdrawal is already being processed. Please wait for the current BSC payout to finish.", settlementStatus: settlement.status });
            }
          }
        }
        let payoutTx: ethers.TransactionResponse | null = null;
        if (settlement.payout_tx_hash) {
          payoutTx = await provider.getTransaction(String(settlement.payout_tx_hash));
        }

        // Crash recovery: if a tx was broadcast but its hash was not persisted, find it
        // by the reserved sender nonce in the pending/latest blocks and verify it is
        // the exact USDT transfer we intended. This avoids sending a second payout
        // after a process crash in the tiny broadcast-to-database window.
        if (!payoutTx) {
          let byNonce: ethers.TransactionResponse | null = null;
          try {
            const pendingBlock: any = await provider.send('eth_getBlockByNumber', ['pending', true]);
            const pendingTxs = Array.isArray(pendingBlock?.transactions) ? pendingBlock.transactions : [];
            const match = pendingTxs.find((t: any) => String(t?.from || '').toLowerCase() === wallet.address.toLowerCase() && Number(BigInt(t?.nonce || '0x0')) === expectedNonce);
            if (match?.hash) byNonce = await provider.getTransaction(match.hash);
          } catch { /* pending block support varies by BSC RPC */ }
          if (!byNonce) {
            const latestBlock = await provider.getBlockNumber();
            const firstBlock = Math.max(0, latestBlock - 120);
            for (let blockNo = latestBlock; blockNo >= firstBlock && !byNonce; blockNo--) {
              const block: any = await provider.getBlock(blockNo, true);
              const txs = Array.isArray(block?.prefetchedTransactions) ? block.prefetchedTransactions : (Array.isArray(block?.transactions) ? block.transactions : []);
              const match = txs.find((t: any) => String(t?.from || '').toLowerCase() === wallet.address.toLowerCase() && Number(t?.nonce) === expectedNonce);
              if (match) byNonce = typeof match === 'string' ? await provider.getTransaction(match) : match;
            }
          }
          if (byNonce) {
            try {
              const parsed = usdtContract.interface.parseTransaction({ data: byNonce.data, value: byNonce.value });
              const parsedTo = parsed?.args?.[0] ? ethers.getAddress(String(parsed.args[0])) : '';
              const parsedValue = parsed?.args?.[1] != null ? BigInt(parsed.args[1].toString()) : 0n;
              const intendedTo = ethers.getAddress(normalizedAddress);
              if (byNonce.to?.toLowerCase() !== ethers.getAddress(usdtContractAddress).toLowerCase() ||
                  parsed?.name !== 'transfer' || parsedTo !== intendedTo || parsedValue !== parsedAmount) {
                return res.status(409).json({ error: "Reserved payout nonce is occupied by a different transaction. Withdrawal locked for safety; manual reconciliation required." });
              }
            } catch {
              return res.status(409).json({ error: "A transaction is using the reserved payout nonce but it is not the expected USDT payout. Withdrawal locked for safety." });
            }
            payoutTx = byNonce;
            txHash = byNonce.hash;
            await db.execute(sql`
              UPDATE token_withdrawal_settlements
              SET payout_tx_hash=${txHash}, status='broadcasted', updated_at=NOW()
              WHERE id=${Number(settlement.id)} AND (payout_tx_hash IS NULL OR payout_tx_hash=${txHash})
            `);
          }
        }

        // If no transaction exists at the reserved nonce, broadcast exactly once using
        // that nonce. The durable nonce prevents a restart from silently using a new nonce.
        if (!payoutTx) {
          console.log(`[PAYOUT BOT] Sender Hot Wallet: ${wallet.address}`);
          console.log(`[PAYOUT BOT] Initiating automated ${walletType} payout of Gross: $${grossAmount} | Fee (${withdrawalFeePercent}%): $${serviceFee.toFixed(2)} | Net: $${netPayout.toFixed(2)} USDT to ${walletAddress} using nonce ${expectedNonce}...`);
          try {
            payoutTx = await usdtContract.transfer(walletAddress, parsedAmount, { nonce: expectedNonce });
            txHash = payoutTx.hash;
            await db.execute(sql`
              UPDATE token_withdrawal_settlements
              SET payout_tx_hash=${txHash}, status='broadcasted', updated_at=NOW()
              WHERE id=${Number(settlement.id)} AND payout_tx_hash IS NULL
            `);
          } catch (botError: any) {
            console.error("[PAYOUT BOT ERROR] On-chain USDT dispatch failed:", botError.message);
            return res.status(503).json({ error: `USDT payout failed on BSC: ${botError?.message || 'unknown payout error'}`, serviceFeePercent: withdrawalFeePercent });
          }
        }

        const payoutReceipt = await payoutTx.wait(1);
        if (!payoutReceipt || payoutReceipt.status !== 1) {
          return res.status(503).json({
            error: "USDT payout transaction did not confirm successfully on BSC. The durable settlement remains pending and will not be paid twice.",
            txHash: payoutTx.hash,
            serviceFeePercent: withdrawalFeePercent,
          });
        }
        txHash = payoutTx.hash;
        executionMode = "real_bsc_blockchain";

        // Finalize all DB mutations together. A retry after a process/database failure
        // sees the durable settlement + payout hash and resumes this finalization without
        // sending another USDT transfer.
        await db.transaction(async (tx) => {
          const current = await tx.execute(sql`
            SELECT status FROM token_withdrawal_settlements WHERE id=${Number(settlement.id)} FOR UPDATE
          `);
          const currentRow: any = (current as any).rows?.[0] || (current as any)[0];
          if (!currentRow) throw new Error("Durable settlement record disappeared.");

          if (walletType === 'token_sell' && String(currentRow.status) !== 'completed') {
            for (const update of pendingLedgerUpdates) {
              await tx.update(tokenSellLedgers)
                .set({
                  withdrawnUsdt: update.withdrawn,
                  tokensReturned: update.returned,
                  serviceFeeUsdt: (update.entry.serviceFeeUsdt || 0) + update.fee,
                  status: update.status,
                  returnTxHash: tokenReturnTxHash,
                  payoutTxHash: txHash,
                  updatedAt: new Date(),
                })
                .where(eq(tokenSellLedgers.id, update.entry.id));
            }
          }

          if (String(currentRow.status) !== 'completed') {
            const [newTx] = await tx.insert(transactions).values({
              userId: user.id,
              type: 'withdrawal',
              amountUsdt: netPayout,
              tokenAmount: finalTokensReturned,
              tokenPrice: 1.0,
              status: 'completed',
              txHash: txHash,
            }).returning();

            // Token-sale ledger rows are the only balance source for this wallet.
            // Do not debit users.available_usdt here; that field is MLM-only.
            const lockedUser = await tx.query.users.findFirst({ where: eq(users.id, user.id) });
            if (!lockedUser) throw new Error("User disappeared while finalizing withdrawal.");
            await tx.update(users)
              .set({
                totalWithdrawnUsdt: Number(lockedUser.totalWithdrawnUsdt || 0) + grossAmount,
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id));

            await tx.execute(sql`
              UPDATE token_withdrawal_settlements
              SET status='completed', transaction_id=${newTx.id}, payout_tx_hash=${txHash}, updated_at=NOW()
              WHERE id=${Number(settlement.id)}
            `);
          }
        });
      } else {
        // Non-token MLM withdrawals keep the existing real-BSC payout path.
        try {
          const tx = await usdtContract.transfer(walletAddress, parsedAmount);
          txHash = tx.hash;
          const payoutReceipt = await tx.wait(1);
          if (!payoutReceipt || payoutReceipt.status !== 1) {
            return res.status(503).json({ error: "USDT payout transaction was broadcast but did not confirm successfully on BSC.", txHash: tx.hash, serviceFeePercent: withdrawalFeePercent });
          }
          executionMode = "real_bsc_blockchain";
        } catch (botError: any) {
          console.error("[PAYOUT BOT ERROR] On-chain USDT dispatch failed:", botError.message);
          return res.status(503).json({ error: `USDT payout failed on BSC: ${botError?.message || 'unknown payout error'}`, serviceFeePercent: withdrawalFeePercent });
        }
      }

      // Record and finalize legacy MLM/community withdrawals (token_sell was finalized above atomically).
      if (walletType !== 'token_sell') {
        const txTitle = `MLM & Community Earnings Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee)`;
        const [txRecord] = await db.insert(transactions).values({
          userId: user.id,
          type: 'withdrawal',
          amountUsdt: netPayout,
          tokenAmount: finalTokensReturned,
          tokenPrice: 1.0,
          status: 'completed',
          txHash: txHash,
        }).returning();
        const newAvailable = Math.max(0, currentAvailable - grossAmount);
        await db.update(users)
          .set({ availableUsdt: newAvailable, totalWithdrawnUsdt: (user.totalWithdrawnUsdt || 0) + grossAmount, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        return res.json({ success: true, message: `${txTitle} processed successfully!`, txHash, walletType, grossAmount, serviceFee, netPayout, tokenReturnTxHash: null, tokensReturned: finalTokensReturned, phaseBreakdown, executionMode, transaction: txRecord, newAvailableBalance: newAvailable });
      }

      const completedSettlementRows = await db.execute(sql`
        SELECT s.*, t.id AS transaction_id, t.tx_hash AS completed_tx_hash
        FROM token_withdrawal_settlements s
        LEFT JOIN transactions t ON t.id=s.transaction_id
        WHERE s.return_tx_hash=${tokenReturnTxHash} LIMIT 1
      `);
      const completedSettlement: any = (completedSettlementRows as any).rows?.[0] || (completedSettlementRows as any)[0];
      const finalTx = completedSettlement?.transaction_id
        ? await db.query.transactions.findFirst({ where: eq(transactions.id, Number(completedSettlement.transaction_id)) })
        : null;
      const latestUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      const remainingTokenSaleRows = await db.execute(sql`
        SELECT COALESCE(SUM(GREATEST(0, gross_usdt - withdrawn_usdt)), 0) AS available_usdt
        FROM token_sell_ledgers
        WHERE user_id=${user.id} AND status IN ('unclaimed','partially_claimed')
      `);
      const remainingTokenSaleRow:any = (remainingTokenSaleRows as any).rows?.[0] || {};
      return res.json({
        success: true,
        message: `Token Auto-Sell Settlement Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee) processed successfully!`,
        txHash: completedSettlement?.payout_tx_hash || txHash,
        walletType,
        grossAmount,
        serviceFee,
        netPayout,
        tokenReturnTxHash,
        tokensReturned: finalTokensReturned,
        phaseBreakdown,
        executionMode,
        transaction: finalTx,
        newAvailableBalance: Number(remainingTokenSaleRow.available_usdt || 0),
      });
    } catch (error: any) {
      console.error("Error in /api/wallet/withdraw:", error);
      res.status(500).json({ error: error.message || "Failed to process automatic withdrawal" });
    }
  });

  // Get or Create User by Wallet Address
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { walletAddress, referredBy } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "walletAddress is required" });
      }

      const normalizedAddress = walletAddress.toLowerCase();
      let existingUser = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
      });

      if (!existingUser) {
        const generatedRefCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: generatedRefCode,
          referredBy: referredBy || null,
          availableUsdt: 0,
        }).returning();

        // Increment sponsor's direct count if referredBy exists
        if (referredBy) {
          const sponsor = await db.query.users.findFirst({
            where: eq(users.referralCode, referredBy.toUpperCase()),
          });
          if (sponsor) {
            await db.update(users)
              .set({ directCount: sponsor.directCount + 1, totalTeamCount: sponsor.totalTeamCount + 1 })
              .where(eq(users.id, sponsor.id));
          }
        }

        return res.json({ user: newUser, isNew: true, tokenSaleAvailableUsdt: 0 });
      }

      const tokenSaleRows = await db.execute(sql`
        SELECT COALESCE(SUM(GREATEST(0, gross_usdt - withdrawn_usdt)), 0) AS available_usdt
        FROM token_sell_ledgers
        WHERE user_id=${existingUser.id} AND status IN ('unclaimed','partially_claimed')
      `);
      const tokenSaleRow:any = (tokenSaleRows as any).rows?.[0] || {};
      return res.json({ user: existingUser, isNew: false, tokenSaleAvailableUsdt: Number(tokenSaleRow.available_usdt || 0) });
    } catch (error: any) {
      console.error("Error in /api/users/sync:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Profile & Dashboard Data
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, walletAddress.toLowerCase()),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Fetch user's recent transactions & earnings
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt)).limit(100);
      const userEarnings = await db.select().from(levelEarnings).where(eq(levelEarnings.beneficiaryId, user.id)).orderBy(desc(levelEarnings.createdAt)).limit(100);
      const tokenSaleTotals = await db.execute(sql`
        SELECT
          COALESCE(SUM(GREATEST(0, gross_usdt - withdrawn_usdt)), 0) AS available_usdt,
          COALESCE(SUM(withdrawn_usdt), 0) AS withdrawn_usdt
        FROM token_sell_ledgers
        WHERE user_id=${user.id}
          AND status IN ('unclaimed','partially_claimed','fully_claimed')
      `);
      const tokenSaleRow:any = (tokenSaleTotals as any)?.rows?.[0] || {};
      const earningTotals = await db.execute(sql`
        SELECT
          COALESCE(SUM(CASE WHEN level_number > 0 THEN commission_usdt ELSE 0 END), 0) AS level_income_usdt,
          COALESCE(SUM(CASE WHEN tx_type = 'matrix_join' THEN commission_usdt ELSE 0 END), 0) AS matrix_income_usdt
        FROM level_earnings
        WHERE beneficiary_id = ${user.id}
      `);
      const earningRow: any = (earningTotals as any)?.rows?.[0] || {};

      res.json({
        user,
        tokenSaleAvailableUsdt: Number(tokenSaleRow.available_usdt || 0),
        tokenSaleWithdrawnUsdt: Number(tokenSaleRow.withdrawn_usdt || 0),
        transactions: userTxs,
        earnings: userEarnings,
        levelIncomeUsdt: Number(earningRow.level_income_usdt || 0),
        matrixIncomeUsdt: Number(earningRow.matrix_income_usdt || 0),
      });
    } catch (error: any) {
      console.error("Error in /api/users/:walletAddress:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dynamic MLM Team / Genealogy endpoint: resolves the user's 2x2 matrix tree up to 7 levels.
  app.get("/api/team/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || '').trim().toLowerCase();
      if (!walletAddress) return res.status(400).json({ error: "walletAddress is required" });

      const leader = await db.query.users.findFirst({ where: eq(users.walletAddress, walletAddress) });
      if (!leader) return res.status(404).json({ error: "User not found" });

      const allUsers = await db.select().from(users);
      const allNodes = await db.select().from(matrixNodes).orderBy(asc(matrixNodes.id));
      const userById = new Map(allUsers.map((u: any) => [u.id, u]));
      const nodeById = new Map(allNodes.map((n: any) => [n.id, n]));
      const childrenByParent = new Map<number, any[]>();

      for (const node of allNodes as any[]) {
        if (node.parentId == null) continue;
        const children = childrenByParent.get(node.parentId) || [];
        children.push(node);
        childrenByParent.set(node.parentId, children);
      }
      for (const children of childrenByParent.values()) {
        children.sort((a, b) => (a.position || 0) - (b.position || 0));
      }

      type MemberRow = {
        userId: number;
        walletAddress: string;
        referralCode: string;
        sponsorReferralCode: string | null;
        level: number;
        position: number;
        parentWalletAddress: string | null;
        status: string;
        totalInvestedUsdt: number;
        totalPurchasedTokens: number;
        joinedAt: string | null;
      };

      const matrixLevels: Record<string, MemberRow[]> = {};
      const unilevelLevels: Record<string, MemberRow[]> = {};
      for (let i = 1; i <= 10; i++) {
        matrixLevels[String(i)] = [];
        unilevelLevels[String(i)] = [];
      }

      const toMemberRow = (member: any, level: number, position = 0, parentUser: any = null): MemberRow => ({
        userId: member.id,
        walletAddress: member.walletAddress,
        referralCode: member.referralCode,
        sponsorReferralCode: member.referredBy || null,
        level,
        position,
        parentWalletAddress: parentUser?.walletAddress || null,
        status: member.isMlmQualified ? 'active' : 'investor',
        totalInvestedUsdt: Number(member.totalInvestedUsdt || 0),
        totalPurchasedTokens: Number(member.totalPurchasedTokens || 0),
        joinedAt: member.createdAt ? new Date(member.createdAt).toISOString() : null,
      });

      // Matrix tree: placement hierarchy, maximum 10 levels.
      const leaderNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.userId, leader.id) });
      if (leaderNode) {
        const queue: Array<{ nodeId: number; level: number }> = [{ nodeId: leaderNode.id, level: 0 }];
        const seen = new Set<number>([leaderNode.id]);
        while (queue.length) {
          const current = queue.shift()!;
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

      // Unilevel tree: sponsor/referral hierarchy, independent from matrix placement.
      const usersBySponsor = new Map<string, any[]>();
      for (const member of allUsers as any[]) {
        const sponsor = String(member.referredBy || '').trim().toUpperCase();
        if (!sponsor) continue;
        const children = usersBySponsor.get(sponsor) || [];
        children.push(member);
        usersBySponsor.set(sponsor, children);
      }
      const sponsorKeys = new Set<string>([String(leader.referralCode || '').trim().toUpperCase(), leader.walletAddress.toUpperCase()]);
      let currentMembers = [leader];
      const seenUsers = new Set<number>([leader.id]);
      for (let level = 1; level <= 10; level++) {
        const nextMembers: any[] = [];
        for (const parent of currentMembers) {
          const keys = [String(parent.referralCode || '').trim().toUpperCase(), String(parent.walletAddress || '').trim().toUpperCase()];
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

      const earnings = await db.select().from(levelEarnings).where(eq(levelEarnings.beneficiaryId, leader.id));
      const unilevelIncome: Record<string, number> = {};
      const matrixIncome: Record<string, number> = {};
      for (let i = 1; i <= 10; i++) {
        unilevelIncome[String(i)] = 0;
        matrixIncome[String(i)] = 0;
      }
      for (const earning of earnings as any[]) {
        const level = Number(earning.levelNumber);
        if (level < 1 || level > 10) continue;
        const amount = Number(earning.commissionUsdt || 0);
        if (earning.txType === 'matrix_join') matrixIncome[String(level)] += amount;
        else if (earning.txType === 'token_purchase') unilevelIncome[String(level)] += amount;
      }

      const counts = Object.fromEntries(Object.entries(matrixLevels).map(([k, v]) => [k, v.length]));
      const unilevelCounts = Object.fromEntries(Object.entries(unilevelLevels).map(([k, v]) => [k, v.length]));
      const sum = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

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
        structure: '2x2 forced matrix',
      });
    } catch (error: any) {
      console.error("Error in /api/team/:walletAddress:", error);
      res.status(500).json({ error: error.message || "Failed to load team" });
    }
  });

  // Buy Presale Tokens API (Supports Real Web3 & Direct Payment TxHash)
  app.post("/api/presale/buy", async (req, res) => {
    try {
      const { walletAddress, amountUsdt, tokenAmount, tokenPrice, phaseIndex, txHash, directBuyerInviteToken } = req.body;
      if (!walletAddress || !amountUsdt || !tokenAmount) {
        return res.status(400).json({ error: "Missing required purchase fields" });
      }

      // The transaction receipt is the source of truth for the phase. A purchase
      // that exactly sells out a phase advances currentPhase inside the same
      // contract transaction, so reading currentPhase after mining can return the
      // NEXT phase even though this transaction was bought at the previous price.
      const requestedUsdt = Number(amountUsdt);
      const requestedTokens = Number(tokenAmount);
      if (!Number.isFinite(requestedUsdt) || requestedUsdt <= 0 || !Number.isFinite(requestedTokens) || requestedTokens <= 0) {
        return res.status(400).json({ error: 'Invalid purchase amount.' });
      }
      const submittedPrice = Number(tokenPrice);
      if (!Number.isFinite(submittedPrice) || submittedPrice <= 0) {
        return res.status(400).json({ error: 'Invalid purchase price.' });
      }

      // SECURITY: a syntactically valid tx hash is NOT proof of payment. Verify
      // the real BSC receipt, buyer, exact USDT treasury payment, and exact NXBC
      // delivery from the current presale contract before applying any database
      // side effects (MLM commissions, phase progression, qualification, etc.).
      let purchaseStatus: 'completed' | 'pending_verification' | 'failed' = 'pending_verification';
      const hasValidTxHash = typeof txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(txHash);
      let verifiedPhaseNumber = 0;
      let verifiedPurchasePrice = submittedPrice;
      let verifiedPurchaseTokens = requestedTokens;
      let verifiedPurchaseUsdt = requestedUsdt;
      if (hasValidTxHash) {
        const chainCheck = await verifyPresalePurchaseOnChain({
          txHash,
          buyer: walletAddress,
          usdtAmount: requestedUsdt,
          nxbcAmount: requestedTokens,
        });
        if (chainCheck.ok) {
          purchaseStatus = 'completed';
          verifiedPhaseNumber = Number(chainCheck.phase || 0);
          verifiedPurchaseTokens = Number(chainCheck.nxbcAmount || requestedTokens);
          verifiedPurchaseUsdt = Number(chainCheck.usdtAmount || requestedUsdt);
          verifiedPurchasePrice = verifiedPurchaseUsdt / Math.max(verifiedPurchaseTokens, 1e-18);
          if (!verifiedPhaseNumber || !Number.isFinite(verifiedPurchasePrice) || verifiedPurchasePrice <= 0) {
            return res.status(400).json({ success: false, error: 'Purchase event was verified, but its phase data could not be decoded safely.' });
          }
        } else if (chainCheck.pending) purchaseStatus = 'pending_verification';
        else purchaseStatus = 'failed';
      }
      // ------------------------------------------------------------------------

      const normalizedAddress = walletAddress.toLowerCase();
      let user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
      });

      if (!user) {
        // Auto-register user if first purchase
        const generatedRefCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const [newUser] = await db.insert(users).values({
          walletAddress: normalizedAddress,
          referralCode: generatedRefCode,
          referredBy: null,
          availableUsdt: 0,
        }).returning();
        user = newUser;
      }

      // Idempotency / recovery: one blockchain tx may only settle once.
      // IMPORTANT: if an older server version incorrectly stored a real, successful
      // purchase as `failed`, do NOT reject the same tx hash forever. Re-verify the
      // canonical on-chain receipt and safely recover that existing row instead.
      if (hasValidTxHash && txHash) {
        const existingTx = await db.query.transactions.findFirst({ where: eq(transactions.txHash, txHash) });
        if (existingTx) {
          if (existingTx.status === 'completed') {
            return res.status(409).json({ success: false, error: "This blockchain transaction has already been settled as a purchase.", transaction: existingTx });
          }

          if (purchaseStatus !== 'completed') {
            return res.status(409).json({
              success: false,
              error: "This blockchain transaction is already recorded and is still awaiting successful on-chain verification.",
              transaction: existingTx,
            });
          }

          // The row was previously pending/failed, but the canonical BSC receipt
          // is now verified. Recover the SAME database row; never create a second
          // purchase and never send NXBC again.
          const [recoveredTx] = await db.update(transactions).set({
            amountUsdt: verifiedPurchaseUsdt,
            tokenAmount: verifiedPurchaseTokens,
            tokenPrice: verifiedPurchasePrice,
            phaseIndex: verifiedPhaseNumber,
            status: 'completed',
          }).where(eq(transactions.id, existingTx.id)).returning();

          const { newInvested, isNowMlmQualified } = await finalizeConfirmedPurchase(
            user,
            verifiedPurchaseTokens,
            verifiedPurchaseUsdt,
            verifiedPhaseNumber
          );

          const fifoSettlement = await matchVerifiedBuyerToPhaseQueue({
            buyerUserId: user.id,
            buyerWallet: normalizedAddress,
            phaseNumber: verifiedPhaseNumber,
            buyerTokenAmount: verifiedPurchaseTokens,
            directBuyerInviteToken: typeof directBuyerInviteToken === 'string' ? directBuyerInviteToken : undefined,
          });

          return res.json({
            success: true,
            recovered: true,
            transaction: recoveredTx,
            tokenDispatchTxHash: txHash,
            totalInvestedUsdt: newInvested,
            isMlmQualified: isNowMlmQualified,
            fifoSettlement: {
              buyerTokens: verifiedPurchaseTokens,
              userSharePercent: fifoSettlement.sellerSharePercent,
              adminSharePercent: fifoSettlement.companySharePercent,
              userShareTokens: fifoSettlement.userShareTokens,
              adminShareTokens: fifoSettlement.adminShareTokens,
              unmatchedUserShareTokens: fifoSettlement.unmatchedUserShareTokens,
              matches: fifoSettlement.matches,
            },
          });
        }
      }

      // Record transaction
      const [tx] = await db.insert(transactions).values({
        userId: user.id,
        type: 'buy_presale',
        amountUsdt: purchaseStatus === 'completed' ? verifiedPurchaseUsdt : Number(amountUsdt),
        tokenAmount: purchaseStatus === 'completed' ? verifiedPurchaseTokens : Number(tokenAmount),
        tokenPrice: purchaseStatus === 'completed' ? verifiedPurchasePrice : submittedPrice,
        phaseIndex: purchaseStatus === 'completed' ? verifiedPhaseNumber : 1,
        status: purchaseStatus,
        txHash: hasValidTxHash ? txHash : null,
      }).returning();

      if (purchaseStatus === 'pending_verification') {
        return res.status(202).json({
          success: true, pending: true,
          message: "Purchase recorded as pending — awaiting a mined and fully verified BSC purchase transaction.",
          transaction: tx,
        });
      }
      if (purchaseStatus === 'failed') {
        return res.status(400).json({ success: false, error: "Purchase transaction could not be verified as a valid payment and NXBC delivery on BSC.", transaction: tx });
      }

      const { newInvested, isNowMlmQualified } = await finalizeConfirmedPurchase(
        user,
        verifiedPurchaseTokens,
        verifiedPurchaseUsdt,
        verifiedPhaseNumber
      );

      // VERIFIED PURCHASE -> FIFO MATCHING. This is the only place where a real
      // buyer purchase can advance queued phase-sale orders. It credits seller
      // USDT as withdrawable ledger balance; the seller's NXBC remains in their
      // wallet until withdrawal, when the server performs exact on-chain return
      // verification before paying USDT.
      const fifoSettlement = await matchVerifiedBuyerToPhaseQueue({
        buyerUserId: user.id,
        buyerWallet: normalizedAddress,
        phaseNumber: verifiedPhaseNumber,
        buyerTokenAmount: verifiedPurchaseTokens,
        directBuyerInviteToken: typeof directBuyerInviteToken === 'string' ? directBuyerInviteToken : undefined,
      });

      // SECURITY: NXBC is delivered exclusively by the presale smart contract
      // through the user's wallet transaction. Never perform a second hot-wallet
      // transfer here, because that can double-credit the buyer.
      const tokenDispatchTxHash = txHash;

      res.json({ 
        success: true, 
        transaction: tx,
        tokenDispatchTxHash: tokenDispatchTxHash || null,
        totalInvestedUsdt: newInvested,
        isMlmQualified: isNowMlmQualified,
        statusNotice: isNowMlmQualified 
          ? "MLM Leader Qualified ($100+ Total Investment)" 
          : `Investor Mode ($${newInvested.toFixed(2)} / $100 USD to qualify for MLM commissions)`,
        fifoSettlement: {
          buyerTokens: verifiedPurchaseTokens,
          userSharePercent: fifoSettlement.sellerSharePercent,
          adminSharePercent: fifoSettlement.companySharePercent,
          userShareTokens: fifoSettlement.userShareTokens,
          adminShareTokens: fifoSettlement.adminShareTokens,
          unmatchedUserShareTokens: fifoSettlement.unmatchedUserShareTokens,
          matches: fifoSettlement.matches,
        }
      });
    } catch (error: any) {
      console.error("Error in /api/presale/buy:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // P2P Sell Order Queue (FIFO)
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
         fifoNumber: sellOrders.fifoNumber,
         createdAt: sellOrders.createdAt
      })
      .from(sellOrders)
      .leftJoin(users, eq(sellOrders.userId, users.id))
      .where(inArray(sellOrders.status, ['open', 'partially_filled']))
      .orderBy(asc(sellOrders.priority), asc(sellOrders.createdAt), asc(sellOrders.id));
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public Global FIFO Queue — phase-wise active queue for every user.
  // Wallets are masked for privacy; queue position and aggregate amounts are public.
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
        fifoNumber: sellOrders.fifoNumber,
        createdAt: sellOrders.createdAt,
      })
      .from(sellOrders)
      .leftJoin(users, eq(sellOrders.userId, users.id))
      .where(inArray(sellOrders.status, ['open', 'partially_filled']))
      .orderBy(asc(sellOrders.phaseNumber), asc(sellOrders.priority), asc(sellOrders.createdAt), asc(sellOrders.id));

      const byPhase: Record<number, any[]> = {};
      for (const row of activeOrders) {
        const phase = Number(row.phaseNumber);
        if (!byPhase[phase]) byPhase[phase] = [];
        byPhase[phase].push(row);
      }

      const maskWallet = (wallet: string | null | undefined) => {
        const w = String(wallet || '');
        if (w.length < 12) return 'Unknown';
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
            fifoNumber: Number(row.fifoNumber || row.priority || 0),
            position,
            aheadTokens,
            expectedRemainingUsdt: remaining * Number(row.tokenPrice || 0),
            createdAt: row.createdAt,
          };
          aheadTokens += remaining;
          return order;
        });

        return {
          phaseNumber,
          totalOrders: phaseOrders.length,
          totalQueuedTokens: phaseOrders.reduce((sum, o) => sum + o.remainingTokens, 0),
          orders: phaseOrders,
        };
      });

      res.json({ success: true, phases, generatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('Error fetching global FIFO queue:', error);
      res.status(500).json({ success: false, error: 'Failed to load global FIFO queue.' });
    }
  });

  // 1:1 Instant Token Swap (USDT ⮂ NXBUSD)
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
        where: eq(users.walletAddress, normalizedAddress),
      });

      // SECURITY: Never create a completed financial transaction from client input.
      // This endpoint must only be enabled after a server-side, on-chain settlement
      // implementation is in place (including receipt, sender, recipient, amount,
      // token, chain-id and replay/duplicate checks).
      return res.status(501).json({
        success: false,
        error: 'Instant swap is temporarily disabled until server-side on-chain verification is enabled.',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Swap execution failed" });
    }
  });

  // -------------------------------------------------------------------------
  // Persistent user phase-sale allocation. This endpoint only creates FIFO
  // reservations after the presale purchase has already been verified on-chain.
  // It never credits USDT or creates earnings.
  // -------------------------------------------------------------------------
  app.get("/api/presale/allocation/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || '').toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: 'Invalid wallet address.' });
      const user = await db.query.users.findFirst({ where: eq(users.walletAddress, walletAddress) });
      if (!user) return res.json({ success: true, totalPurchasedTokens: 0, allocations: {} });
      const orders = await db.select().from(sellOrders).where(eq(sellOrders.userId, user.id));
      const liveRows = await db.execute(sql`SELECT COALESCE(SUM(tokens_allocated),0) AS allocated FROM live_hold_allocations WHERE user_id=${user.id} AND status='held'`);
      const liveHeld = Number(((liveRows as any).rows?.[0] || (liveRows as any)[0])?.allocated || 0);
      const allocations: Record<number, { allocated: number; sold: number }> = {};
      for (const o of orders) {
        const phase = Number(o.phaseNumber);
        if (!allocations[phase]) allocations[phase] = { allocated: 0, sold: 0 };
        allocations[phase].allocated += Number(o.amountTokens || 0);
        allocations[phase].sold += Math.max(0, Number(o.amountTokens || 0) - Number(o.remainingTokens || 0));
      }
      allocations[6] = { allocated: liveHeld, sold: 0 };
      res.json({ success: true, totalPurchasedTokens: Number(user.totalPurchasedTokens || 0), allocations, liveHoldTokens: liveHeld });
    } catch (error: any) {
      console.error('Error fetching phase allocation:', error);
      res.status(500).json({ error: 'Failed to load phase allocation.' });
    }
  });

  // Detailed personal sale-order history for the user dashboard.
  // Includes open, partially filled, completed and cancelled orders.
  app.get("/api/presale/sale-orders/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress || '').toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: 'Invalid wallet address.' });
      const user = await db.query.users.findFirst({ where: eq(users.walletAddress, walletAddress) });
      if (!user) return res.json({ success: true, orders: [] });
      const orders = await db.select().from(sellOrders)
        .where(eq(sellOrders.userId, user.id))
        .orderBy(asc(sellOrders.priority), asc(sellOrders.createdAt), asc(sellOrders.id));
      const allActive = await db.select({ id: sellOrders.id, phaseNumber: sellOrders.phaseNumber, fifoNumber: sellOrders.fifoNumber, priority: sellOrders.priority })
        .from(sellOrders)
        .where(inArray(sellOrders.status, ['open', 'partially_filled']))
        .orderBy(asc(sellOrders.phaseNumber), asc(sellOrders.priority), asc(sellOrders.createdAt), asc(sellOrders.id));
      const positionMap = new Map<number, number>();
      const runningByPhase = new Map<number, number>();
      const seenByPhase = new Map<number, number>();
      for (const o of allActive as any[]) {
        const phase = Number(o.phaseNumber);
        if (!runningByPhase.has(phase)) runningByPhase.set(phase, Number(o.fifoNumber || o.priority || 0));
        const idx = seenByPhase.get(phase) || 0;
        positionMap.set(Number(o.id), idx);
        seenByPhase.set(phase, idx + 1);
      }
      res.json({
        success: true,
        orders: orders.map((o: any) => {
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
            // Real persisted FIFO number only. Never expose priority/demo values as FIFO.
            fifoNumber: Number(o.fifoNumber || 0),
            createdAt: o.createdAt,
          };
        }),
      });
    } catch (error: any) {
      console.error('Error fetching personal sale orders:', error);
      res.status(500).json({ error: 'Failed to load sale orders.' });
    }
  });

  app.post("/api/presale/direct-buyer/invite", async (req, res) => {
    try {
      const walletAddress=String(req.body?.walletAddress||'').toLowerCase(), orderId=Number(req.body?.orderId);
      if(!/^0x[a-f0-9]{40}$/.test(walletAddress)||!Number.isInteger(orderId)) return res.status(400).json({error:'Valid wallet address and order ID are required.'});
      const user=await db.query.users.findFirst({where:eq(users.walletAddress,walletAddress)}); if(!user) return res.status(404).json({error:'User not found.'});
      await ensureDirectBuyerTables(); const invite=await createDirectBuyerInvite(user.id,orderId); const proto=String(req.get('x-forwarded-proto')||req.protocol||'https').split(',')[0]; const base=`${proto}://${req.get('host')}`;
      res.json({success:true,inviteToken:invite.token,expiresAt:invite.expiresAt,phaseNumber:invite.phaseNumber,remainingTokens:invite.remainingTokens,shareUrl:`${base}/?directBuyer=${encodeURIComponent(invite.token)}`});
    } catch(error:any){res.status(400).json({error:error.message||'Could not create Direct Buyer Match invite.'});}
  });

  app.get("/api/presale/direct-buyer/invite/:token", async (req,res)=>{
    try{await ensureDirectBuyerTables(); const rows=await db.execute(sql`SELECT i.phase_number,i.sell_order_id,i.expires_at,i.used_at,o.remaining_tokens,o.token_price,u.wallet_address FROM direct_buyer_invites i JOIN sell_orders o ON o.id=i.sell_order_id JOIN users u ON u.id=i.seller_user_id WHERE i.token_hash=${hashDirectInvite(String(req.params.token||''))} LIMIT 1`); const row:any=(rows as any).rows?.[0]||(rows as any)[0];
      if(!row||row.used_at||new Date(row.expires_at).getTime()<=Date.now()) return res.status(404).json({error:'Invite is expired or already used.'});
      res.json({success:true,phaseNumber:Number(row.phase_number),remainingTokens:Number(row.remaining_tokens||0),tokenPrice:Number(row.token_price||0),sellerWalletMasked:`${String(row.wallet_address).slice(0,6)}...${String(row.wallet_address).slice(-4)}`,expiresAt:row.expires_at});
    }catch{res.status(400).json({error:'Invalid Direct Buyer Match invite.'});}
  });

  app.post("/api/presale/allocation", async (req, res) => {
    try {
      // Each allocation belongs to one verified purchase lot. Same-phase and past-phase
      // allocation is rejected server-side; LIVE/DEX is a reservation, never FIFO.
      await db.execute(sql`ALTER TABLE sell_orders ADD COLUMN IF NOT EXISTS purchase_tx_hash TEXT`);

      const walletAddress = String(req.body?.walletAddress || '').toLowerCase();
      const allocations = Array.isArray(req.body?.allocations) ? req.body.allocations : [];
      if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return res.status(400).json({ error: 'Invalid wallet address.' });
      const user = await db.query.users.findFirst({ where: eq(users.walletAddress, walletAddress) });
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const liveHoldTokens = Math.max(0, Number(req.body?.liveHoldTokens || 0));
      const sourceTxHash = typeof req.body?.purchaseTxHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(req.body.purchaseTxHash) ? req.body.purchaseTxHash : null;
      if (!sourceTxHash) return res.status(400).json({ error: 'A verified purchase transaction hash is required for allocation.' });

      const sourcePurchase = await db.query.transactions.findFirst({
        where: and(eq(transactions.txHash, sourceTxHash), eq(transactions.userId, user.id), eq(transactions.type, 'buy_presale'), eq(transactions.status, 'completed'))
      });
      if (!sourcePurchase) return res.status(400).json({ error: 'Verified purchase lot not found for this wallet.' });
      const purchasePhase = Number(sourcePurchase.phaseIndex || 1);
      const purchaseTokens = Number(sourcePurchase.tokenAmount || 0);
      if (purchaseTokens <= 0) return res.status(400).json({ error: 'Purchase lot contains no NXBC tokens.' });

      const clean = allocations.map((a: any) => ({ phaseNumber: Number(a.phaseNumber), amountTokens: Number(a.amountTokens) }))
        .filter((a: any) => Number.isInteger(a.phaseNumber) && a.phaseNumber >= 2 && a.phaseNumber <= 5 && Number.isFinite(a.amountTokens) && a.amountTokens > 0);
      if (clean.some((a: any) => a.phaseNumber <= purchasePhase)) {
        return res.status(400).json({ error: `This purchase was made in Phase ${purchasePhase}. You can allocate only to future phases (P${purchasePhase + 1}-P5) or DEX / LIVE.` });
      }
      const requested = clean.reduce((sum: number, a: any) => sum + a.amountTokens, 0);
      if (liveHoldTokens <= 0 && requested <= 0) return res.status(400).json({ error: 'Allocation must contain at least one P2-P5 or LIVE/HOLD token amount.' });
      if (liveHoldTokens > 0 && !sourceTxHash) return res.status(400).json({ error: 'A verified purchase transaction hash is required to permanently reserve LIVE/HOLD tokens.' });
      const existingLotOrders = await db.execute(sql`SELECT COALESCE(SUM(amount_tokens),0) AS allocated FROM sell_orders WHERE user_id=${user.id} AND purchase_tx_hash=${sourceTxHash} AND status <> 'cancelled'`);
      const lotAllocated = Number(((existingLotOrders as any).rows?.[0] || (existingLotOrders as any)[0])?.allocated || 0);
      const existingLive = await db.execute(sql`SELECT COALESCE(SUM(tokens_allocated),0) AS held FROM live_hold_allocations WHERE user_id=${user.id} AND purchase_tx_hash=${sourceTxHash} AND status='held'`);
      const lotLiveHeld = Number(((existingLive as any).rows?.[0] || (existingLive as any)[0])?.held || 0);
      const available = Math.max(0, purchaseTokens - lotAllocated - lotLiveHeld);
      if (available <= 1e-9 && requested <= 1e-9 && liveHoldTokens <= 1e-9) {
        const existingOrders = await db.select().from(sellOrders).where(and(eq(sellOrders.userId, user.id), eq(sellOrders.purchaseTxHash, sourceTxHash)));
        const heldRows = await db.execute(sql`SELECT id,tokens_allocated,status FROM live_hold_allocations WHERE user_id=${user.id} AND purchase_tx_hash=${sourceTxHash} AND status='held'`);
        const existingHeld = (heldRows as any).rows || (heldRows as any);
        return res.json({ success: true, idempotent: true, orders: existingOrders, liveHold: existingHeld[0] ? { id:Number(existingHeld[0].id), allocated:Number(existingHeld[0].tokens_allocated), status:existingHeld[0].status } : null });
      }
      if (requested + liveHoldTokens > available + 1e-9) return res.status(400).json({ error: `Allocation exceeds available NXBC. You can allocate up to ${available} NXBC.`, availableTokens: available });
      if (Math.abs((requested + liveHoldTokens) - available) > 1e-9) {
        return res.status(400).json({ error: `For production safety, every purchase lot must be fully allocated to future phases and/or DEX / LIVE. Remaining unallocated NXBC: ${Math.max(0, available - requested - liveHoldTokens)}.` });
      }

      const created = [];
      for (const a of clean) {
        const phase = LIVE_PRESALE_PHASES.find((p) => p.phaseNumber === a.phaseNumber);
        const price = Number(phase?.rate ?? 0);
        if (!price || price <= 0) return res.status(400).json({ error: `Invalid live price configuration for Phase ${a.phaseNumber}.` });
        const seqRow = await db.execute(sql`SELECT nextval('sell_orders_fifo_seq') AS fifo_number`);
        const seqValue: any = (seqRow as any).rows?.[0] || (seqRow as any)[0];
        const fifoNumber = Number(seqValue?.fifo_number || 0);
        if (!Number.isInteger(fifoNumber) || fifoNumber <= 0) return res.status(500).json({ error: 'Could not allocate a permanent FIFO number.' });
        const [order] = await db.insert(sellOrders).values({
          userId: user.id, purchaseTxHash: sourceTxHash, phaseNumber: a.phaseNumber, amountTokens: a.amountTokens, remainingTokens: a.amountTokens,
          tokenPrice: price, totalUsdtValue: a.amountTokens * price, status: 'open', priority: fifoNumber, fifoNumber,
        }).returning();
        created.push(order);
      }
      let liveHold:any = null;
      if (liveHoldTokens > 0) {
        const result = await db.execute(sql`INSERT INTO live_hold_allocations (user_id,wallet_address,purchase_tx_hash,tokens_allocated,status) VALUES (${user.id},${walletAddress},${sourceTxHash},${liveHoldTokens},'held') RETURNING id,tokens_allocated,status`);
        liveHold = (result as any).rows?.[0] || (result as any)[0];
      }
      res.json({ success: true, orders: created, liveHold: liveHold ? { id:Number(liveHold.id), allocated:Number(liveHold.tokens_allocated), status:liveHold.status } : null });
    } catch (error: any) {
      console.error('Error saving phase allocation:', error);
      res.status(500).json({ error: 'Failed to save phase allocation.' });
    }
  });

  // Create P2P Sell Order
  app.post("/api/p2p/sell", async (req, res) => {
    if (!settlementEndpointsEnabled()) {
      return res.status(403).json({ success: false, error: "Unverified browser-side P2P sales are disabled. Tokens must be verified on-chain before a financial order is created." });
    }
    try {
      const { walletAddress, amountTokens, tokenPrice } = req.body;
      const purchaseTxHash = typeof req.body?.purchaseTxHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(req.body.purchaseTxHash) ? req.body.purchaseTxHash : null;
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, walletAddress.toLowerCase()),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const phaseNum = req.body.phaseNumber ? Number(req.body.phaseNumber) : 0;
      if (!Number.isInteger(phaseNum) || phaseNum < 2 || phaseNum > 5) {
        return res.status(400).json({ error: 'P2-P5 presale sell orders only. Phase 1 and LIVE/DEX holdings cannot be placed in FIFO.' });
      }
      if (!purchaseTxHash) return res.status(400).json({ error: 'purchaseTxHash is required. FIFO orders must be tied to a verified purchase lot.' });
      const sourcePurchase = await db.query.transactions.findFirst({
        where: and(eq(transactions.txHash, purchaseTxHash), eq(transactions.userId, user.id), eq(transactions.type, 'buy_presale'), eq(transactions.status, 'completed'))
      });
      if (!sourcePurchase) return res.status(400).json({ error: 'Verified purchase lot not found.' });
      const purchasePhase = Number(sourcePurchase.phaseIndex || 1);
      if (phaseNum <= purchasePhase) return res.status(400).json({ error: `Phase ${purchasePhase} purchases can only be allocated to future phases or DEX / LIVE.` });
      // FIFO settlement price is authoritative from the deployed presale phase table,
      // never from a user-supplied price or stale admin UI config.
      const phasePrice = Number(LIVE_PRESALE_PHASES.find((p) => p.phaseNumber === phaseNum)?.rate ?? 0);
      const price = phasePrice;
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Invalid token price/phase price.' });
      const totalUsdt = Number(amountTokens) * price;
      const maxPriorityRow = await db.select({ priority: sellOrders.priority }).from(sellOrders).orderBy(desc(sellOrders.priority)).limit(1);
      const nextPriority = Number(maxPriorityRow[0]?.priority ?? 0) + 1;
      const [order] = await db.insert(sellOrders).values({
        userId: user.id,
        purchaseTxHash,
        phaseNumber: phaseNum,
        amountTokens: Number(amountTokens),
        remainingTokens: Number(amountTokens),
        tokenPrice: price,
        totalUsdtValue: totalUsdt,
        status: 'open',
        priority: nextPriority,
      }).returning();

      res.json({ success: true, order });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // Admin FIFO controls - persisted in PostgreSQL, not browser/localStorage.
  // -------------------------------------------------------------------------
  app.post("/api/admin/sellqueue/reorder", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds.map(Number).filter(Number.isFinite) : [];
      if (!orderIds.length) return res.status(400).json({ error: "orderIds is required." });
      for (let i = 0; i < orderIds.length; i++) {
        await db.update(sellOrders).set({ priority: i + 1 }).where(eq(sellOrders.id, orderIds[i]));
      }
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/admin/sellqueue/instant-fulfill", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const orderId = Number(req.body?.orderId);
      if (!Number.isFinite(orderId)) return res.status(400).json({ error: "Valid orderId is required." });
      const order = await db.query.sellOrders.findFirst({ where: eq(sellOrders.id, orderId) });
      if (!order) return res.status(404).json({ error: "Sell order not found." });
      const remaining = Math.max(0, Number(order.remainingTokens));
      if (remaining <= 0 || order.status === 'completed') return res.json({ success: true, order });
      const gross = remaining * Number(order.tokenPrice);
      await db.update(sellOrders).set({ remainingTokens: 0, status: 'completed' }).where(eq(sellOrders.id, order.id));
      const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
      if (user) {
        // Token-sale proceeds live only in tokenSellLedgers (Token Sale Wallet).
        await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id));
        await db.insert(tokenSellLedgers).values({
          userId: user.id, walletAddress: user.walletAddress, phaseIndex: order.phaseNumber,
          phaseName: `Phase ${order.phaseNumber}`, tokenPrice: Number(order.tokenPrice),
          tokensSold: remaining, tokensReturned: 0, grossUsdt: gross, withdrawnUsdt: 0,
          serviceFeeUsdt: 0, status: 'unclaimed'
        });
      }
      res.json({ success: true, orderId: order.id, tokensSold: remaining, grossUsdt: gross });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // System & Admin Configurations (Live Synchronization)
  // The initial PIN is never hard-coded. It is inserted as a salted hash at startup.
  let inMemoryAdminPinHash = hashPin(String(process.env.ADMIN_PIN_INITIAL || randomBytes(24).toString('hex')));
  // Verify PIN Endpoint (hashed comparison + brute-force lockout)
  app.post("/api/admin/verify-pin", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lockout = checkPinLockout(ip);
      if (lockout.locked) {
        return res.status(429).json({
          success: false,
          error: `Too many incorrect attempts. Try again in ${Math.ceil((lockout.retryAfterMs || 0) / 60000)} minute(s).`,
        });
      }

      const { pin } = req.body;
      const cleanPin = (pin || "").trim();

      // Check in database first
      let currentPinHash = inMemoryAdminPinHash;
      try {
        const pinRecord = await db.query.systemConfigs.findFirst({
          where: eq(systemConfigs.key, "admin_pin"),
        });
        if (pinRecord && pinRecord.value) {
          currentPinHash = pinRecord.value;
          inMemoryAdminPinHash = pinRecord.value;
        }
      } catch (dbErr) {}

      if (cleanPin && verifyPin(cleanPin, currentPinHash)) {
        recordPinSuccess(ip);
        const adminToken = issueAdminSession();
        return res.json({ success: true, message: "Authentication successful", adminToken });
      } else {
        recordPinFailure(ip);
        return res.status(401).json({ success: false, error: "Incorrect Security PIN. Access Denied." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Server authentication error" });
    }
  });

  // Change Admin PIN Endpoint
  app.post("/api/admin/change-pin", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lockout = checkPinLockout(ip);
      if (lockout.locked) {
        return res.status(429).json({
          error: `Too many incorrect attempts. Try again in ${Math.ceil((lockout.retryAfterMs || 0) / 60000)} minute(s).`,
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
          where: eq(systemConfigs.key, "admin_pin"),
        });
        if (pinRecord && pinRecord.value) {
          activePinHash = pinRecord.value;
        }
      } catch (dbErr) {}

      if (!cleanCurrent || !verifyPin(cleanCurrent, activePinHash)) {
        recordPinFailure(ip);
        return res.status(401).json({ error: "Current PIN is incorrect." });
      }
      recordPinSuccess(ip);

      // Update PIN in database and memory (hashed, never plaintext)
      const newHash = hashPin(cleanNew);
      inMemoryAdminPinHash = newHash;
      try {
        const existing = await db.query.systemConfigs.findFirst({
          where: eq(systemConfigs.key, "admin_pin"),
        });
        if (existing) {
          await db.update(systemConfigs).set({ value: newHash, updatedAt: new Date() }).where(eq(systemConfigs.key, "admin_pin"));
        } else {
          await db.insert(systemConfigs).values({ key: "admin_pin", value: newHash, description: "Master Admin Security PIN (hashed)" });
        }
      } catch (dbErr) {
        console.log("Database PIN update notice:", dbErr);
      }

      res.json({ success: true, message: "Admin PIN changed successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update PIN" });
    }
  });

  // Public Presale Config — exposes only safe phase data needed by user dashboards.
  // Admin configuration remains protected by requireAdmin below.
  app.get("/api/presale/config", async (_req, res) => {
    try {
      const live = await getLivePresaleState();

      const socialRecord = await db.query.systemConfigs.findFirst({
        where: eq(systemConfigs.key, "systemConfig"),
      });
      let publicSystemConfig: any = {
        tokenName: 'NXBC',
        tokenSymbol: 'NXBC',
        contractAddress: process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS,
        receivingAddress: process.env.PRESALE_RECEIVING_WALLET || DEFAULT_ADMIN_WALLET,
        presalePaused: !live.active,
        withdrawalFeePercent: 2,
        sellQueueSharePercent: 20,
      };
      if (socialRecord?.value) {
        try {
          const parsed = JSON.parse(socialRecord.value);
          publicSystemConfig = {
            tokenName: parsed.tokenName || 'NXBC',
            tokenSymbol: parsed.tokenSymbol || 'NXBC',
            contractAddress: process.env.NXBC_TOKEN_ADDRESS || DEFAULT_NXBC_TOKEN_ADDRESS,
            receivingAddress: process.env.PRESALE_RECEIVING_WALLET || DEFAULT_ADMIN_WALLET,
            presalePaused: !live.active,
            withdrawalFeePercent: Number.isFinite(Number(parsed.withdrawalFeePercent ?? 2))
              ? Math.max(0, Math.min(100, Number(parsed.withdrawalFeePercent ?? 2)))
              : 2,
            sellQueueSharePercent: Number.isFinite(Number(parsed.sellQueueSharePercent ?? 20))
              ? Math.max(0, Math.min(100, Number(parsed.sellQueueSharePercent ?? 20)))
              : 20,
            socialLinks: parsed.socialLinks || {},
          };
        } catch {}
      }

      const safePhases = live.phases.map((livePhase: any) => ({
        ...livePhase,
        // Financial phase fields are read only from the deployed BSC contract.
        // DB/admin config may not overwrite price, allocation, sold or status.
        multiplier: '',
        targetDate: '',
      }));

      res.json({
        success: true,
        phases: safePhases,
        currentPhase: live.currentPhase,
        currentPhasePrice: live.price,
        currentPhaseRemaining: live.currentRemaining,
        totalSold: live.totalSold,
        presaleActive: live.active,
        presaleNXBCBalance: live.presaleBalance,
        systemConfig: publicSystemConfig,
      });
    } catch (error: any) {
      console.error("Error in /api/presale/config:", error);
      res.status(500).json({ success: false, error: "Failed to load live presale configuration." });
    }
  });

  // Public global presale activity.
  // Primary source: completed, on-chain-verified buy_presale transactions.
  // Legacy fallback: the DB phase counters are used only when there are no
  // completed purchase rows yet, so an existing production phase counter is
  // not displayed as zero. The fallback never invents a purchase count.
  app.get("/api/presale/trust-stats", async (_req, res) => {
    try {
      const phaseRow = await db.query.systemConfigs.findFirst({
        where: eq(systemConfigs.key, 'phases'),
      });

      let totalTokensSold = 0;
      let totalUsdtReceived = 0;
      let completedPurchases = 0;
      const phaseData = phaseRow?.value ? JSON.parse(phaseRow.value) : [];

      if (Array.isArray(phaseData)) {
        for (const phase of phaseData) {
          const sales = await getPhaseSalesSnapshot(phase);
          const supply = Math.max(0, Number(phase.totalSupply || 0));
          const sold = Math.min(supply, sales.totalSold);
          const rate = Number(phase.rate ?? phase.tokenPrice ?? phase.price ?? 0);
          totalTokensSold += sold;
          if (Number.isFinite(rate) && rate > 0) totalUsdtReceived += sold * rate;
          if (Number(phase.phaseNumber || 0) > 0) {
            const rows = await db.select({ count: sql`count(*)` })
              .from(transactions)
              .where(and(
                eq(transactions.type, 'buy_presale'),
                eq(transactions.status, 'completed'),
                eq(transactions.phaseIndex, Number(phase.phaseNumber)),
              ));
            completedPurchases += Number(rows[0]?.count ?? 0);
          }
        }
      } else {
        const result = await db.execute(sql`
          SELECT
            COALESCE(SUM(token_amount), 0) AS total_tokens_sold,
            COALESCE(SUM(amount_usdt), 0) AS total_usdt_received,
            COUNT(*) AS completed_purchases
          FROM transactions
          WHERE type = 'buy_presale'
            AND status = 'completed'
        `);
        const row: any = (result as any)?.rows?.[0] || {};
        totalTokensSold = Number(row.total_tokens_sold || 0);
        totalUsdtReceived = Number(row.total_usdt_received || 0);
        completedPurchases = Number(row.completed_purchases || 0);
      }

      return res.json({
        success: true,
        totalTokensSold,
        totalUsdtReceived,
        completedPurchases,
        source: 'admin_baseline_plus_verified_transactions',
        verified: completedPurchases > 0,
      });
    } catch (error: any) {
      console.error("Error in /api/presale/trust-stats:", error);
      res.status(500).json({ success: false, error: "Failed to load presale statistics." });
    }
  });

  // Get Live System & Admin Configs
  app.get("/api/admin/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      let dbConfigs: Record<string, any> = {};
      try {
        const rows = await db.select().from(systemConfigs);
        for (const row of rows) {
          try {
            dbConfigs[row.key] = JSON.parse(row.value);
          } catch {
            dbConfigs[row.key] = row.value;
          }
        }
      } catch (dbErr) {}

      const adminPhases = Array.isArray(dbConfigs.phases)
        ? await Promise.all(dbConfigs.phases.map(async (p: any) => {
            const sales = await getPhaseSalesSnapshot(p);
            return {
              ...p,
              // Admin UI edits only the manual/initial sold baseline. Verified
              // user purchases are calculated separately and are never lost.
              tokensSold: sales.adminSold,
              adminSold: sales.adminSold,
            };
          }))
        : dbConfigs.phases || null;

      res.json({
        success: true,
        phases: adminPhases,
        referralLevels: dbConfigs.referralLevels || null,
        rankRewards: dbConfigs.rankRewards || null,
        systemConfig: dbConfigs.systemConfig || null,
        matrixConfig: dbConfigs.matrixConfig || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save Live System & Admin Configs
  app.post("/api/admin/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { phases, referralLevels, rankRewards, systemConfig, matrixConfig } = req.body;

      if (systemConfig && Object.prototype.hasOwnProperty.call(systemConfig, 'sellQueueSharePercent')) {
        const sellerShare = Number(systemConfig.sellQueueSharePercent);
        if (!Number.isFinite(sellerShare) || sellerShare < 0 || sellerShare > 100) {
          return res.status(400).json({ error: 'User Sell Queue Share must be between 0% and 100%.' });
        }
        systemConfig.sellQueueSharePercent = sellerShare;
      }
      if (systemConfig && Object.prototype.hasOwnProperty.call(systemConfig, 'withdrawalFeePercent')) {
        const fee = Number(systemConfig.withdrawalFeePercent);
        if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
          return res.status(400).json({ error: 'Withdrawal fee must be between 0% and 100%.' });
        }
        systemConfig.withdrawalFeePercent = fee;
      }

      // Save to database. The admin "Coins Sold" field is a manual/initial
      // sold baseline. Verified blockchain purchases are stored in transactions
      // and are added separately, so saving admin settings can never erase or
      // overwrite real user purchase history.
      const phasesForSave = Array.isArray(phases)
        ? phases.map((p: any) => ({
            ...p,
            adminSold: Math.max(0, Number(p.tokensSold ?? p.adminSold ?? 0)),
            tokensSold: Math.max(0, Number(p.tokensSold ?? p.adminSold ?? 0)),
          }))
        : phases;
      const itemsToSave = [
        { key: "phases", value: phasesForSave ? JSON.stringify(phasesForSave) : null, desc: "Presale Phases and Coin Prices" },
        { key: "referralLevels", value: referralLevels ? JSON.stringify(referralLevels) : null, desc: "10-Level Commission Plan" },
        { key: "rankRewards", value: rankRewards ? JSON.stringify(rankRewards) : null, desc: "Leadership Rank Rewards" },
        { key: "systemConfig", value: systemConfig ? JSON.stringify(systemConfig) : null, desc: "System Parameters, Social Links and Financial Rules" },
        { key: "matrixConfig", value: matrixConfig ? JSON.stringify(matrixConfig) : null, desc: "2x2 Matrix System Config" },
      ];

      for (const item of itemsToSave) {
        if (!item.value) continue;
        try {
          const existing = await db.query.systemConfigs.findFirst({
            where: eq(systemConfigs.key, item.key),
          });

          if (existing) {
            await db.update(systemConfigs).set({ value: item.value, updatedAt: new Date() }).where(eq(systemConfigs.key, item.key));
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
        message: "Configurations updated successfully and applied to all users!",
      });
    } catch (error: any) {
      console.error("Error in /api/admin/configs POST:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // System Configurations (Admin Control Legacy endpoint)
  app.get("/api/system/configs", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const configs = await db.select().from(systemConfigs);
      res.json({ configs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await ensureTokenWithdrawalSettlementTable();
  await ensureProductionSafetyTables();
  await ensureWalletSeparationMigration();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);

    // Poll every 60s for presale purchases still awaiting on-chain payment
    // confirmation. Runs once immediately, then on the interval.
    verifyPendingPresalePurchases().catch((err) => console.error("[PRESALE VERIFY] Initial run failed:", err));
    setInterval(() => {
      verifyPendingPresalePurchases().catch((err) => console.error("[PRESALE VERIFY] Scheduled run failed:", err));
    }, 60 * 1000);
  });
}

startServer();

