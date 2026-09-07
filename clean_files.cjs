const fs = require('fs');

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/\/\/ 2-Token Balances: NXBUSD \(\$1\.00 Utility Token\) \& USDT \(BEP-20\)/g, '// Token Balances');
app = app.replace(/\/\/ Preserve in-app swapped NXBUSD balance so it is not wiped out if on-chain contract returns 0/g, '');
app = app.replace(/\{\/\* 1:1 USDT ⮂ NXBUSD Swap Modal \*\/\}/g, '');
fs.writeFileSync('src/App.tsx', app);

// web3Helper.ts
let web3 = fs.readFileSync('src/utils/web3Helper.ts', 'utf8');
web3 = web3.replace(/export const NXBUSD_CONTRACT = '0xbEFB5857cd4309a4a64f92Dd67507c34fCbca78b';/g, '');
web3 = web3.replace(/currency: 'USDT' \| 'NXBUSD',/g, '');
web3 = web3.replace(/const tokenContractAddress = currency === 'NXBUSD' \? NXBUSD_CONTRACT : USDT_CONTRACT;/g, 'const tokenContractAddress = USDT_CONTRACT;');
fs.writeFileSync('src/utils/web3Helper.ts', web3);

// BuyTokenModal.tsx
let buy = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');
buy = buy.replace(/currency\?: 'NXBUSD' \| 'USDT'/g, '');
buy = buy.replace(/Please Swap USDT to NXBUSD first\./g, '');
buy = buy.replace(/Please convert USDT to NXBUSD first\./g, '');
fs.writeFileSync('src/components/BuyTokenModal.tsx', buy);

// ScreenThreeWallet.tsx
let s3 = fs.readFileSync('src/components/ScreenThreeWallet.tsx', 'utf8');
s3 = s3.replace(/NXBUSD_CONTRACT,/g, '');
s3 = s3.replace(/const res = await addTokenToWallet\(NXBUSD_CONTRACT, 'NXBUSD', 18\);/g, '');
s3 = s3.replace(/Display your NXBC Coins \& NXBUSD directly in your wallet/g, 'Display your NXBC Coins directly in your wallet');
s3 = s3.replace(/<span>\+ NXBUSD<\/span>/g, '');
fs.writeFileSync('src/components/ScreenThreeWallet.tsx', s3);

// TeamPlanModal.tsx
let tpm = fs.readFileSync('src/components/TeamPlanModal.tsx', 'utf8');
tpm = tpm.replace(/Pure USDT \/ NXBUSD Payout/g, 'Pure USDT Payout');
fs.writeFileSync('src/components/TeamPlanModal.tsx', tpm);

