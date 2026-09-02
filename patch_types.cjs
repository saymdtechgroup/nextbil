const fs = require('fs');
let content = fs.readFileSync('src/types/crypto.ts', 'utf8');

const newTypes = `
export interface PhaseAllocation {
  allocated: number;
  sold: number;
}

export interface UserEarnings {
  availableUsdt: number;
  withdrawnUsdt: number;
}

export interface QueueEntry {
  id: string;
  userId: string;
  phaseNumber: number;
  tokensRequested: number;
  tokensSold: number;
}
`;

content = content + newTypes;

content = content.replace(
  /unallocatedPercent: number;/,
  "unallocatedPercent: number;\n  p2Tokens?: PhaseAllocation;\n  p3Tokens?: PhaseAllocation;\n  p4Tokens?: PhaseAllocation;\n  p5Tokens?: PhaseAllocation;"
);

fs.writeFileSync('src/types/crypto.ts', content);
console.log("Updated types");
