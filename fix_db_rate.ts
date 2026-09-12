import { db } from "./src/db";
import { systemConfigs } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const rows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'phases'));
    if (rows.length > 0) {
        let phases = [];
        try {
            phases = JSON.parse(rows[0].value);
        } catch(e) {}
        
        if (phases && phases.length > 0) {
            phases = phases.map(p => ({
                ...p,
                rate: p.rate !== undefined ? p.rate : p.tokenPrice,
                tokenPrice: p.rate !== undefined ? p.rate : p.tokenPrice,
            }));
            await db.update(systemConfigs).set({ value: JSON.stringify(phases) }).where(eq(systemConfigs.key, 'phases'));
            console.log("DB phases updated to sync rate and tokenPrice!");
        }
    }
}
main().catch(console.error);
