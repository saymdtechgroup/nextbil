import sys

with open('src/components/ScreenOneAcquisition.tsx', 'r') as f:
    content = f.read()

buy_button = """          <button
            id="screen1-buy-now-btn"
            onClick={onOpenBuyModal}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 cursor-pointer font-rajdhani uppercase"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span>Buy in {activePhase.shortName} (@ ${activePhase.rate.toFixed(2)})</span>
          </button>"""

new_buy_button = """          {activePhase.id === 'dex' ? (
            <button
              id="screen1-buy-now-btn"
              disabled
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-400 font-black text-xs tracking-wide cursor-not-allowed font-rajdhani uppercase"
            >
              <Zap className="w-4 h-4 opacity-50" />
              <span>Buy on DEX (Live)</span>
            </button>
          ) : (
            <button
              id="screen1-buy-now-btn"
              onClick={onOpenBuyModal}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform active:scale-95 cursor-pointer font-rajdhani uppercase"
            >
              <Zap className="w-4 h-4 fill-black text-black" />
              <span>Buy in {activePhase.shortName} (@ ${activePhase.rate.toFixed(2)})</span>
            </button>
          )}"""

content = content.replace(buy_button, new_buy_button)

# Also let's check for the $1500 - $3000 display in the top banner:
# `<div className="text-2xl sm:text-3xl font-black text-white font-rajdhani">`
# `{activePhase.rateLabel || `$${activePhase.rate.toFixed(2)}`}` -> it uses rateLabel, so changing it in App.tsx works.

with open('src/components/ScreenOneAcquisition.tsx', 'w') as f:
    f.write(content)
