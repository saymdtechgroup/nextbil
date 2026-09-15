#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const url = process.env.DATABASE_URL;
const file = process.argv[2];
const confirm = process.argv.includes('--confirm');
if (!url) { console.error('ERROR: DATABASE_URL is not set.'); process.exit(1); }
if (!file) { console.error('Usage: npm run db:restore -- ./backups/file.dump --confirm'); process.exit(1); }
if (!confirm) { console.error('RESTORE BLOCKED: add --confirm. Restore can overwrite production data.'); process.exit(1); }
const resolved = path.resolve(file);
if (!fs.existsSync(resolved)) { console.error(`ERROR: Backup file not found: ${resolved}`); process.exit(1); }
console.error('WARNING: This restores the database and may overwrite existing data.');
const r = spawnSync('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-acl', '--dbname', url, resolved], { stdio: 'inherit' });
if (r.error) { console.error(`ERROR: Could not run pg_restore: ${r.error.message}`); process.exit(1); }
process.exit(r.status || 0);
