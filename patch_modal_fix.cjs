const fs = require('fs');
let code = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');

// The issue is an empty set of closing tags that resulted from the regex replacement.
// Let's clean it up.
code = code.replace(
  /\{\/\* Close Button \*\/\}\s*<\/div>\s*<\/div>\s*\{\/\* Amount Input \*\/\}/,
  "{/* Close Button */}\n\n            {/* Amount Input */}"
);

fs.writeFileSync('src/components/BuyTokenModal.tsx', code);
console.log('Fixed BuyTokenModal syntax');
