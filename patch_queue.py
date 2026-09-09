with open("src/App.tsx", "r") as f:
    content = f.read()

target = """    if (p2TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 2, tokensRequested: p2TokensAllocated, tokensSold: 0 });
    if (p3TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 3, tokensRequested: p3TokensAllocated, tokensSold: 0 });
    if (p4TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 4, tokensRequested: p4TokensAllocated, tokensSold: 0 });
    if (p5TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: 'me', phaseNumber: 5, tokensRequested: p5TokensAllocated, tokensSold: 0 });"""

replacement = """    const addressToUse = account || 'Unknown Wallet';
    if (p2TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 2, tokensRequested: p2TokensAllocated, tokensSold: 0 });
    if (p3TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 3, tokensRequested: p3TokensAllocated, tokensSold: 0 });
    if (p4TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 4, tokensRequested: p4TokensAllocated, tokensSold: 0 });
    if (p5TokensAllocated > 0) newQueueEntries.push({ id: Math.random().toString(), userId: addressToUse, phaseNumber: 5, tokensRequested: p5TokensAllocated, tokensSold: 0 });"""

if target in content:
    with open("src/App.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced!")
else:
    print("Target not found")
