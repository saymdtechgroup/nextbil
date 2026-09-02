const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanelModal.tsx', 'utf8');

code = code.replace(
  /onSimulateFillPhase: \(\) => void;/,
  "onSimulateFillPhase: () => void;\n  onSimulateExternalBuy?: (amount: number) => void;"
);

code = code.replace(
  /onSimulateFillPhase,\n/,
  "onSimulateFillPhase,\n  onSimulateExternalBuy,\n"
);

// Add the button
const btnMatch = `          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="text-sm font-bold text-slate-300 font-rajdhani uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Simulate Progress
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to artificially fill the current active phase to 100%?')) {
                    onSimulateFillPhase();
                  }
                }}`;

const replaceBtn = `          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="text-sm font-bold text-slate-300 font-rajdhani uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Simulate Progress
            </h4>
            <div className="flex gap-2 flex-wrap">
              {onSimulateExternalBuy && (
                <button
                  onClick={() => {
                    const amount = prompt("Enter amount of NXBC purchased by an external buyer:", "1000");
                    if (amount && !isNaN(Number(amount))) {
                      onSimulateExternalBuy(Number(amount));
                    }
                  }}
                  className="px-3 py-2 bg-[#0e0720] hover:bg-[#150a30] border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Simulate Ext. Buy
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to artificially fill the current active phase to 100%?')) {
                    onSimulateFillPhase();
                  }
                }}`;

code = code.replace(btnMatch, replaceBtn);

fs.writeFileSync('src/components/AdminPanelModal.tsx', code);
console.log('AdminPanelModal updated');
