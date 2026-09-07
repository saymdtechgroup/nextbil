const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenThreeWallet.tsx', 'utf8');

code = code.replace(/nxbusdBalance\?: number;/g, '');
code = code.replace(/nxbusdBalance = 0,/g, '');

const targetBlock = `{/* NXBUSD / USDT Convert Block */}
              <div className="bg-[#100520] p-3 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownUp className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-200 uppercase font-rajdhani">Live Convert</span>
                  </div>
                  <span className="text-[9px] text-purple-300 font-mono-crypto">Internal 1:1 Peg</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono-crypto mb-2">
                  <div className="bg-[#0b0318] p-2 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-400/80 block mb-0.5">USDT (BEP-20)</span>
                    <span className="text-emerald-300 font-bold">{usdtBalance.toFixed(2)}</span>
                  </div>
                  <div className="bg-[#0b0318] p-2 rounded-lg border border-amber-500/20">
                    <span className="text-amber-400/80 block mb-0.5">NXBUSD</span>
                    <span className="text-amber-300 font-bold">{nxbusdBalance.toFixed(2)}</span>
                  </div>
                </div>
                {onOpenSwapModal && (
                  <button 
                    onClick={onOpenSwapModal}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold uppercase transition-all"
                  >
                    Swap USDT ↔ NXBUSD
                  </button>
                )}
              </div>`;

code = code.replace(targetBlock, '');

// Also remove NXBUSD block from top total section
const topTargetBlock = `<div className="text-center p-2 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <span className="text-[10px] text-purple-300/80 block mb-0.5">NXBUSD Fuel</span>
              <span className="text-sm font-bold text-amber-300 font-mono-crypto">
                {nxbusdBalance.toFixed(2)}
              </span>
            </div>`;
code = code.replace(topTargetBlock, '');

code = code.replace(/<div className="grid grid-cols-3 gap-2">/g, '<div className="grid grid-cols-2 gap-2">');

fs.writeFileSync('src/components/ScreenThreeWallet.tsx', code);
