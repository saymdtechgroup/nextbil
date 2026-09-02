const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const simulateBuyStr = `
  const handleSimulateExternalBuy = (amount: number) => {
    // Determine current active phase
    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) return; // No active phase
    const currentPhase = phases[activeIdx];
    
    // Total tokens purchased by the external buyer
    // 20% of this goes to fulfilling user queued sell orders
    const userAllocationFulfillment = Math.floor(amount * 0.20);
    let remainingToFulfill = userAllocationFulfillment;
    let earnedUsdt = 0;

    setSellQueue((prevQueue) => {
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
    });

    if (earnedUsdt > 0) {
      setUserEarnings((prev) => ({
        ...prev,
        availableUsdt: prev.availableUsdt + earnedUsdt
      }));
      
      // Update allocation state sold counts for the user
      setAllocation((prev) => {
         const newAlloc = { ...prev };
         const soldTokens = userAllocationFulfillment - remainingToFulfill;
         if (currentPhase.phaseNumber === 2 && newAlloc.p2Tokens) newAlloc.p2Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 3 && newAlloc.p3Tokens) newAlloc.p3Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 4 && newAlloc.p4Tokens) newAlloc.p4Tokens.sold += soldTokens;
         if (currentPhase.phaseNumber === 5 && newAlloc.p5Tokens) newAlloc.p5Tokens.sold += soldTokens;
         return newAlloc;
      });
    }
    
    // Also increase total tokens sold in the phase so it moves forward
    setPhases((prevPhases) => {
      return prevPhases.map((p, idx) => {
        if (idx === activeIdx) {
           return { ...p, tokensSold: Math.min(p.totalSupply, p.tokensSold + amount) };
        }
        return p;
      });
    });
  };
`;

code = code.replace(
  /const handleSimulateFillPhase = \(\) => \{/,
  match => simulateBuyStr + '\n  ' + match
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added simulate buy');
