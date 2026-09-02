const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /onSimulateFillPhase=\{handleSimulateFillPhase\}/g,
  "onSimulateFillPhase={handleSimulateFillPhase}\n                  onSimulateExternalBuy={handleSimulateExternalBuy}"
);
fs.writeFileSync('src/App.tsx', code);
console.log('Passed to SecretAdminPage');
