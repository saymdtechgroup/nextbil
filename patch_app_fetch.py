import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove the localStorage setting from fetchLatestServerConfigs
new_fetch_configs = """      try {
        const res = await fetch('/api/admin/configs');
        const data = await res.json();
        if (data?.success) {
          if (data.phases && Array.isArray(data.phases) && data.phases.length > 0) {
            setPhases(data.phases);
          }
          if (data.referralLevels && Array.isArray(data.referralLevels) && data.referralLevels.length > 0) {
            setReferralLevels(data.referralLevels);
          }
          if (data.rankRewards && Array.isArray(data.rankRewards) && data.rankRewards.length > 0) {
            setRankRewards(data.rankRewards);
          }
          if (data.systemConfig && typeof data.systemConfig === 'object') {
            setSystemConfig(data.systemConfig);
          }
          if (data.matrixConfig && typeof data.matrixConfig === 'object') {
            setMatrixConfig(data.matrixConfig);
          }
        }
      } catch (err) {}"""

content = re.sub(r'      try \{\s*const res = await fetch\(\'/api/admin/configs\'\);.*?\} catch \(err\) \{\}', new_fetch_configs, content, flags=re.DOTALL)

# Also let's patch `handleConfirmPurchase` to remove local syncConfigsToServer and localStorage sets
# Specifically, we want it to just re-fetch from backend after 2 seconds to let DB process.
# We will just remove the setPhases, localStorage, and syncConfigsToServer from handleConfirmPurchase.

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Patched App fetch configs")
