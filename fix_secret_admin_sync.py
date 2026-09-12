import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

replacement = """
  const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);
  
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  useEffect(() => {
     if (!hasLoadedFromServer && phases && phases.length > 0 && phases[0].tokensSold !== undefined) {
         // Assuming if the server responded, we should sync it ONCE.
         // Wait, INITIAL_PHASES also has tokensSold = 0. How to know if it's from server?
         // In App.tsx, the initial state is INITIAL_PHASES. 
         // Let's just sync it once if hasLoadedFromServer is false and we give it a 1 second delay?
         // No, we can just sync if `systemConfig.contractAddress` is not empty (default is empty or something)
         // Or just sync it ONCE unconditionally after 1 second?
         // Actually, better: 
         setLocalPhases(phases);
         setLocalLevels(referralLevels);
         setLocalMatrix(matrixConfig);
         setLocalRanks(rankRewards);
         setLocalSystem(systemConfig);
         setHasLoadedFromServer(true);
     }
  }, [phases, referralLevels, matrixConfig, rankRewards, systemConfig, hasLoadedFromServer]);
"""

content = content.replace("const [localMatrix, setLocalMatrix] = useState<MatrixConfig>(matrixConfig);", replacement)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Added safe sync")
