const fs = require('fs');
let admin = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

// Find the sellQueue section inside SecretAdminPage.tsx
const oldQueueBlockRegex = /\{activeSection === 'queue' && \([\s\S]*?\{sellQueue && sellQueue\.length > 0 \? \([\s\S]*?sellQueue\.map\(\(entry, idx\) => \{[\s\S]*?\}\)[\s\S]*?\)\s*:\s*\([\s\S]*?\)\s*\}\s*<\/div>\s*<\/div>\s*\)\}/;

const newQueueBlock = `{activeSection === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-blue-300 font-cinzel uppercase flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Global Auto-Sell FIFO Queue & Manual Priority Manager
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Default: 100% Automatic FIFO (First-In, First-Out). Admin can promote VIP users to #1 in line or manually fulfill orders instantly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => onSimulateExternalBuy && onSimulateExternalBuy(10000)}
                    className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-500/40 transition-colors flex items-center gap-1.5 font-mono-crypto"
                    title="Simulate 10,000 token buy on BSC to test automatic FIFO fulfillment"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Auto-Sell 10K Tokens</span>
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Automatic FIFO Active:</strong> Natural buyer volume automatically fulfills top of line. Use buttons below only for manual priority adjustments.</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? (
                  sellQueue.map((entry, idx) => {
                    const progress = Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100);
                    const isFullySold = entry.tokensSold >= entry.tokensRequested;

                    return (
                      <div key={idx} className="bg-[#120626] border border-blue-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-blue-400/60 shadow-lg">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Position #{idx + 1}
                            </span>
                            <span className="text-xs font-bold font-mono-crypto text-slate-100">
                              {entry.userAddress || '0x...Current User'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                              Phase {entry.phaseNumber} Target
                            </span>
                            {isFullySold && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                ✓ Fully Settled
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-purple-300 font-mono-crypto flex items-center gap-3">
                            <span>Requested: <strong className="text-slate-200">{entry.tokensRequested.toLocaleString()} NXBC</strong></span>
                            <span>Sold: <strong className="text-emerald-400">{entry.tokensSold.toLocaleString()} NXBC</strong></span>
                            <span>Remaining: <strong className="text-amber-300">{(entry.tokensRequested - entry.tokensSold).toLocaleString()} NXBC</strong></span>
                          </div>
                        </div>

                        {/* Progress Bar & Actions */}
                        <div className="w-full md:w-5/12 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold font-mono-crypto">
                            <span className="text-blue-300">Fulfillment Progress</span>
                            <span className="text-emerald-400">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#0d041c] rounded-full overflow-hidden border border-purple-500/20">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500" 
                              style={{ width: \`\${progress}%\` }}
                            ></div>
                          </div>

                          {/* Admin Action Buttons: Move Up, Move Down, Instant Fulfill */}
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            {/* Move to Top */}
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                if (!onUpdateSellQueue || !sellQueue) return;
                                const newQueue = [...sellQueue];
                                const [item] = newQueue.splice(idx, 1);
                                newQueue.unshift(item);
                                onUpdateSellQueue(newQueue);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              title="Make this order #1 in line"
                            >
                              ⬆ #1 Top Priority
                            </button>

                            {/* Move Up 1 Step */}
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                if (!onUpdateSellQueue || !sellQueue) return;
                                const newQueue = [...sellQueue];
                                const temp = newQueue[idx - 1];
                                newQueue[idx - 1] = newQueue[idx];
                                newQueue[idx] = temp;
                                onUpdateSellQueue(newQueue);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              title="Move up one position"
                            >
                              ▲ Up
                            </button>

                            {/* Move Down 1 Step */}
                            <button
                              disabled={idx === sellQueue.length - 1}
                              onClick={() => {
                                if (!onUpdateSellQueue || !sellQueue) return;
                                const newQueue = [...sellQueue];
                                const temp = newQueue[idx + 1];
                                newQueue[idx + 1] = newQueue[idx];
                                newQueue[idx] = temp;
                                onUpdateSellQueue(newQueue);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              title="Move down one position"
                            >
                              ▼ Down
                            </button>

                            {/* Instant 100% Fulfill */}
                            <button
                              disabled={isFullySold}
                              onClick={() => {
                                if (!onUpdateSellQueue || !sellQueue) return;
                                const newQueue = [...sellQueue];
                                newQueue[idx] = {
                                  ...newQueue[idx],
                                  tokensSold: newQueue[idx].tokensRequested,
                                };
                                onUpdateSellQueue(newQueue);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
                              title="Instantly fulfill 100% and unlock user withdrawal"
                            >
                              <Zap className="w-3 h-3 text-emerald-400" />
                              <span>Instant Fulfill</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 bg-[#120626] border border-blue-500/20 rounded-2xl">
                     <Database className="w-8 h-8 mx-auto text-blue-500/30 mb-2" />
                     <p className="text-xs text-purple-400 font-mono-crypto">The Auto-Sell queue is currently empty.</p>
                  </div>
                )}
              </div>
            </div>
          )}`;

admin = admin.replace(oldQueueBlockRegex, newQueueBlock);
fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
console.log('Admin FIFO Controls updated successfully!');
