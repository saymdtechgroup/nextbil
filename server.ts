import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { users, matrixNodes, levelEarnings, transactions, sellOrders, systemConfigs, tokenSellLedgers, rankAchievements } from "./src/db/schema.ts";
import { eq, desc, asc, and, or } from "drizzle-orm";
import { ethers } from "ethers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

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
const DEFAULT_PRESALE_ADDRESS = "0x4Bc1a2f057FF9a036b8C27a90f7C7F403dC85cae";
const DEFAULT_ADMIN_WALLET = "0x8d1abCa8Cf0f42799b9a76254710e979bd59c261";

function settlementEndpointsEnabled(): boolean {
  return process.env.ENABLE_UNVERIFIED_INTERNAL_SETTLEMENTS === "true";
}

async function verifyPresalePurchaseOnChain(params: {
  txHash: string;
  buyer: string;
  usdtAmount: number;
  nxbcAmount: number;
}): Promise<{ ok: boolean; pending?: boolean; error?: string }> {
  const { txHash, buyer, usdtAmount, nxbcAmount } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { ok: false, error: "Invalid BSC transaction hash." };
  const rpcUrl = process.env.RPC_URL || DEFAULT_BSC_RPC;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
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
  const iface = new ethers.Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
  const usdtRaw = ethers.parseUnits(Number(usdtAmount).toFixed(6), 18);
  const nxbcRaw = ethers.parseUnits(Number(nxbcAmount).toFixed(18), 18);
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
      const value = parsed.args.value as bigint;
      if (log.address.toLowerCase() === usdtAddress && from === buyer.toLowerCase() && to === adminWallet && value >= usdtRaw) usdtPaid = true;
      if (log.address.toLowerCase() === nxbcAddress && from === presaleAddress && to === buyer.toLowerCase() && value >= nxbcRaw) nxbcDelivered = true;
    } catch {}
  }
  if (!usdtPaid) return { ok: false, error: "The BSC transaction does not contain the required USDT payment to the presale treasury." };
  if (!nxbcDelivered) return { ok: false, error: "The BSC transaction does not contain the expected NXBC delivery from the current presale contract." };
  return { ok: true };
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
                const newSold = currentP.tokensSold + Number(tokenAmount);
                if (newSold >= currentP.totalSupply) {
                    phases[activeIdx].tokensSold = currentP.totalSupply;
                    phases[activeIdx].status = 'completed';
                    if (activeIdx + 1 < phases.length) {
                        phases[activeIdx + 1].status = 'active';
                        phases[activeIdx + 1].tokensSold = 0;
                    }
                } else {
                    phases[activeIdx].tokensSold = newSold;
                }
                await db.update(systemConfigs).set({ value: JSON.stringify(phases), updatedAt: new Date() }).where(eq(systemConfigs.key, 'phases'));
                console.log(`[API] Phase progression updated safely in DB. Phase ${currentP.id} Sold: ${newSold}`);
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
                    (upUser.directCount || 0) >= (rank.requiredDirects || 0)) {
                    
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
      await finalizeConfirmedPurchase(user, Number(txRecord.tokenAmount), Number(txRecord.amountUsdt), Number(txRecord.phaseIndex || 1));
      console.log(`[PRESALE VERIFY] Purchase #${txRecord.id} confirmed on-chain and finalized.`);
    } catch (err: any) {
      console.error(`[PRESALE VERIFY] Error checking tx ${txRecord.txHash}:`, err.message);
      // leave as pending — will retry next cycle rather than failing on a transient RPC error
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware for Subdomain / Multi-Domain Payment Bot Access
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
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

      // Update user's availableUsdt in DB
      await db.update(users)
        .set({
          availableUsdt: (user.availableUsdt || 0) + calculatedGross,
          totalEarnedUsdt: (user.totalEarnedUsdt || 0) + calculatedGross,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

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

      const grossAmount = Number(amountUsdt);
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
      const serviceFee = grossAmount * (withdrawalFeePercent / 100);
      const netPayout = Math.max(0, grossAmount - serviceFee);

      // Look up user in database — do NOT auto-create with a pre-loaded balance,
      // an unknown wallet has nothing to withdraw.
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalizedAddress),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found. Nothing to withdraw." });
      }

      // SECURITY: never invent balance to cover a withdrawal request. Only pay
      // out what the ledger actually shows the user has earned/available.
      const currentAvailable = user.availableUsdt || 0;
      if (currentAvailable < grossAmount) {
        return res.status(400).json({
          error: "Insufficient available balance for this withdrawal.",
          availableUsdt: currentAvailable,
          requestedUsdt: grossAmount,
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
        // Prevent replay of an already-consumed NXBC return transaction.
        // A valid on-chain transfer may only authorize one successful settlement.
        // If a payout previously failed before ledger commit, the hash remains reusable.
        try {
          const priorUse = await db.query.tokenSellLedgers.findFirst({
            where: eq(tokenSellLedgers.returnTxHash, tokenReturnTxHash),
          });
          if (priorUse) {
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

        // Verification passed. No ledger mutation is performed yet; it is deferred
        // until the real USDT payout transaction has been broadcast successfully.
      }

      const finalTokensReturned = walletType === 'token_sell'
        ? totalCalculatedTokensToReturn
        : Number(tokensReturned) || 0;

      let txHash = "";
      let executionMode = "simulated_blockchain";

      // Check if real Hot Wallet Private Key is provided in .env
      const rawKey = (process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY || "").trim();
      const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
      const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT

      if (rawKey && (rawKey.length === 64 || rawKey.length === 66)) {
        const formattedKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const wallet = new ethers.Wallet(formattedKey, provider);
          const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, wallet);

          // Convert NET payout amount to 18 decimals after the live Admin-configured fee deduction
          const decimals = 18;
          const parsedAmount = ethers.parseUnits(netPayout.toFixed(4), decimals);

          console.log(`[PAYOUT BOT] Sender Hot Wallet: ${wallet.address}`);
          console.log(`[PAYOUT BOT] Initiating automated ${walletType} payout of Gross: $${grossAmount} | Fee (${withdrawalFeePercent}%): $${serviceFee.toFixed(2)} | Net: $${netPayout.toFixed(2)} USDT to ${walletAddress}...`);
          
          const tx = await usdtContract.transfer(walletAddress, parsedAmount);
          console.log(`[PAYOUT BOT] Real BSC Transaction Broadcasted: https://bscscan.com/tx/${tx.hash}`);
          const payoutReceipt = await tx.wait(1);
          if (!payoutReceipt || payoutReceipt.status !== 1) {
            return res.status(503).json({
              error: "USDT payout transaction was broadcast but did not confirm successfully on BSC.",
              txHash: tx.hash,
              serviceFeePercent: withdrawalFeePercent,
            });
          }
          txHash = tx.hash;
          executionMode = "real_bsc_blockchain";
        } catch (botError: any) {
          console.error("[PAYOUT BOT ERROR] On-chain USDT dispatch failed:", botError.message);
          if (botError.info?.error?.message) {
            console.error("[PAYOUT BOT REASON]:", botError.info.error.message);
          }
          return res.status(503).json({
            error: `USDT payout failed on BSC: ${botError?.message || 'unknown payout error'}`,
            serviceFeePercent: withdrawalFeePercent,
          });
        }
      } else {
        return res.status(503).json({
          error: "USDT payout wallet is not configured. No withdrawal was completed and no fake blockchain hash was generated.",
          serviceFeePercent: withdrawalFeePercent,
        });
      }

      // Only after the real payout has been broadcast do we commit the token-sell
      // ledger changes. This prevents a failed payout from consuming the user's claim.
      if (walletType === 'token_sell') {
        for (const update of pendingLedgerUpdates) {
          await db.update(tokenSellLedgers)
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

      // Record in Transactions Database
      const txTitle = walletType === 'token_sell'
        ? `Token Auto-Sell Settlement Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee)`
        : `MLM & Community Earnings Payout (Net $${netPayout.toFixed(2)} after ${withdrawalFeePercent}% Fee)`;

      const [txRecord] = await db.insert(transactions).values({
        userId: user.id,
        type: 'withdrawal',
        amountUsdt: netPayout,
        tokenAmount: finalTokensReturned,
        tokenPrice: 1.0,
        status: 'completed',
        txHash: txHash,
      }).returning();

      // Deduct available USDT and update withdrawn stats
      const newAvailable = Math.max(0, currentAvailable - grossAmount);
      await db.update(users)
        .set({
          availableUsdt: newAvailable,
          totalWithdrawnUsdt: (user.totalWithdrawnUsdt || 0) + grossAmount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

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
        newAvailableBalance: newAvailable,
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

        return res.json({ user: newUser, isNew: true });
      }

      return res.json({ user: existingUser, isNew: false });
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
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt)).limit(10);
      const userEarnings = await db.select().from(levelEarnings).where(eq(levelEarnings.beneficiaryId, user.id)).orderBy(desc(levelEarnings.createdAt)).limit(10);

      res.json({
        user,
        transactions: userTxs,
        earnings: userEarnings,
      });
    } catch (error: any) {
      console.error("Error in /api/users/:walletAddress:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buy Presale Tokens API (Supports Real Web3 & Direct Payment TxHash)
  app.post("/api/presale/buy", async (req, res) => {
    try {
      const { walletAddress, amountUsdt, tokenAmount, tokenPrice, phaseIndex, txHash } = req.body;
      if (!walletAddress || !amountUsdt || !tokenAmount) {
        return res.status(400).json({ error: "Missing required purchase fields" });
      }

      // --- SERVER-SIDE PRICE & SUPPLY VALIDATION -----------------------------
      // Never trust client-supplied price/amount blindly: recompute against the
      // authoritative active phase config and reject mismatched or oversold buys.
      const configRecord = await db.query.systemConfigs.findFirst({
        where: eq(systemConfigs.key, 'phases'),
      });

      let activePhase: any = null;
      if (configRecord && configRecord.value) {
        const phases = JSON.parse(configRecord.value);
        activePhase = phases.find((p: any) => p.status === 'active') || null;
      }

      let liveSystem: any = {};
      try {
        const systemRow = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'systemConfig') });
        if (systemRow?.value) liveSystem = JSON.parse(systemRow.value);
      } catch {}
      if (liveSystem.presalePaused === true) return res.status(403).json({ error: 'Presale is currently paused by administrator.' });

      if (!activePhase) {
        return res.status(400).json({ error: "No active presale phase is configured." });
      }

      const activePhasePrice = Number(activePhase.rate ?? activePhase.tokenPrice ?? activePhase.price);
      if (!Number.isFinite(activePhasePrice) || activePhasePrice <= 0) return res.status(500).json({ error: 'Active phase has an invalid token price configuration.' });
      const PRICE_TOLERANCE = 0.0001;
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

      // SECURITY: a syntactically valid tx hash is NOT proof of payment. Verify
      // the real BSC receipt, buyer, exact USDT treasury payment, and exact NXBC
      // delivery from the current presale contract before applying any database
      // side effects (MLM commissions, phase progression, qualification, etc.).
      let purchaseStatus: 'completed' | 'pending_verification' | 'failed' = 'pending_verification';
      const hasValidTxHash = typeof txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(txHash);
      if (hasValidTxHash) {
        const chainCheck = await verifyPresalePurchaseOnChain({
          txHash, buyer: walletAddress, usdtAmount: Number(amountUsdt), nxbcAmount: Number(tokenAmount),
        });
        if (chainCheck.ok) purchaseStatus = 'completed';
        else if (chainCheck.pending) purchaseStatus = 'pending_verification';
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

      // Never allow one real blockchain transaction to create multiple database
      // purchases. A valid tx hash is a one-time settlement proof.
      if (purchaseStatus === 'completed' && txHash) {
        const existingTx = await db.query.transactions.findFirst({ where: eq(transactions.txHash, txHash) });
        if (existingTx) {
          return res.status(409).json({ success: false, error: "This blockchain transaction has already been recorded as a purchase.", transaction: existingTx });
        }
      }

      // Record transaction
      const [tx] = await db.insert(transactions).values({
        userId: user.id,
        type: 'buy_presale',
        amountUsdt: Number(amountUsdt),
        tokenAmount: Number(tokenAmount),
        tokenPrice: activePhasePrice,
        phaseIndex: Number(activePhase.phaseNumber || phaseIndex || 1),
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
        Number(tokenAmount),
        Number(amountUsdt),
        Number(activePhase.phaseNumber || phaseIndex || 1)
      );

      // NOTE: Token delivery now happens ON-CHAIN via the Presale Smart Contract's
      // buyTokens() function (called directly from the user's wallet in BuyTokenModal.tsx).
      // The hot-wallet dispatch below is intentionally DISABLED to avoid double-sending
      // NXBC to the user (once from the contract, once from this backend).
      // Set ENABLE_HOT_WALLET_DISPATCH=true in .env ONLY if you switch back to the
      // direct-transfer (non-contract) purchase flow.
      // At this point purchaseStatus === 'completed', which only happens when
      // hasPlausibleTxHash was true, so `txHash` is guaranteed to hold a real value.
      let tokenDispatchTxHash = txHash;
      const hotWalletDispatchEnabled = process.env.ENABLE_HOT_WALLET_DISPATCH === "true";

      if (hotWalletDispatchEnabled) {
        const privateKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
        const rpcUrl = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
        const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";

        if (privateKey && privateKey.startsWith("0x") && privateKey.length >= 64) {
          try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers.Wallet(privateKey, provider);
            const nxbcContract = new ethers.Contract(nxbcTokenContractAddress, ERC20_ABI, wallet);
            const parsedTokens = ethers.parseUnits(Number(tokenAmount).toString(), 18);

            console.log(`[TOKEN DISPATCH] Transferring ${tokenAmount} NXBC tokens directly to user wallet ${walletAddress}...`);
            const transferTx = await nxbcContract.transfer(walletAddress, parsedTokens);
            console.log(`[TOKEN DISPATCH] Tokens sent on-chain! TxHash: ${transferTx.hash}`);
            tokenDispatchTxHash = transferTx.hash;
          } catch (dispatchErr: any) {
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
        statusNotice: isNowMlmQualified 
          ? "MLM Leader Qualified ($100+ Total Investment)" 
          : `Investor Mode ($${newInvested.toFixed(2)} / $100 USD to qualify for MLM commissions)`
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
         createdAt: sellOrders.createdAt
      })
      .from(sellOrders)
      .leftJoin(users, eq(sellOrders.userId, users.id))
      .where(eq(sellOrders.status, 'open'))
      .orderBy(desc(sellOrders.priority), asc(sellOrders.createdAt));
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

      const confirmedTxHash = txHash || `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;

      if (user) {
        // Record in transactions database
        await db.insert(transactions).values({
          userId: user.id,
          type: 'referral_bonus',
          amountUsdt: Number(amount),
          tokenAmount: Number(amount),
          tokenPrice: 1.0,
          status: 'completed',
          txHash: confirmedTxHash,
        });
      }

      return res.json({
        success: true,
        message: `Instant 1:1 swap executed: ${amount} ${fromToken} ➔ ${amount} ${toToken}`,
        txHash: confirmedTxHash,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Swap execution failed" });
    }
  });

  // Create P2P Sell Order
  app.post("/api/p2p/sell", async (req, res) => {
    if (!settlementEndpointsEnabled()) {
      return res.status(403).json({ success: false, error: "Unverified browser-side P2P sales are disabled. Tokens must be verified on-chain before a financial order is created." });
    }
    try {
      const { walletAddress, amountTokens, tokenPrice } = req.body;
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, walletAddress.toLowerCase()),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const phaseNum = req.body.phaseNumber ? Number(req.body.phaseNumber) : 1;
      let phasePrice = 0;
      try {
        const phaseRow = await db.query.systemConfigs.findFirst({ where: eq(systemConfigs.key, 'phases') });
        const configuredPhases = phaseRow?.value ? JSON.parse(phaseRow.value) : [];
        const matchedPhase = configuredPhases.find((p: any) => Number(p.phaseNumber) === phaseNum);
        phasePrice = Number(matchedPhase?.rate ?? matchedPhase?.tokenPrice ?? 0);
      } catch {}
      const price = Number(tokenPrice ?? phasePrice);
      if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Invalid token price/phase price.' });
      const totalUsdt = Number(amountTokens) * price;
      const maxPriorityRow = await db.select({ priority: sellOrders.priority }).from(sellOrders).orderBy(desc(sellOrders.priority)).limit(1);
      const nextPriority = Number(maxPriorityRow[0]?.priority ?? 0) + 1;
      const [order] = await db.insert(sellOrders).values({
        userId: user.id,
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
        await db.update(sellOrders).set({ priority: orderIds.length - i }).where(eq(sellOrders.id, orderIds[i]));
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
        await db.update(users).set({
          totalEarnedUsdt: Number(user.totalEarnedUsdt || 0) + gross,
          availableUsdt: Number(user.availableUsdt || 0) + gross,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));
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
  // Default PIN is hashed on first use, never stored/compared as plaintext.
  let inMemoryAdminPinHash = hashPin("7788");
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
      const configRecord = await db.query.systemConfigs.findFirst({
        where: eq(systemConfigs.key, "phases"),
      });
      if (!configRecord?.value) {
        return res.json({ success: true, phases: [] });
      }
      const phases = JSON.parse(configRecord.value);
      const safePhases = Array.isArray(phases) ? phases.map((p: any) => ({
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
        targetDate: p.targetDate,
      })) : [];
      res.json({ success: true, phases: safePhases });
    } catch (error: any) {
      console.error("Error in /api/presale/config:", error);
      res.status(500).json({ success: false, error: "Failed to load presale configuration." });
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

      res.json({
        success: true,
        phases: dbConfigs.phases || null,
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

      // Save to database
      const itemsToSave = [
        { key: "phases", value: phases ? JSON.stringify(phases) : null, desc: "Presale Phases and Coin Prices" },
        { key: "referralLevels", value: referralLevels ? JSON.stringify(referralLevels) : null, desc: "10-Level Commission Plan" },
        { key: "rankRewards", value: rankRewards ? JSON.stringify(rankRewards) : null, desc: "Leadership Rank Rewards" },
        { key: "systemConfig", value: systemConfig ? JSON.stringify(systemConfig) : null, desc: "System Parameters" },
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

