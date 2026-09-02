const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<ScreenTwoAssets\s+allocation=\{allocation\}/g,
  "<ScreenTwoAssets\n                  userEarnings={userEarnings}\n                  allocation={allocation}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Passed userEarnings to ScreenTwoAssets');
