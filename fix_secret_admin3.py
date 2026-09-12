import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Replace all local storage initializations
content = re.sub(r"const \[localLevels, setLocalLevels\] = useState<ReferralLevel\[\]>\(\(\) => \{.*?return referralLevels;\s*\}\);", "const [localLevels, setLocalLevels] = useState<ReferralLevel[]>(referralLevels);", content, flags=re.DOTALL)
content = re.sub(r"const \[localRanks, setLocalRanks\] = useState<RankReward\[\]>\(\(\) => \{.*?return rankRewards;\s*\}\);", "const [localRanks, setLocalRanks] = useState<RankReward[]>(rankRewards);", content, flags=re.DOTALL)
content = re.sub(r"const \[localSystem, setLocalSystem\] = useState<AdminSystemConfig>\(\(\) => \{.*?return systemConfig;\s*\}\);", "const [localSystem, setLocalSystem] = useState<AdminSystemConfig>(systemConfig);", content, flags=re.DOTALL)
content = re.sub(r"const \[localMatrix, setLocalMatrix\] = useState<MatrixConfig>\(\(\) => \{.*?return matrixConfig;\s*\}\);", "const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);", content, flags=re.DOTALL)

# Add a useEffect to sync when props change, but to avoid interrupting typing, we only sync if the local state equals the INITIAL_PHASES (i.e. hasn't been loaded from server yet)
# Actually, since `App.tsx` polls every 5 seconds, it will constantly update `phases`. If we put `phases` in useEffect dependency, it will overwrite user typing every 5 seconds.
# So we need to only sync ONCE, or only sync if it's the first time data is received.

effect_code = """
  // Sync state once when data arrives from server (e.g. tokensSold > 0 or loaded flag)
  useEffect(() => {
     setLocalPhases(phases);
     setLocalLevels(referralLevels);
     setLocalMatrix(matrixConfig);
     setLocalRanks(rankRewards);
     setLocalSystem(systemConfig);
  }, [phases[0]?.tokensSold, phases[0]?.targetDate, systemConfig.contractAddress]);
"""

# Insert effect_code after localMatrix
content = content.replace("const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);", "const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);\n" + effect_code)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Fixed SecretAdminPage!")
