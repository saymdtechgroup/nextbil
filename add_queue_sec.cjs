const fs = require('fs');
let admin = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

// Update AdminSection type
admin = admin.replace(
  /\| 'simulator';/,
  "| 'simulator'\n  | 'queue';"
);

// Add sidebar button for Queue right after simulator
const simulatorBtn = `            onClick={() => setActiveSection('simulator')}
            className={\`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap \${
              activeSection === 'simulator'
                ? 'bg-gradient-to-r from-emerald-500/20 to-purple-900/50 text-emerald-300 border border-emerald-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }\`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>8. Income Simulator</span>
          </button>`;

const queueBtn = `          <button
            onClick={() => setActiveSection('queue')}
            className={\`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap \${
              activeSection === 'queue'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-900/50 text-blue-300 border border-blue-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }\`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>9. Auto-Sell Queue</span>
          </button>`;

admin = admin.replace(simulatorBtn, simulatorBtn + "\n" + queueBtn);

// Add the queue section body before simulator section body
const simulatorSectionStart = `{activeSection === 'simulator' && (`;

const queueSectionBody = `          {activeSection === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-blue-300 font-cinzel uppercase flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Global Auto-Sell Queue & Simulation
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Manage the live FIFO queue and simulate external token buys to test withdrawal unlocking.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => onSimulateExternalBuy && onSimulateExternalBuy(10000)}
                    className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/40 transition-colors flex items-center gap-2 font-mono-crypto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Simulate Buy (10,000 Tokens)
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? (
                  sellQueue.map((entry, idx) => {
                    const progress = Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100);
                    return (
                      <div key={idx} className="bg-[#120626] border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-100">{entry.userAddress}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">Phase {entry.phaseNumber}</span>
                          </div>
                          <div className="text-[10px] text-purple-300 font-mono-crypto">
                            Request: {entry.tokensRequested.toLocaleString()} Tokens
                          </div>
                        </div>
                        <div className="w-full sm:w-1/2">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-blue-300">Sold: {entry.tokensSold.toLocaleString()}</span>
                            <span className="text-emerald-400">{progress.toFixed(1)}% Completed</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#0d041c] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: \`\${progress}%\` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 bg-[#120626] border border-blue-500/20 rounded-xl">
                     <Database className="w-8 h-8 mx-auto text-blue-500/30 mb-2" />
                     <p className="text-xs text-purple-400 font-mono-crypto">The Auto-Sell queue is currently empty.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
`;

admin = admin.replace(simulatorSectionStart, queueSectionBody + simulatorSectionStart);

fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
console.log('Queue section added to Admin page.');
