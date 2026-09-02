const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenOneAcquisition.tsx', 'utf8');

code = code.replace(
  /onSimulateFillPhase: \(\) => void;/,
  "onSimulateFillPhase: () => void;\n  onSimulateExternalBuy?: (amount: number) => void;"
);

code = code.replace(
  /onSimulateFillPhase,\n/,
  "onSimulateFillPhase,\n  onSimulateExternalBuy,\n"
);

// We need to add the button somewhere. Where is onSimulateFillPhase used?
const btnMatch = `onClick={onSimulateFillPhase}
                className="w-full py-1.5 px-3 bg-[#1a0f35] hover:bg-[#251545] border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Simulate 100% Fill Phase`;

const replaceBtn = `onClick={() => {
                  const amount = prompt("Enter amount of NXBC purchased by an external buyer:", "100000");
                  if (amount && !isNaN(Number(amount)) && onSimulateExternalBuy) {
                    onSimulateExternalBuy(Number(amount));
                  }
                }}
                className="w-full py-1.5 px-3 bg-[#1a0f35] hover:bg-[#251545] border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors mb-1"
              >
                <RefreshCw className="w-3 h-3" />
                Simulate Ext Buy
              </button>
              <button
                onClick={onSimulateFillPhase}
                className="w-full py-1.5 px-3 bg-[#1a0f35] hover:bg-[#251545] border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Simulate 100% Fill Phase`;

if(code.includes('Simulate 100% Fill Phase')) {
  code = code.replace(btnMatch, replaceBtn);
  fs.writeFileSync('src/components/ScreenOneAcquisition.tsx', code);
  console.log('ScreenOneAcquisition updated');
} else {
  console.log('Could not find the button string');
}
