import re

with open("src/components/AdminPanelModal.tsx", "r") as f:
    content = f.read()

replacement = """
  const handlePhaseChange = (index: number, field: keyof PhaseConfig, value: any) => {
    const updated = [...localPhases];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'rate') {
      const numRate = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      updated[index].rateLabel = `$${numRate.toFixed(2)}`;
      (updated[index] as any).tokenPrice = numRate;
    }
"""

content = content.replace(
    "  const handlePhaseChange = (index: number, field: keyof PhaseConfig, value: any) => {\n    const updated = [...localPhases];\n    updated[index] = { ...updated[index], [field]: value };",
    replacement
)

with open("src/components/AdminPanelModal.tsx", "w") as f:
    f.write(content)
print("Fixed AdminPanelModal phase edit")
