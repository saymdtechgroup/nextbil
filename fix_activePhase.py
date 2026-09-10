import re

with open("src/App.tsx", "r") as f:
    content = f.read()

active_phase_def = """
  const activePhase = phases.find((p) => p.status === 'active') || phases[0] || {
    phaseNumber: 1,
    name: 'Phase 1',
    shortName: 'P1',
    rate: 0.10,
    totalSupply: 1000000,
    tokensSold: 0
  };
"""

if "const activePhase =" not in content:
    content = content.replace("const [phases, setPhases] = useState<PhaseConfig[]>([]);", "const [phases, setPhases] = useState<PhaseConfig[]>([]);\n" + active_phase_def)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed activePhase")
