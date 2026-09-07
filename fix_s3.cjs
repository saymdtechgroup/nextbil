const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenThreeWallet.tsx', 'utf8');

const targetBlock = `const handleAddNxbusdToTrustWallet = async () => {
    
    setTokenImportNotice(res.message || 'Token import triggered in wallet.');
    setTimeout(() => setTokenImportNotice(null), 5000);
  };`;

code = code.replace(targetBlock, '');

// also remove where it's used
const usedRegex = /<button\s*onClick=\{handleAddNxbusdToTrustWallet\}[\s\S]*?<\/button>/g;
code = code.replace(usedRegex, '');

fs.writeFileSync('src/components/ScreenThreeWallet.tsx', code);
