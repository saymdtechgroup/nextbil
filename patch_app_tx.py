import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """    // Fulfill FIFO Queue via backend
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

replace = """    // Fulfill FIFO Queue via backend
    const processP2PBuy = async () => {
       try {
         // Use a short timeout for this background fetch so it doesn't hang the UI
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 5000);
         
         await fetch('/api/p2p/process-buy', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             buyerAddress: account || 'Unknown',
             usdAmount: userAllocationFulfillment
           }),
           signal: controller.signal
         });
         clearTimeout(timeoutId);
         fetchSellOrders();
       } catch(e) {
          console.error("Queue fulfill error:", e);
       }
    };
    if (userAllocationFulfillment > 0) processP2PBuy();"""

content = content.replace(target, replace)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patched App.tsx")
