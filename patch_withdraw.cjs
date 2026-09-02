const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const withdrawReplacement = `
  const handleWithdraw = (amountUsd: number) => {
    let remainingToDeduct = amountUsd;
    
    setUserEarnings(prev => {
      if (prev.availableUsdt >= remainingToDeduct) {
        return {
          availableUsdt: prev.availableUsdt - remainingToDeduct,
          withdrawnUsdt: prev.withdrawnUsdt + remainingToDeduct
        };
      } else {
        remainingToDeduct -= prev.availableUsdt;
        return {
          availableUsdt: 0,
          withdrawnUsdt: prev.withdrawnUsdt + prev.availableUsdt
        };
      }
    });

    setClaimableBalanceUsd((prev) => Math.max(0, prev - remainingToDeduct));
    
    const newTx: Transaction = {
      id: \`tx-\${Date.now()}\`,
      type: 'withdrawal',
      title: 'Guaranteed OTC Smart Contract Payout',
      amountUsd: amountUsd,
      timestamp: 'Just now',
      status: 'completed',
      txHash: \`0x\${Math.random().toString(16).substring(2, 8)}...\${Math.random().toString(16).substring(2, 6)}\`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };
`;

code = code.replace(
  /const handleWithdraw = \(amountUsd: number\) => \{[\s\S]*?setTransactions\(\(prev\) => \[newTx, \.\.\.prev\]\);\n  \};/,
  withdrawReplacement
);

fs.writeFileSync('src/App.tsx', code);
console.log('handleWithdraw updated');
