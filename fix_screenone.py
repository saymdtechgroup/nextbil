import re

with open("src/components/ScreenOneAcquisition.tsx", "r") as f:
    content = f.read()

# Safely access rate
content = content.replace("activePhase.rate.toFixed", "(activePhase.rate || 0).toFixed")
content = content.replace("activePhase.phaseNumber", "(activePhase.phaseNumber || 1)")

with open("src/components/ScreenOneAcquisition.tsx", "w") as f:
    f.write(content)
print("Safety fixes added to ScreenOne")
