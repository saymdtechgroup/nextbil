import { db } from "./src/db/index.ts";
import { systemConfigs } from "./src/db/schema.ts";
async function main() {
    const data = await db.select().from(systemConfigs);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
main();
