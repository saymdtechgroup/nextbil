import { Pool } from 'pg';
const pool = new Pool({ connectionString: "postgresql://nxbc_user:NxbcAdmin2026@localhost:5432/nxbc_db" });

async function run() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN total_direct_volume double precision NOT NULL DEFAULT 0;");
  } catch(e) {}
  try {
    await pool.query("ALTER TABLE users ADD COLUMN total_team_volume double precision NOT NULL DEFAULT 0;");
  } catch(e) {}
  try {
    await pool.query("ALTER TABLE users ADD COLUMN highest_rank_achieved integer NOT NULL DEFAULT 0;");
  } catch(e) {}
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS rank_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rank_level INTEGER NOT NULL,
      reward_usdt DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
  } catch(e) { console.error(e) }
  console.log("Done");
  process.exit(0);
}
run();
