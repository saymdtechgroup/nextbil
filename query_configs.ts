import { db } from "./src/db";
import { systemConfigs } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const rows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, 'phases'));
    if (rows.length > 0) {
        console.log(rows[0].value);
    }
}
main().catch(console.error);
