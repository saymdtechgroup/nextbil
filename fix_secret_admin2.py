import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Replace all local storage initializations
content = re.sub(r"const \[localLevels, setLocalLevels\] = useState<ReferralLevel\[\]>\(\(\) => \{.*?return referralLevels;\s*\}\);", "const [localLevels, setLocalLevels] = useState<ReferralLevel[]>(referralLevels);", content, flags=re.DOTALL)
content = re.sub(r"const \[localRanks, setLocalRanks\] = useState<RankReward\[\]>\(\(\) => \{.*?return rankRewards;\s*\}\);", "const [localRanks, setLocalRanks] = useState<RankReward[]>(rankRewards);", content, flags=re.DOTALL)
content = re.sub(r"const \[localSystem, setLocalSystem\] = useState<AdminSystemConfig>\(\(\) => \{.*?return systemConfig;\s*\}\);", "const [localSystem, setLocalSystem] = useState<AdminSystemConfig>(systemConfig);", content, flags=re.DOTALL)
content = re.sub(r"const \[localMatrix, setLocalMatrix\] = useState<MatrixConfig>\(\(\) => \{.*?return matrixConfig;\s*\}\);", "const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);", content, flags=re.DOTALL)

# Add a useEffect to sync them when props change (we will use JSON.stringify to detect deep changes if needed, but simple dependency is fine. Wait, if admin is typing, we don't want their typing to be interrupted by a 5-second poll! 
# Let's add a sync button, or just sync once when the component opens? 
# The modal admin panel (AdminPanelModal.tsx) has:
#  React.useEffect(() => {
#    if (isOpen) { ... setLocalPhases(phases) }
#  }, [isOpen, phases...])
# Which DOES override typing if `phases` changes!

