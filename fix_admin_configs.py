import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace the setPhases line
fix_phases = """
          if (data.phases && Array.isArray(data.phases) && data.phases.length > 0) {
            const mappedPhases = data.phases.map((p: any, idx: number) => ({
              id: p.id ? String(p.id) : `p${idx+1}`,
              phaseNumber: p.phaseNumber || (idx + 1),
              name: p.name || `Phase ${idx+1}`,
              shortName: p.shortName || (p.name ? p.name.substring(0,2).toUpperCase() : `P${idx+1}`),
              rate: p.tokenPrice !== undefined ? Number(p.tokenPrice) : (p.rate || 0),
              rateLabel: p.rateLabel || `$${(p.tokenPrice || p.rate || 0).toFixed(2)}`,
              totalSupply: Number(p.totalSupply) || 0,
              tokensSold: Number(p.tokensSold) || 0,
              status: p.status || 'upcoming',
              multiplier: p.multiplier || '',
              unlockRequirement: p.unlockRequirement || '',
              targetDate: p.targetDate || ''
            }));
            setPhases(mappedPhases);
          }
"""

content = content.replace(
    "          if (data.phases && Array.isArray(data.phases) && data.phases.length > 0) {\n            setPhases(data.phases);\n          }",
    fix_phases
)

# Also let's check referralLevels and others just in case they are null
content = content.replace(
    "if (data.referralLevels && Array.isArray(data.referralLevels) && data.referralLevels.length > 0)",
    "if (data.referralLevels && Array.isArray(data.referralLevels) && data.referralLevels.length > 0)"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed phases mapping from API")
