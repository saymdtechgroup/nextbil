import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove localStorage logic for sellQueue
state_target = """  const [sellQueue, setSellQueue] = useState<QueueEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_sell_queue');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return [];
  });"""
state_replace = """  const [sellQueue, setSellQueue] = useState<QueueEntry[]>([]);
  
  // Fetch Live P2P Sell Orders
  const fetchSellOrders = async () => {
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
  };

  useEffect(() => {
    fetchSellOrders();
    const interval = setInterval(fetchSellOrders, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);"""
content = content.replace(state_target, state_replace)

eff_target = """  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_sell_queue', JSON.stringify(sellQueue));
    }
  }, [sellQueue]);"""
eff_replace = """  // (Removed local storage effect for sellQueue)"""
content = content.replace(eff_target, eff_replace)

alloc_target = """    // Add to global sell queue
    const newQueueEntries = [];
    const addressToUse = account || 'Unknown Wallet';
    if (p2TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 2, tokensRequested: p2TokensAllocated, tokensSold: 0 });
    if (p3TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 3, tokensRequested: p3TokensAllocated, tokensSold: 0 });
    if (p4TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 4, tokensRequested: p4TokensAllocated, tokensSold: 0 });
    if (p5TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 5, tokensRequested: p5TokensAllocated, tokensSold: 0 });

    setSellQueue(prev => [...prev, ...newQueueEntries]);"""

alloc_replace = """    // Add to global sell queue via Backend API
    const addressToUse = account || 'Unknown Wallet';
    const postOrders = async () => {
       const ordersToPost = [];
       if (p2TokensAllocated > 0) ordersToPost.push({ phaseNumber: 2, amountTokens: p2TokensAllocated, tokenPrice: 0.15 });
       if (p3TokensAllocated > 0) ordersToPost.push({ phaseNumber: 3, amountTokens: p3TokensAllocated, tokenPrice: 0.20 });
       if (p4TokensAllocated > 0) ordersToPost.push({ phaseNumber: 4, amountTokens: p4TokensAllocated, tokenPrice: 0.25 });
       if (p5TokensAllocated > 0) ordersToPost.push({ phaseNumber: 5, amountTokens: p5TokensAllocated, tokenPrice: 0.30 });
       
       for (const order of ordersToPost) {
          try {
            await fetch('/api/p2p/sell', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: addressToUse,
                amountTokens: order.amountTokens,
                tokenPrice: order.tokenPrice,
                phaseNumber: order.phaseNumber
              })
            });
          } catch (e) {
            console.error(e);
          }
       }
       fetchSellOrders(); // refresh after posting
    };
    if (account) postOrders();"""
content = content.replace(alloc_target, alloc_replace)

admin_target = """  const handleUpdateSellQueue = (newQueue: QueueEntry[]) => {
    setSellQueue(newQueue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_sell_queue', JSON.stringify(newQueue));
    }
  };"""
admin_replace = """  const handleUpdateSellQueue = async (newQueue: QueueEntry[]) => {
    // We only update locally to reflect immediately, but this function is likely not going to persist correctly if the admin panel modifies it without an API
    setSellQueue(newQueue);
    
    // Send bulk update to backend
    try {
      await fetch('/api/admin/sellqueue/update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ queue: newQueue })
      });
      fetchSellOrders();
    } catch(e) {}
  };"""
content = content.replace(admin_target, admin_replace)

# Now wait, when someone buys, it calls handleP2PBuy
p2p_target = """    setSellQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      let queueUpdated = false;

      for (let i = 0; i < newQueue.length; i++) {
        const entry = newQueue[i];
        if (entry.tokensSold < entry.tokensRequested) {
          const remainingInEntry = entry.tokensRequested - entry.tokensSold;
          const toFulfill = Math.min(remainingInEntry, remainingToFulfill);
          
          newQueue[i] = {
            ...entry,
            tokensSold: entry.tokensSold + toFulfill
          };
          
          remainingToFulfill -= toFulfill;
          
          // Calculate earnings for the seller
          let phasePrice = 0.15; // default
          if (entry.phaseNumber === 2) phasePrice = 0.15;
          if (entry.phaseNumber === 3) phasePrice = 0.20;
          if (entry.phaseNumber === 4) phasePrice = 0.25;
          if (entry.phaseNumber === 5) phasePrice = 0.30;
          
          earnedUsdt += toFulfill * phasePrice;
          queueUpdated = true;

          if (remainingToFulfill <= 0) break;
        }
      }

      if (queueUpdated) {
        // Find seller to credit them in local storage
        if (typeof window !== 'undefined') {
          // This is a naive simulation. In a real app, this updates the seller's specific account
          // Since we are mocking P2P, we just credit the current user for demonstration if they own the order
          // Or we skip it. We'll just update the current user's available balance if it's their order
        }
      }

      return newQueue;
    });"""

p2p_replace = """    // Call backend to process P2P Buy
    const processP2PBuy = async () => {
       try {
         await fetch('/api/p2p/process-buy', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             buyerAddress: account || 'Unknown',
             usdAmount: userAllocationFulfillment
           })
         });
         fetchSellOrders();
       } catch(e) {}
    };
    processP2PBuy();"""
content = content.replace(p2p_target, p2p_replace)


with open("src/App.tsx", "w") as f:
    f.write(content)

print("Updated App.tsx")
