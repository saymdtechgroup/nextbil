const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenTwoAssets.tsx', 'utf8');

code = code.replace(
  /interface ScreenTwoAssetsProps \{/,
  "import { UserEarnings } from '../types/crypto';\n\ninterface ScreenTwoAssetsProps {\n  userEarnings?: UserEarnings;"
);

code = code.replace(
  /export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = \(\{/,
  "export const ScreenTwoAssets: React.FC<ScreenTwoAssetsProps> = ({\n  userEarnings,"
);

// We need to replace the static token display with the new allocation fields:
// allocation.p2Tokens?.allocated, allocation.p2Tokens?.sold
code = code.replace(
  /\{showValues \? \`\$\{p2Tokens.toLocaleString\(\)\} NXBC\` : '••••'\}/,
  "{showValues ? `${(allocation.p2Tokens?.allocated || p2Tokens).toLocaleString()} NXBC (Sold: ${allocation.p2Tokens?.sold || 0})` : '••••'}"
);
code = code.replace(
  /\{showValues \? \`\$\{p3Tokens.toLocaleString\(\)\} NXBC\` : '••••'\}/,
  "{showValues ? `${(allocation.p3Tokens?.allocated || p3Tokens).toLocaleString()} NXBC (Sold: ${allocation.p3Tokens?.sold || 0})` : '••••'}"
);
code = code.replace(
  /\{showValues \? \`\$\{p4Tokens.toLocaleString\(\)\} NXBC\` : '••••'\}/,
  "{showValues ? `${(allocation.p4Tokens?.allocated || p4Tokens).toLocaleString()} NXBC (Sold: ${allocation.p4Tokens?.sold || 0})` : '••••'}"
);
code = code.replace(
  /\{showValues \? \`\$\{p5Tokens.toLocaleString\(\)\} NXBC\` : '••••'\}/,
  "{showValues ? `${(allocation.p5Tokens?.allocated || p5Tokens).toLocaleString()} NXBC (Sold: ${allocation.p5Tokens?.sold || 0})` : '••••'}"
);

fs.writeFileSync('src/components/ScreenTwoAssets.tsx', code);
console.log('ScreenTwoAssets updated');
