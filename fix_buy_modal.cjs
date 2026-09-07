const fs = require('fs');
let code = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');

const targetRegex = /\{\/\* Currency Selector with Live Balance Display \*\/\}[\s\S]*?\{\/\* Amount Input \*\/\}/g;

const replacement = `{/* Currency Selector with Live Balance Display */}
            <div className="space-y-1.5 bg-[#090317] p-2.5 rounded-2xl border border-purple-500/30">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-bold text-purple-200 font-mono-crypto">
                  Pay With Token:
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono-crypto">
                  <span className="text-purple-300">Available:</span>
                  <span className={\`font-bold \${isInsufficientBalance ? 'text-rose-400' : 'text-emerald-400'}\`}>
                    {effectiveBalance >= 1 ? effectiveBalance.toFixed(2) : effectiveBalance.toFixed(4)} {currency}
                  </span>
                  <button
                    type="button"
                    onClick={refreshOnChainBalance}
                    disabled={isRefreshingBalance}
                    title="Refresh Blockchain Balance"
                    className="p-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-300 transition-all cursor-pointer"
                  >
                    <RefreshCw className={\`w-3 h-3 \${isRefreshingBalance ? 'animate-spin text-amber-400' : ''}\`} />
                  </button>
                </div>
              </div>

              {/* Insufficient Balance Callout */}
              {isInsufficientBalance && (
                <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-[10px] space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-300">Insufficient USDT Balance!</span>
                      <span>
                        Aapke wallet me sirf <strong>{effectiveBalance.toFixed(2)} USDT</strong> hai, jabki order ke liye <strong>\${usdValue.toFixed(2)} USDT</strong> chahiye.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input */}`;

code = code.replace(targetRegex, replacement);

fs.writeFileSync('src/components/BuyTokenModal.tsx', code);
