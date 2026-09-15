const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearTestingData() {
  try {
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM sell_orders');
    await pool.query('DELETE FROM level_earnings');
    await pool.query('DELETE FROM rank_achievements');
    await pool.query('DELETE FROM matrix_nodes');
    
    await pool.query(`UPDATE users SET 
      is_mlm_qualified = false, direct_count = 0, total_team_count = 0, 
      is_matrix_active = false, matrix_level = 0, total_earned_usdt = 0, 
      available_usdt = 0, total_withdrawn_usdt = 0, total_invested_usdt = 0, 
      total_direct_volume = 0, total_team_volume = 0, highest_rank_achieved = 0, 
      total_purchased_tokens = 0`);
      
    console.log("✅ Sab testing data delete ho gaya! Ab aap fresh testing kar sakte hain.");
  } catch(e) {
    console.error("❌ Error:", e);
  } finally {
    process.exit(0);
  }
}
clearTestingData();
