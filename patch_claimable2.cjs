const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /claimableBalanceUsd=\{claimableBalanceUsd\}/g,
  "claimableBalanceUsd={claimableBalanceUsd + (userEarnings?.availableUsdt || 0)}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('claimableBalanceUsd passed successfully');
