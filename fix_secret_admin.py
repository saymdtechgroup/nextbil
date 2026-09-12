import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Add a useEffect to sync localPhases when phases prop changes, but only if localPhases still has tokensSold == 0 and phases has tokensSold > 0, 
# or just do a simple sync. Let's just sync it whenever phases prop changes, 
# BUT wait, the admin might be editing. 
# We can just sync once when phases prop changes from INITIAL_PHASES to the real one.
# INITIAL_PHASES usually has all tokensSold as 0.

replacement = """
  const [localPhases, setLocalPhases] = useState<PhaseConfig[]>(phases);
  
  // Sync when server data loads initially
  useEffect(() => {
     // If the phases prop has real data (e.g. tokensSold > 0 on any phase, or we just loaded from server)
     // we should update local phases to match server, so we don't overwrite DB with zeros
     setLocalPhases(phases);
     setLocalLevels(referralLevels);
     setLocalMatrix(matrixConfig);
     setLocalRanks(rankRewards);
     setLocalSystem(systemConfig);
  }, [phases, referralLevels, matrixConfig, rankRewards, systemConfig]);
"""

# Let's just use a more careful replacement
# We will replace the localPhases useState block
pattern = r"const \[localPhases, setLocalPhases\].*?return phases;\s*\}\);"

content = re.sub(pattern, "const [localPhases, setLocalPhases] = useState<PhaseConfig[]>(phases);", content, flags=re.DOTALL)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)
print("Replaced useState")
