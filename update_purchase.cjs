const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
    const p2TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p2Percent / 100));
    const p3TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p3Percent / 100));
    const p4TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p4Percent / 100));
    const p5TokensAllocated = Math.floor(tokenAmount * (sellAlloc.p5Percent / 100));

    const updatedAlloc: AllocationState = {
      p2Percent: sellAlloc.p2Percent,
      p3Percent: sellAlloc.p3Percent,
      p4Percent: sellAlloc.p4Percent,
      p5Percent: sellAlloc.p5Percent,
      dexPercent: sellAlloc.dexPercent,
      unallocatedPercent: sellAlloc.unallocatedPercent,
      p2Tokens: {
        allocated: (allocation.p2Tokens?.allocated || 0) + p2TokensAllocated,
        sold: allocation.p2Tokens?.sold || 0,
      },
      p3Tokens: {
        allocated: (allocation.p3Tokens?.allocated || 0) + p3TokensAllocated,
        sold: allocation.p3Tokens?.sold || 0,
      },
      p4Tokens: {
        allocated: (allocation.p4Tokens?.allocated || 0) + p4TokensAllocated,
        sold: allocation.p4Tokens?.sold || 0,
      },
      p5Tokens: {
        allocated: (allocation.p5Tokens?.allocated || 0) + p5TokensAllocated,
        sold: allocation.p5Tokens?.sold || 0,
      },
      totalTokensPurchased: allocation.totalTokensPurchased + tokenAmount,
      isLocked: true,
      lockedTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Add to global sell queue
    const newQueueEntries = [];
    if (p2TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 2, tokensRequested: p2TokensAllocated, tokensSold: 0 });
    if (p3TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 3, tokensRequested: p3TokensAllocated, tokensSold: 0 });
    if (p4TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 4, tokensRequested: p4TokensAllocated, tokensSold: 0 });
    if (p5TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 5, tokensRequested: p5TokensAllocated, tokensSold: 0 });

    setSellQueue(prev => [...prev, ...newQueueEntries]);
`;

code = code.replace(
  /const updatedAlloc: AllocationState = \{[\s\S]*?lockedTimestamp:.*?,?\n    \};/,
  replacement
);

fs.writeFileSync('src/App.tsx', code);
console.log('Purchase updated');
