const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenOneAcquisition.tsx', 'utf8');

// Remove nxbusdBalance prop
code = code.replace(/nxbusdBalance = 0,/g, '');
code = code.replace(/nxbusdBalance\?: number;/g, '');

// The block for NXBUSD Balance (Fuel)
const nxbusdBlock = /\{\/\* NXBUSD Balance \(Fuel\) \*\/\}[\s\S]*?<\/div>\s*<\/div>/g;
code = code.replace(nxbusdBlock, '');

// Re-add the closing div for the grid
code = code.replace(/<div className="grid grid-cols-3 gap-2">\s*(?:\{\/\* .*? \*\/\}[\s\S]*?)*$/g, '<div className="grid grid-cols-2 gap-2">');

// Flow text
code = code.replace(/Flow: <strong>USDT<\/strong> ➔ <strong>NXBUSD \(1:1\)<\/strong> ➔ <strong>Buy NXBC/g, 'Flow: <strong>USDT</strong> ➔ <strong>Buy NXBC');

// Fix grid-cols-3 to grid-cols-2 if nxbusd is removed
code = code.replace(/className="grid grid-cols-3 gap-2"/g, 'className="grid grid-cols-2 gap-2"');

fs.writeFileSync('src/components/ScreenOneAcquisition.tsx', code);
