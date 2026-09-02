const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const claimableBalanceUsd = levelIncomeUsd \+ matrixIncomeUsd;/,
  "const claimableBalanceUsd = levelIncomeUsd + matrixIncomeUsd + userEarnings.availableUsdt;"
);

fs.writeFileSync('src/App.tsx', code);
console.log('claimableBalanceUsd updated');
