import re

with open("src/db/schema.ts", "r") as f:
    content = f.read()

users_target = """  totalPurchasedTokens: doublePrecision('total_purchased_tokens').notNull().default(0),"""
users_replace = """  totalDirectVolume: doublePrecision('total_direct_volume').notNull().default(0),
  totalTeamVolume: doublePrecision('total_team_volume').notNull().default(0),
  highestRankAchieved: integer('highest_rank_achieved').notNull().default(0),
  totalPurchasedTokens: doublePrecision('total_purchased_tokens').notNull().default(0),"""

content = content.replace(users_target, users_replace)

table_insert = """// System / Admin Dynamic Config"""
table_replace = """// Rank Achievements
export const rankAchievements = pgTable('rank_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  rankLevel: integer('rank_level').notNull(),
  rewardUsdt: doublePrecision('reward_usdt').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// System / Admin Dynamic Config"""
content = content.replace(table_insert, table_replace)

rel_insert = """  tokenSellLedgers: many(tokenSellLedgers),
}));"""
rel_replace = """  tokenSellLedgers: many(tokenSellLedgers),
  rankAchievements: many(rankAchievements),
}));"""
content = content.replace(rel_insert, rel_replace)

with open("src/db/schema.ts", "w") as f:
    f.write(content)

print("Schema replaced!")
