import re

with open("src/App.tsx", "r") as f:
    content = f.read()

user_fetch_logic = """
  // Sync User Stats from PostgreSQL Database
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!walletAddress) return;
      try {
        const res = await fetch(`/api/users/${walletAddress}`);
        const data = await res.json();
        if (data && data.user) {
          setTotalInvestedUsd(data.user.totalInvestedUsdt || 0);
          setClaimableIncomeUsd(data.user.availableUsdt || 0);
          
          // Optionally calculate matrix specific income from earnings if needed, 
          // For now we map totalEarned to a mix or keep them separate.
          
          if (data.transactions) {
            const mappedTxs = data.transactions.map((t: any) => ({
              id: `tx-${t.id}`,
              type: t.type === 'buy_presale' ? 'buy' : 'income',
              title: t.type === 'buy_presale' ? `Purchase (${t.tokenAmount} NXBC)` : 'Income',
              amountTokens: t.tokenAmount,
              amountUsd: t.amountUsdt,
              timestamp: new Date(t.createdAt).toLocaleString(),
              status: t.status,
              txHash: t.txHash || '',
              phase: `Phase ${t.phaseIndex}`
            }));
            setTransactions(mappedTxs);
          }
        }
      } catch (err) {
        console.error("Failed to sync user stats from DB:", err);
      }
    };
    
    fetchUserStats();
    const interval = setInterval(fetchUserStats, 5000);
    return () => clearInterval(interval);
  }, [walletAddress]);
"""

# Insert right before the handleConfirmPurchase
content = re.sub(r'  // Purchase handler', user_fetch_logic + '\n  // Purchase handler', content)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Patched user fetch logic")
