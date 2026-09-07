const fs = require('fs');
let code = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');

// Remove NXBUSD_CONTRACT import
code = code.replace(/NXBUSD_CONTRACT,\s*/g, '');

// Change state to hardcoded USDT
code = code.replace(/const \[currency, setCurrency\] = useState<'NXBUSD' \| 'USDT'>\('NXBUSD'\);/g, "const currency = 'USDT';");

// Remove setCurrency calls
code = code.replace(/setCurrency\('USDT'\);?/g, '');
code = code.replace(/setCurrency\('NXBUSD'\);?/g, '');

// Remove NXBUSD references in balance checks
code = code.replace(/currency === 'NXBUSD' \? NXBUSD_CONTRACT : USDT_CONTRACT/g, "USDT_CONTRACT");
code = code.replace(/currency === 'NXBUSD'/g, "false");
code = code.replace(/currency === 'USDT'/g, "true");

// Replace the UI elements for NXBUSD vs USDT toggle
const toggleRegex = /<div className="grid grid-cols-2 gap-2">[\s\S]*?<\/div>\s*\{\/\* Insufficient Balance Callout/g;
code = code.replace(toggleRegex, '{/* Insufficient Balance Callout');

// Also remove the "Pay Directly with USDT" and "Pay with NXBUSD" buttons block
const innerButtonsRegex = /\{true && usdtBalance >= usdValue && \([\s\S]*?Pay Directly with USDT[\s\S]*?\}\)/g;
code = code.replace(innerButtonsRegex, '');

const innerButtonsRegex2 = /\{false && nxbusdBalance >= usdValue && \([\s\S]*?Pay with NXBUSD[\s\S]*?\}\)/g;
code = code.replace(innerButtonsRegex2, '');

const swapRegex = /\{onOpenSwapModal && \([\s\S]*?Swap USDT ➔ NXBUSD[\s\S]*?\}\)/g;
code = code.replace(swapRegex, '');

// The NXBUSD check logic 
code = code.replace(/\/\/ When paying with NXBUSD[\s\S]*?Falling back to In-App NXBUSD balance[\s\S]*?\}/g, '');

fs.writeFileSync('src/components/BuyTokenModal.tsx', code);
