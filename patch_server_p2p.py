import re

with open("server.ts", "r") as f:
    content = f.read()

target = """      const [order] = await db.insert(sellOrders).values({
        userId: user.id,
        amountTokens: Number(amountTokens),
        remainingTokens: Number(amountTokens),
        tokenPrice: price,
        totalUsdtValue: totalUsdt,
        status: 'open',
      }).returning();"""

replace = """      const phaseNum = req.body.phaseNumber ? Number(req.body.phaseNumber) : 1;
      const [order] = await db.insert(sellOrders).values({
        userId: user.id,
        phaseNumber: phaseNum,
        amountTokens: Number(amountTokens),
        remainingTokens: Number(amountTokens),
        tokenPrice: price,
        totalUsdtValue: totalUsdt,
        status: 'open',
      }).returning();"""

content = content.replace(target, replace)

# also let's fetch the wallet address in the GET /api/p2p/orders
get_target = """      const orders = await db.select().from(sellOrders).where(eq(sellOrders.status, 'open')).orderBy(asc(sellOrders.createdAt));
      res.json({ orders });"""
get_replace = """      const orders = await db.select({
         id: sellOrders.id,
         userId: sellOrders.userId,
         walletAddress: users.walletAddress,
         phaseNumber: sellOrders.phaseNumber,
         amountTokens: sellOrders.amountTokens,
         remainingTokens: sellOrders.remainingTokens,
         tokenPrice: sellOrders.tokenPrice,
         totalUsdtValue: sellOrders.totalUsdtValue,
         status: sellOrders.status,
         createdAt: sellOrders.createdAt
      })
      .from(sellOrders)
      .leftJoin(users, eq(sellOrders.userId, users.id))
      .where(eq(sellOrders.status, 'open'))
      .orderBy(asc(sellOrders.createdAt));
      res.json({ orders });"""
content = content.replace(get_target, get_replace)


with open("server.ts", "w") as f:
    f.write(content)
print("Updated server.ts p2p endpoints")
