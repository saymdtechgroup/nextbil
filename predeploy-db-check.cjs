#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) { console.error('FAIL: DATABASE_URL is not configured.'); process.exit(1); }

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  const tables = ['users','transactions','token_sell_ledgers','system_configs'];
  for (const table of tables) {
    const r = await client.query('SELECT to_regclass($1) AS table_name', [table]);
    if (!r.rows[0].table_name) throw new Error(`Required table missing: ${table}`);
  }
  const counts = {};
  for (const table of tables) {
    const r = await client.query(`SELECT COUNT(*)::bigint AS count FROM "${table}"`);
    counts[table] = r.rows[0].count;
  }
  console.log('Database connection: OK');
  console.log('Required tables: OK');
  console.log('Current row counts:', counts);
  console.log('PREDEPLOY CHECK PASSED. Run db:backup before deploying.');
  await client.end();
}
main().catch(async e => { console.error('PREDEPLOY CHECK FAILED:', e.message); process.exit(1); });
