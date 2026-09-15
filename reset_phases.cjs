const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetPhases() {
  try {
    const res = await pool.query("SELECT * FROM system_configs WHERE key = 'phases'");
    if (res.rows.length > 0) {
      let phases = JSON.parse(res.rows[0].value);
      for (let p of phases) {
         p.tokensSold = 0;
         if (p.phaseNumber === 1) {
            p.status = 'active';
         } else {
            p.status = 'upcoming';
         }
      }
      await pool.query("UPDATE system_configs SET value = $1 WHERE key = 'phases'", [JSON.stringify(phases)]);
      console.log("✅ Phase counter successfully 0 ho gaya hai!");
    } else {
      console.log("Phases config not found.");
    }
  } catch(e) {
    console.error("❌ Error:", e);
  } finally {
    process.exit(0);
  }
}
resetPhases();
