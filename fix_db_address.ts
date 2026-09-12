import { db } from "./src/db";
import { systemConfigs } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const rows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'systemConfig'));
    if (rows.length > 0) {
        let sys = [];
        try {
            sys = JSON.parse(rows[0].value);
        } catch(e) {}
        
        if (sys && sys.contractAddress) {
            sys.contractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";
            await db.update(systemConfigs).set({ value: JSON.stringify(sys) }).where(eq(systemConfigs.key, 'systemConfig'));
            console.log("DB systemConfig updated with new contract address!");
        }
    }
}
main().catch(console.error);
