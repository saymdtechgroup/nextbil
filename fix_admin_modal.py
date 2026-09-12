import re

with open("src/components/AdminPanelModal.tsx", "r") as f:
    content = f.read()

# Replace the useEffect in AdminPanelModal so it only syncs when it transitions from closed to open
replacement = """
  // Sync state ONLY when modal first opens to prevent 5-second polling from overwriting unsaved typing
  React.useEffect(() => {
    if (isOpen) {
      setLocalPhases(phases);
      setLocalLevels(levels);
      setLocalMatrix(matrixConfig);
      setLocalRanks(rankRewards);
      setLocalSystem(systemConfig);
    }
  }, [isOpen]); // Intentionally omitting phases, levels, etc., so it doesn't overwrite while typing
"""

pattern = r"  // Sync state whenever modal opens\s*React\.useEffect\(\(\) => \{\s*if \(isOpen\) \{\s*setLocalPhases\(phases\);\s*setLocalLevels\(levels\);\s*setLocalMatrix\(matrixConfig\);\s*setLocalRanks\(rankRewards\);\s*setLocalSystem\(systemConfig\);\s*\}\s*\}, \[isOpen, phases, levels, matrixConfig, rankRewards, systemConfig\]\);"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/components/AdminPanelModal.tsx", "w") as f:
    f.write(content)

print("Fixed AdminPanelModal")
