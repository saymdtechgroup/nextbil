const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/fetchOnChainTokenBalance\(USDT_CONTRACT,\s*NXBC_CONTRACT,\s*walletAddress\),/g, 'fetchOnChainTokenBalance(USDT_CONTRACT, walletAddress),');

fs.writeFileSync('src/App.tsx', code);
