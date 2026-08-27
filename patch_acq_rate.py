import sys

with open('src/components/ScreenOneAcquisition.tsx', 'r') as f:
    content = f.read()

old_rate = """                    <span
                      className={`text-sm font-black font-mono-crypto block ${
                        isActive
                          ? 'text-amber-300 text-base font-extrabold'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      ${phase.rate.toFixed(2)}
                      <span className="text-[9px] font-normal text-purple-300/70 ml-1">USD</span>
                    </span>"""

new_rate = """                    <span
                      className={`text-sm font-black font-mono-crypto block ${
                        isActive
                          ? 'text-amber-300 text-base font-extrabold'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {phase.rateLabel || `$${phase.rate.toFixed(2)}`}
                      {!phase.rateLabel && <span className="text-[9px] font-normal text-purple-300/70 ml-1">USD</span>}
                    </span>"""

content = content.replace(old_rate, new_rate)

with open('src/components/ScreenOneAcquisition.tsx', 'w') as f:
    f.write(content)
