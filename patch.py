import sys

with open('src/components/ScreenOneAcquisition.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "Phase {activePhase.phaseNumber} me jab pure <strong>100% ({totalSupply.toLocaleString()} NXBC)</strong> tokens sell ho jayenge, tabhi agla <strong>{nextPhase ? `${nextPhase.name} ($${nextPhase.rate.toFixed(2)})` : 'DEX Launch'}</strong> automatically start hoga.",
    "The next <strong>{nextPhase ? `${nextPhase.name} ($${nextPhase.rate.toFixed(2)})` : 'DEX Launch'}</strong> will automatically start only when 100% of the Phase {activePhase.phaseNumber} coins (<strong>{totalSupply.toLocaleString()} NXBC</strong>) are sold out."
)

content = content.replace(
    "Aap agle phases me jo token <strong>Sell</strong> karenge wo global <strong>FIFO (First-In, First-Out)</strong> queue me jayenge. Jo pehle order lagayega, uska token pehle sell hoga. Har nayi token purchase ka <strong>20% user sell queue</strong> clear karne aur <strong>80% platform reserve</strong> me use hoga (Instant USDT payout).",
    "Coins you <strong>Sell</strong> in upcoming phases will enter a global <strong>FIFO (First-In, First-Out)</strong> queue. Orders placed first are executed first. Every new coin purchase allocates <strong>20% to clear the user sell queue</strong> and <strong>80% to the platform reserve</strong> (Instant USDT payout)."
)

with open('src/components/ScreenOneAcquisition.tsx', 'w') as f:
    f.write(content)
