const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /<AdminPanelModal([\s\S]*?)onSimulateFillPhase=\{handleSimulateFillPhase\}/,
  (match, p1) => `<AdminPanelModal${p1}onSimulateFillPhase={handleSimulateFillPhase}\n        onSimulateExternalBuy={handleSimulateExternalBuy}`
);
fs.writeFileSync('src/App.tsx', code);
console.log('Passed onSimulateExternalBuy');
