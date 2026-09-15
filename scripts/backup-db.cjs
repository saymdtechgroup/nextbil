#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) { console.error('ERROR: DATABASE_URL is not set.'); process.exit(1); }
const dir = path.resolve(process.env.DB_BACKUP_DIR || './backups');
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(dir, `nxbc-db-${stamp}.dump`);
console.log(`Creating PostgreSQL backup: ${file}`);
const r = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', file, url], { stdio: 'inherit' });
if (r.error) { console.error(`ERROR: Could not run pg_dump: ${r.error.message}`); process.exit(1); }
if (r.status !== 0) { console.error('ERROR: pg_dump failed. No deployment should proceed.'); process.exit(r.status || 1); }
console.log('Backup completed successfully.');
