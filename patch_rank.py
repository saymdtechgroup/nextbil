import re

with open("server.ts", "r") as f:
    content = f.read()

import_target = """import { users, matrixNodes, levelEarnings, transactions, sellOrders, systemConfigs, tokenSellLedgers } from "./src/db/schema.ts";"""
import_replace = """import { users, matrixNodes, levelEarnings, transactions, sellOrders, systemConfigs, tokenSellLedgers, rankAchievements } from "./src/db/schema.ts";"""
content = content.replace(import_target, import_replace)

vol_target = """        .where(eq(users.id, user.id));

      // Direct Sponsor (10%) & 10-Level Commission Distribution Logic (ONLY when user reaches >= $100 Cumulative Investment Threshold)"""

vol_replace = """        .where(eq(users.id, user.id));

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

      // Direct Sponsor (10%) & 10-Level Commission Distribution Logic (ONLY when user reaches >= $100 Cumulative Investment Threshold)"""

content = content.replace(vol_target, vol_replace)

with open("server.ts", "w") as f:
    f.write(content)

print("Rank Reward patched!")
