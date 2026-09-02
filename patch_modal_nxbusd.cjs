const fs = require('fs');
let code = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');

const regex = /<button[\s\S]*?onClick=\{\(\) => setCurrency\('USDT'\)\}[\s\S]*?<\/button>/;
code = code.replace(regex, "");

const autoConvertRegex = /\{currency === 'USDT' && \([\s\S]*?<\/div>[\s\S]*?\)\}/;
code = code.replace(autoConvertRegex, "");

fs.writeFileSync('src/components/BuyTokenModal.tsx', code);
console.log('Removed USDT from BuyTokenModal');
