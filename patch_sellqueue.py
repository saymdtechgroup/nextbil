with open("src/App.tsx", "r") as f:
    content = f.read()

target = """        onUpdateSellQueue={(newQueue) => {
          setSellQueue(newQueue);
          if (typeof window !== 'undefined') localStorage.setItem('nxbc_sell_queue', JSON.stringify(newQueue));

          // Compute total fulfilled USDT based on phase rates
          let totalEarnedUsdt = 0;
          let p2Sold = 0;
          let p3Sold = 0;
          let p4Sold = 0;
          let p5Sold = 0;

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

          newQueue.forEach((entry) => {"""

replacement = """        onUpdateSellQueue={async (newQueue) => {
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

          newQueue.forEach((entry) => {"""

if target in content:
    with open("src/App.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced!")
else:
    print("Target not found")
