import re

with open("server.ts", "r") as f:
    content = f.read()

# Add admin queue update endpoint
target = """  // Admin Dashboard - Start"""
replace = """  // Admin update sell queue manually
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
  });

  // Process P2P Buy (Fulfill FIFO Queue)
  app.post("/api/p2p/process-buy", async (req, res) => {
    try {
      const { buyerAddress, usdAmount } = req.body;
      let remainingUsdToSpend = Number(usdAmount);
      
      const openOrders = await db.select().from(sellOrders).where(eq(sellOrders.status, 'open')).orderBy(asc(sellOrders.createdAt));
      
      for (const order of openOrders) {
         if (remainingUsdToSpend <= 0) break;
         
         const orderValueUsd = order.remainingTokens * order.tokenPrice;
         let usdtSpentOnThisOrder = 0;
         let tokensBoughtFromThisOrder = 0;
         
         if (remainingUsdToSpend >= orderValueUsd) {
            usdtSpentOnThisOrder = orderValueUsd;
            tokensBoughtFromThisOrder = order.remainingTokens;
            remainingUsdToSpend -= orderValueUsd;
            
            await db.update(sellOrders).set({
               remainingTokens: 0,
               status: 'completed'
            }).where(eq(sellOrders.id, order.id));
         } else {
            usdtSpentOnThisOrder = remainingUsdToSpend;
            tokensBoughtFromThisOrder = usdtSpentOnThisOrder / order.tokenPrice;
            remainingUsdToSpend = 0;
            
            await db.update(sellOrders).set({
               remainingTokens: order.remainingTokens - tokensBoughtFromThisOrder
            }).where(eq(sellOrders.id, order.id));
         }
         
         // Credit the seller with the USDT they earned
         const seller = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
         if (seller) {
            await db.update(users).set({
               totalEarnedUsdt: (seller.totalEarnedUsdt || 0) + usdtSpentOnThisOrder,
               availableUsdt: (seller.availableUsdt || 0) + usdtSpentOnThisOrder
            }).where(eq(users.id, seller.id));
            
            await db.insert(levelEarnings).values({
               beneficiaryId: seller.id,
               sourceUserId: seller.id,
               levelNumber: 0,
               percentage: 0,
               commissionUsdt: usdtSpentOnThisOrder,
               txType: 'p2p_sell_fulfilled'
            });
         }
      }
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  // Admin Dashboard - Start"""
content = content.replace(target, replace)

with open("server.ts", "w") as f:
    f.write(content)

print("Updated server with sell queue endpoints")
