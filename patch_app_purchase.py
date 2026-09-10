import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace the giant setPhases call in handleConfirmPurchase
content = re.sub(
    r'    // Sequential Phase Progress & 100% Transition Logic\s*setPhases\(\(prevPhases\) => \{.*?(?=    // Update cumulative investment)',
    '',
    content, flags=re.DOTALL
)

# Remove setTotalInvestedUsd local storage block
content = re.sub(
    r'    // Update cumulative investment\s*const newTotalInvested = totalInvestedUsd \+ usdAmount;\s*setTotalInvestedUsd\(newTotalInvested\);\s*if \(typeof window !== \'undefined\'\) \{\s*localStorage.setItem\(\'nxbc_total_invested\', newTotalInvested\.toString\(\)\);\s*\}\s*',
    '',
    content, flags=re.DOTALL
)

# Replace the entire MLM qualification and income simulation with nothing, since the backend does it.
content = re.sub(
    r'    // UNIVERSAL MLM Qualification Logic.*?if \(earnedMatrixBonus > 0\) \{[^\}]+\}\s*\}\s*',
    '',
    content, flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Removed frontend local mutations from purchase")
