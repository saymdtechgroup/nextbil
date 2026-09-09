import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """        onUpdateSellQueue={async (newQueue) => {
          const rateMap: Record<number, number> = {
            2: 0.10,
            3: 1.00,
            4: 10.00,
            5: 100.00,
          };
          phases.forEach((p) => {
            if (p.phaseNumber && p.rate) {
              rateMap[p.phaseNumber] = p.rate;
            }
          });

          // Sync fulfillment to PostgreSQL DB for the connected user
          if (account) {
            for (let i = 0; i < newQueue.length; i++) {
              const oldEntry = sellQueue[i];
              const newEntry = newQueue[i];
              if (newEntry && oldEntry && newEntry.tokensSold > oldEntry.tokensSold) {
                const newlySold = newEntry.tokensSold - oldEntry.tokensSold;
                const phasePrice = rateMap[newEntry.phaseNumber] || 0.10;
                const grossUsdt = newlySold * phasePrice;
                try {
                  await fetch('/api/wallet/token-sell-ledger/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      walletAddress: account,
                      phaseIndex: newEntry.phaseNumber,
                      phaseName: `Phase ${newEntry.phaseNumber}`,
                      tokenPrice: phasePrice,
                      tokensSold: newlySold,
                      grossUsdt: grossUsdt
                    })
                  });
                } catch (e) {
                  console.error("DB Sync Error:", e);
                }
              }
            }
          }

          setSellQueue(newQueue);
          if (typeof window !== 'undefined') localStorage.setItem('nxbc_sell_queue', JSON.stringify(newQueue));

          // Compute total fulfilled USDT based on phase rates
          let totalEarnedUsdt = 0;
          let p2Sold = 0;
          let p3Sold = 0;
          let p4Sold = 0;
          let p5Sold = 0;

          for (let i = 0; i < newQueue.length; i++) {
            const oldEntry = sellQueue[i];
            const newEntry = newQueue[i];
            
            if (newEntry && oldEntry && newEntry.tokensSold > oldEntry.tokensSold) {
              const newlySold = newEntry.tokensSold - oldEntry.tokensSold;
              const phasePrice = rateMap[newEntry.phaseNumber] || 0.10;
              
              if (newEntry.phaseNumber === 2) p2Sold += newlySold;
              if (newEntry.phaseNumber === 3) p3Sold += newlySold;
              if (newEntry.phaseNumber === 4) p4Sold += newlySold;
              if (newEntry.phaseNumber === 5) p5Sold += newlySold;

              totalEarnedUsdt += newlySold * phasePrice;
            }
          }

          if (totalEarnedUsdt > 0) {
            setUserEarnings((prev) => ({
              ...prev,
              availableUsdt: prev.availableUsdt + totalEarnedUsdt
            }));
            
            setAllocation((prev) => ({
              ...prev,
              p2Tokens: { ...prev.p2Tokens, sold: (prev.p2Tokens?.sold || 0) + p2Sold },
              p3Tokens: { ...prev.p3Tokens, sold: (prev.p3Tokens?.sold || 0) + p3Sold },
              p4Tokens: { ...prev.p4Tokens, sold: (prev.p4Tokens?.sold || 0) + p4Sold },
              p5Tokens: { ...prev.p5Tokens, sold: (prev.p5Tokens?.sold || 0) + p5Sold },
            }));
          }
        }}"""

replace = """        onUpdateSellQueue={async (newQueue) => {
          setSellQueue(newQueue);
          try {
             const res = await fetch('/api/admin/sellqueue/update', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ queue: newQueue })
             });
             if (res.ok) {
                fetchSellOrders(); // Refresh queue
             }
          } catch(e) {}
        }}"""

content = content.replace(target, replace)

# We also need to fix line 1100 logic in handleBuyTokens.
buy_target = """    setSellQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      let queueUpdated = false;

      for (let i = 0; i < newQueue.length; i++) {
        const entry = newQueue[i];
        if (entry.phaseNumber === currentPhase.phaseNumber && entry.tokensSold < entry.tokensRequested) {
          queueUpdated = true;
          const tokensNeeded = entry.tokensRequested - entry.tokensSold;
          if (remainingToFulfill >= tokensNeeded) {
            // Completely fulfill this entry
            remainingToFulfill -= tokensNeeded;
            entry.tokensSold = entry.tokensRequested;
            earnedUsdt += tokensNeeded * currentPhase.rate;
          } else {
            // Partially fulfill
            entry.tokensSold += remainingToFulfill;
            earnedUsdt += remainingToFulfill * currentPhase.rate;
            remainingToFulfill = 0;
            break; // Used up all fulfillment allocation
          }
        }
      }

      return queueUpdated ? newQueue : prevQueue;
    });"""

buy_replace = """    // Fulfill FIFO Queue via backend
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
    if (userAllocationFulfillment > 0) processP2PBuy();"""
content = content.replace(buy_target, buy_replace)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed App.tsx inline functions!")
