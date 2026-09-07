const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenOneAcquisition.tsx', 'utf8');

code = code.replace(/onOpenWalletModal: \(\) => void;/g, 'onOpenWalletModal: () => void;\n  nxbcBalance?: number;');
code = code.replace(/onOpenWalletModal,/g, 'onOpenWalletModal,\n  nxbcBalance = 0,');

fs.writeFileSync('src/components/ScreenOneAcquisition.tsx', code);
