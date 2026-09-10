import re

with open("src/App.tsx", "r") as f:
    content = f.read()

initial_phases = """
const INITIAL_PHASES: PhaseConfig[] = [
  { id: 'p1', phaseNumber: 1, name: 'Phase 1', shortName: 'P1', rate: 0.10, rateLabel: '$0.10', totalSupply: 1000000, tokensSold: 0, status: 'active', multiplier: '10x Phase', unlockRequirement: 'Live Now' },
  { id: 'p2', phaseNumber: 2, name: 'Phase 2', shortName: 'P2', rate: 0.15, rateLabel: '$0.15', totalSupply: 2000000, tokensSold: 0, status: 'upcoming', multiplier: '15x Phase', unlockRequirement: 'After P1' },
  { id: 'p3', phaseNumber: 3, name: 'Phase 3', shortName: 'P3', rate: 0.20, rateLabel: '$0.20', totalSupply: 3000000, tokensSold: 0, status: 'upcoming', multiplier: '20x Phase', unlockRequirement: 'After P2' },
  { id: 'p4', phaseNumber: 4, name: 'Phase 4', shortName: 'P4', rate: 0.25, rateLabel: '$0.25', totalSupply: 4000000, tokensSold: 0, status: 'upcoming', multiplier: '25x Phase', unlockRequirement: 'After P3' },
  { id: 'p5', phaseNumber: 5, name: 'Phase 5', shortName: 'P5', rate: 0.30, rateLabel: '$0.30', totalSupply: 5000000, tokensSold: 0, status: 'upcoming', multiplier: '30x Phase', unlockRequirement: 'After P4' },
  { id: 'dex', phaseNumber: 6, name: 'Phase 6 (DEX)', shortName: 'DEX', rate: 0.50, rateLabel: '$0.50', totalSupply: 10000000, tokensSold: 0, status: 'upcoming', multiplier: '50x Phase', unlockRequirement: 'After P5' },
];
"""

if "const INITIAL_PHASES" not in content:
    content = content.replace("export default function App() {", initial_phases + "\nexport default function App() {")

content = content.replace(
    "const [phases, setPhases] = useState<PhaseConfig[]>([]);",
    "const [phases, setPhases] = useState<PhaseConfig[]>(INITIAL_PHASES);"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed phases initialization")
