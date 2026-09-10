import { db } from "./src/db/index.ts";
import { systemConfigs } from "./src/db/schema.ts";

const initialPhases = [
    { id: 1, name: 'Phase 1', tokenPrice: 0.10, totalSupply: 1000000, tokensSold: 0, status: 'active', multiplier: '10x' },
    { id: 2, name: 'Phase 2', tokenPrice: 0.15, totalSupply: 2000000, tokensSold: 0, status: 'upcoming', multiplier: '20x' },
    { id: 3, name: 'Phase 3', tokenPrice: 0.20, totalSupply: 3000000, tokensSold: 0, status: 'upcoming', multiplier: '30x' },
    { id: 4, name: 'Phase 4', tokenPrice: 0.25, totalSupply: 4000000, tokensSold: 0, status: 'upcoming', multiplier: '40x' },
    { id: 5, name: 'Phase 5', tokenPrice: 0.30, totalSupply: 5000000, tokensSold: 0, status: 'upcoming', multiplier: '50x' },
    { id: 6, name: 'Phase 6 (DEX)', tokenPrice: 0.50, totalSupply: 10000000, tokensSold: 0, status: 'upcoming', multiplier: '100x' }
];

const initialSystemConfig = {
    tokenName: 'NXBC',
    tokenSymbol: 'NXBC',
    contractAddress: '0x8eF229597756a7bfb7Da80c0d86596D7bD366007',
    receivingAddress: '0x8d1abCa8Cf0f42799b9a76254710e979bd59c261',
    minPurchaseUsd: 0.01,
    maxPurchaseUsd: 50000,
    minMlmQualifyUsd: 100,
    presalePaused: false,
    directSponsorPercent: 10,
    withdrawalFeePercent: 2,
};

async function seed() {
    try {
        await db.insert(systemConfigs).values([
            { key: 'phases', value: JSON.stringify(initialPhases), description: 'Presale Phases' },
            { key: 'systemConfig', value: JSON.stringify(initialSystemConfig), description: 'System Config' }
        ]).onConflictDoNothing();
        console.log("Seeded database with initial configs.");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
seed();
