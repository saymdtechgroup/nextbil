import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required. Refusing to run database migration without an explicit database connection.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  try {
    await pool.query('BEGIN');
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS total_direct_volume double precision NOT NULL DEFAULT 0;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS total_team_volume double precision NOT NULL DEFAULT 0;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_rank_achieved integer NOT NULL DEFAULT 0;");
    await pool.query(`CREATE TABLE IF NOT EXISTS rank_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rank_level INTEGER NOT NULL,
      reward_usdt DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
    await pool.query('COMMIT');
    console.log('Database migration completed successfully. Existing rows were preserved.');
  } catch (e) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Database migration failed; transaction rolled back.', e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
run();
