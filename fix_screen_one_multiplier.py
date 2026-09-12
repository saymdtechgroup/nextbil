import re

with open("src/components/ScreenOneAcquisition.tsx", "r") as f:
    content = f.read()

# 1. <span className="text-[10px] font-mono-crypto text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow-sm"> {activePhase.multiplier} </span>
pattern1 = r"<span className=\"text-\[10px\] font-mono-crypto text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0\.5 rounded-lg border border-emerald-500/40 shadow-sm\">\s*\{activePhase\.multiplier\}\s*</span>"
content = re.sub(pattern1, "", content)

# 2. {nextPhase?.multiplier && ( <span className="text-[9px] text-emerald-400 font-bold font-mono-crypto bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40"> {nextPhase.multiplier} </span> )}
pattern2 = r"\{nextPhase\?\.multiplier && \(\s*<span className=\"text-\[9px\] text-emerald-400 font-bold font-mono-crypto bg-emerald-950/80 px-1\.5 py-0\.5 rounded border border-emerald-500/40\">\s*\{nextPhase\.multiplier\}\s*</span>\s*\)\}"
content = re.sub(pattern2, "", content)

# 3. <span className="text-[9px] font-mono-crypto text-fuchsia-300 font-semibold block whitespace-nowrap"> {phase.multiplier} </span>
pattern3 = r"<span className=\"text-\[9px\] font-mono-crypto text-fuchsia-300 font-semibold block whitespace-nowrap\">\s*\{phase\.multiplier\}\s*</span>"
content = re.sub(pattern3, "", content)

with open("src/components/ScreenOneAcquisition.tsx", "w") as f:
    f.write(content)
print("Removed Multipliers from ScreenOneAcquisition")
