import re

with open("server.ts", "r") as f:
    content = f.read()

# 1. Update /api/p2p/orders to sort by priority DESC, createdAt ASC
t1 = """      const orders = await db.select({
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
      .orderBy(asc(sellOrders.createdAt));"""

r1 = """      const orders = await db.select({
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
      .orderBy(desc(sellOrders.priority), asc(sellOrders.createdAt));"""
content = content.replace(t1, r1)

# 2. Update /api/admin/sellqueue/update to save priority based on array position
t2 = """  // Admin update sell queue manually
  app.post("/api/admin/sellqueue/update", async (req, res) => {
    try {
      const { queue } = req.body;
      for (const entry of queue) {
         if (entry.id) {
           await db.update(sellOrders).set({
             remainingTokens: entry.tokensRequested - entry.tokensSold,
             status: (entry.tokensRequested - entry.tokensSold) <= 0 ? 'completed' : 'open'
           }).where(eq(sellOrders.id, Number(entry.id)));
         }
      }
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.toString() });
    }
  });"""

r2 = """  // Admin update sell queue manually
  app.post("/api/admin/sellqueue/update", async (req, res) => {
    try {
      const { queue } = req.body;
      // Reverse iterate to give higher priority to top items
      const total = queue.length;
      for (let i = 0; i < queue.length; i++) {
         const entry = queue[i];
         if (entry.id) {
           await db.update(sellOrders).set({
             remainingTokens: entry.tokensRequested - entry.tokensSold,
             status: (entry.tokensRequested - entry.tokensSold) <= 0 ? 'completed' : 'open',
             priority: total - i // The lower the index, the higher the priority
           }).where(eq(sellOrders.id, Number(entry.id)));
         }
      }
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  // Admin Instant Fulfill Specific Order
  app.post("/api/admin/sellqueue/instant-fulfill", async (req, res) => {
     try {
        const { orderId } = req.body;
        const order = await db.query.sellOrders.findFirst({ where: eq(sellOrders.id, Number(orderId)) });
        
        if (!order || order.status === 'completed' || order.remainingTokens <= 0) {
           return res.status(400).json({ error: "Order already completed or invalid" });
        }
        
        const usdToPay = order.remainingTokens * order.tokenPrice;
        
        // Mark order completed
        await db.update(sellOrders).set({
           remainingTokens: 0,
           status: 'completed'
        }).where(eq(sellOrders.id, order.id));
        
        // Pay User
        const seller = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
        if (seller) {
           await db.update(users).set({
              totalEarnedUsdt: (seller.totalEarnedUsdt || 0) + usdToPay,
              availableUsdt: (seller.availableUsdt || 0) + usdToPay
           }).where(eq(users.id, seller.id));
           
           await db.insert(levelEarnings).values({
              beneficiaryId: seller.id,
              sourceUserId: seller.id,
              levelNumber: 0,
              percentage: 0,
              commissionUsdt: usdToPay,
              txType: 'instant_sell_fulfilled'
           });
        }
        res.json({ success: true });
     } catch (e) {
        res.status(500).json({ error: e.toString() });
     }
  });"""
content = content.replace(t2, r2)

# 3. Process P2P Buy sort order
t3 = """      const openOrders = await db.select().from(sellOrders).where(eq(sellOrders.status, 'open')).orderBy(asc(sellOrders.createdAt));"""
r3 = """      const openOrders = await db.select().from(sellOrders).where(eq(sellOrders.status, 'open')).orderBy(desc(sellOrders.priority), asc(sellOrders.createdAt));"""
content = content.replace(t3, r3)

with open("server.ts", "w") as f:
    f.write(content)
print("Updated server.ts for priority & instant fulfill")
