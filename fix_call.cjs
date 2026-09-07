const fs = require('fs');

// BuyTokenModal.tsx
let buyModal = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');
buyModal = buyModal.replace(/const result = await executeSmartContractBuy\(\n          'USDT',\n          usdValue,/g, `const result = await executeSmartContractBuy(
          usdValue,`);
fs.writeFileSync('src/components/BuyTokenModal.tsx', buyModal);

// ScreenThreeWallet.tsx
let screen3 = fs.readFileSync('src/components/ScreenThreeWallet.tsx', 'utf8');
screen3 = screen3.replace(/const res = await addTokenToWallet\('NXBUSD', 18\);/g, ''); // just in case
screen3 = screen3.replace(/const res = await addTokenToWallet\('', 'NXBUSD', 18\);/g, ''); 
screen3 = screen3.replace(/const res = await addTokenToWallet\(\n\s*'NXBUSD', 18\);/g, ''); 
fs.writeFileSync('src/components/ScreenThreeWallet.tsx', screen3);
