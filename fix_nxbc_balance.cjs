const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/nxbcBalance=\{nxbcBalance\}\s*usdtBalance=\{usdtBalance\}\s*nxbcBalance=\{nxbcBalance\}/g, 'nxbcBalance={nxbcBalance}\n                  usdtBalance={usdtBalance}');

fs.writeFileSync('src/App.tsx', code);
