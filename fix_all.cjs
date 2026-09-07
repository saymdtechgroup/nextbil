const fs = require('fs');

// Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/export default App;\s*$/g, '');
app = app.replace(/fetchOnChainTokenBalance\(walletAddress\)/g, 'fetchOnChainTokenBalance(NXBC_CONTRACT, walletAddress)');
fs.writeFileSync('src/App.tsx', app);

// Fix BuyTokenModal.tsx
let buyModal = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');
buyModal = buyModal.replace(/fetchOnChainTokenBalance\(walletAddress\)/g, 'fetchOnChainTokenBalance(NXBC_CONTRACT, walletAddress)');
buyModal = buyModal.replace(/window\.ethereum/g, '(window as any).ethereum');
buyModal = buyModal.replace(/window\.trustwallet/g, '(window as any).trustwallet');
// executeSmartContractBuy
buyModal = buyModal.replace(/executeSmartContractBuy\(walletAddress \|\| '', usdValue\)/g, 'executeSmartContractBuy(walletAddress || "", contractAddress || "", usdValue, p2Percent, p3Percent, p4Percent, p5Percent, dexPercent, unallocatedPercent)');
fs.writeFileSync('src/components/BuyTokenModal.tsx', buyModal);

// Fix ScreenOneAcquisition.tsx
let screenOne = fs.readFileSync('src/components/ScreenOneAcquisition.tsx', 'utf8');
screenOne = screenOne.replace(/interface ScreenOneProps \{/g, 'interface ScreenOneProps {\n  onOpenWalletConnect?: () => void;\n  nxbcBalance?: number;');
fs.writeFileSync('src/components/ScreenOneAcquisition.tsx', screenOne);

// Empty SwapModal.tsx
fs.writeFileSync('src/components/SwapModal.tsx', 'export const SwapModal = () => null;');

