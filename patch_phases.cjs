const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const newPhases = `[
      {
        id: 'p1',
        phaseNumber: 1,
        name: 'Phase 1',
        shortName: 'P1',
        rate: 0.01,
        rateLabel: '$0.01',
        totalSupply: 1000000, // 10 Lakh (5 Lakh Sale, 5 Lakh Reserve)
        tokensSold: 0,
        status: 'active',
        multiplier: 'Base Seed Rate',
        unlockRequirement: 'Live Now (Stage 1)',
        targetDate: 'Active Now',
      },
      {
        id: 'p2',
        phaseNumber: 2,
        name: 'Phase 2',
        shortName: 'P2',
        rate: 0.10,
        rateLabel: '$0.10',
        totalSupply: 2500000, // 25 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '10x Growth',
        unlockRequirement: 'Phase 1 must be 100% sold to unlock',
      },
      {
        id: 'p3',
        phaseNumber: 3,
        name: 'Phase 3',
        shortName: 'P3',
        rate: 1.00,
        rateLabel: '$1.00',
        totalSupply: 7000000, // 70 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '100x Growth',
        unlockRequirement: 'Phase 2 must be 100% sold to unlock',
      },
      {
        id: 'p4',
        phaseNumber: 4,
        name: 'Phase 4',
        shortName: 'P4',
        rate: 10.00,
        rateLabel: '$10.00',
        totalSupply: 19500000, // 195 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '1000x Growth',
        unlockRequirement: 'Phase 3 must be 100% sold to unlock',
      },
      {
        id: 'p5',
        phaseNumber: 5,
        name: 'Phase 5',
        shortName: 'P5',
        rate: 100.00,
        rateLabel: '$100.00',
        totalSupply: 40000000, // 400 Lakh
        tokensSold: 0,
        status: 'locked',
        multiplier: '10000x Growth',
        unlockRequirement: 'Phase 4 must be 100% sold to unlock',
      },
      {
        id: 'dex',
        phaseNumber: 6,
        name: 'DEX Launch',
        shortName: 'DEX',
        rate: 100.00,
        rateLabel: 'Market Rate',
        totalSupply: 0,
        tokensSold: 0,
        status: 'locked',
        multiplier: 'Open Market Trading',
        unlockRequirement: 'Phase 5 must be 100% sold to unlock',
      },
    ]`;

// Replace initial state
content = content.replace(/return \[\s*\{\s*id: 'p1',[\s\S]*?(?=\}\);)/, `return ${newPhases}`);

// Replace handleResetPhases
content = content.replace(/setPhases\(\[\s*\{\s*id: 'p1',[\s\S]*?(?=\);)/g, `setPhases(${newPhases}`);

// Replace handleResetToDefaults
content = content.replace(/const defaultPhases: PhaseConfig\[\] = \[\s*\{\s*id: 'p1',[\s\S]*?(?=;\s*setPhases\(defaultPhases\);)/, `const defaultPhases: PhaseConfig[] = ${newPhases}`);

fs.writeFileSync('src/App.tsx', content);
console.log("Updated App.tsx");
