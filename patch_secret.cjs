const fs = require('fs');
let code = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

code = code.replace(
  /onUpdateMatrixConfig: \(config: MatrixConfig\) => void;/,
  "onUpdateMatrixConfig: (config: MatrixConfig) => void;\n  onSimulateExternalBuy?: (amount: number) => void;"
);

code = code.replace(
  /onUpdateMatrixConfig,\n/,
  "onUpdateMatrixConfig,\n  onSimulateExternalBuy,\n"
);

const btnStr = `<button
            onClick={() => {
              const amount = prompt("Enter amount of NXBC purchased by an external buyer:", "10000");
              if (amount && !isNaN(Number(amount)) && onSimulateExternalBuy) {
                onSimulateExternalBuy(Number(amount));
              }
            }}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded shadow flex items-center justify-center gap-2 mb-2"
          >
            <RefreshCw className="w-4 h-4" />
            Simulate Ext. Buy
          </button>
          <button`;

code = code.replace(/<button([^>]+)onClick=\{onResetToDefaults\}/, btnStr + '\n          <button$1onClick={onResetToDefaults}');

fs.writeFileSync('src/components/SecretAdminPage.tsx', code);
console.log('Added button to SecretAdminPage');
