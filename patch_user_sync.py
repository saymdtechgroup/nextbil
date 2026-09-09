import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """  const fetchSellOrders = async () => {
    try {
      const res = await fetch('/api/p2p/orders');
      if (res.ok) {
         const data = await res.json();
         if (data.orders) {
            const mappedQueue = data.orders.map((o: any) => ({
               id: o.id.toString(),
               userId: o.walletAddress || 'Unknown',
               phaseNumber: o.phaseNumber,
               tokensRequested: o.amountTokens,
               tokensSold: o.amountTokens - o.remainingTokens
            }));
            setSellQueue(mappedQueue);
         }
      }
    } catch (e) {
      console.error("Failed to fetch sell orders", e);
    }
  };"""

replace = """  const fetchSellOrders = async () => {
    try {
      const res = await fetch('/api/p2p/orders');
      if (res.ok) {
         const data = await res.json();
         if (data.orders) {
            const mappedQueue = data.orders.map((o: any) => ({
               id: o.id.toString(),
               userId: o.walletAddress || 'Unknown',
               phaseNumber: o.phaseNumber,
               tokensRequested: o.amountTokens,
               tokensSold: o.amountTokens - o.remainingTokens
            }));
            setSellQueue(mappedQueue);
         }
      }
      
      // Also sync user balances to reflect P2P fulfillment or rank rewards
      if (walletConnected && walletAddress) {
         const syncRes = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
         });
         if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.user) {
               setUserEarnings({
                  availableUsdt: syncData.user.availableUsdt || 0,
                  withdrawnUsdt: syncData.user.totalWithdrawnUsdt || 0
               });
               if (syncData.user.referralCode) {
                  setUserRefCode(syncData.user.referralCode);
               }
            }
         }
      }
    } catch (e) {
      console.error("Failed to fetch sell orders", e);
    }
  };"""

content = content.replace(target, replace)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Added user balance sync to fetchSellOrders")
