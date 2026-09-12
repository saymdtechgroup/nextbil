import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Remove the useEffect we added
pattern = r"  // Sync state once when data arrives from server \(e\.g\. tokensSold > 0 or loaded flag\)\s*useEffect\(\(\) => \{\s*setLocalPhases\(phases\);\s*setLocalLevels\(referralLevels\);\s*setLocalMatrix\(matrixConfig\);\s*setLocalRanks\(rankRewards\);\s*setLocalSystem\(systemConfig\);\s*\}, \[phases\[0\]\?\.tokensSold, phases\[0\]\?\.targetDate, systemConfig\.contractAddress\]\);"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Removed useEffect from SecretAdminPage")
