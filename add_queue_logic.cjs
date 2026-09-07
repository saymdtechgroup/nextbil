const fs = require('fs');
let admin = fs.readFileSync('src/components/SecretAdminPage.tsx', 'utf8');

const targetRender = `{activeTab === 'database' && (`;

const newTabRender = `{activeTab === 'queue' && (
            <div className="bg-[#1a0f2e]/80 border border-purple-500/30 rounded-xl p-4 sm:p-6 mb-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
                <Layers className="text-amber-400 w-6 h-6" />
                <h3 className="text-xl font-bold text-amber-400">Queue Management (Admin Override)</h3>
              </div>
              <p className="text-sm text-slate-300 mb-6">
                As an Admin, you can manually reorder the First-In-First-Out (FIFO) queue for Phase Auto-Sells. 
                Move VIP users to the top of the line so their tokens sell first.
              </p>
              
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? sellQueue.map((entry, idx) => (
                  <div key={entry.id} className="bg-[#130728] border border-purple-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30 font-mono-crypto">
                          Queue Position: #{idx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-200">Phase {entry.phaseNumber}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono-crypto break-all">User: {entry.userId}</p>
                      <div className="flex gap-4 mt-2">
                        <div className="text-xs">
                          <span className="text-slate-500">Requested:</span> <span className="text-emerald-400 font-mono-crypto font-bold">{entry.tokensRequested.toLocaleString()} NXBC</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500">Sold:</span> <span className="text-amber-400 font-mono-crypto font-bold">{entry.tokensSold.toLocaleString()} NXBC</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (idx === 0) return;
                          const newQ = [...sellQueue];
                          // move to top
                          const [item] = newQ.splice(idx, 1);
                          newQ.unshift(item);
                          if(onUpdateSellQueue) onUpdateSellQueue(newQ);
                        }}
                        disabled={idx === 0}
                        className="p-2 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move to Top (VIP)"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (idx === 0) return;
                          const newQ = [...sellQueue];
                          const [item] = newQ.splice(idx, 1);
                          newQ.splice(idx - 1, 0, item);
                          if(onUpdateSellQueue) onUpdateSellQueue(newQ);
                        }}
                        disabled={idx === 0}
                        className="px-3 py-1.5 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                      >
                        Move Up
                      </button>
                      <button 
                        onClick={() => {
                          if (idx === sellQueue.length - 1) return;
                          const newQ = [...sellQueue];
                          const [item] = newQ.splice(idx, 1);
                          newQ.splice(idx + 1, 0, item);
                          if(onUpdateSellQueue) onUpdateSellQueue(newQ);
                        }}
                        disabled={idx === sellQueue.length - 1}
                        className="px-3 py-1.5 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                      >
                        Move Down
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No active auto-sell entries in the queue yet.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'database' && (`;

if (admin.includes(targetRender)) {
  admin = admin.replace(targetRender, newTabRender);
  fs.writeFileSync('src/components/SecretAdminPage.tsx', admin);
}
