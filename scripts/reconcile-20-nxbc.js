require('dotenv').config();
const { Client } = require('pg');

const HASHES = [
  '0x2863b5d6f940c2a9a32db2fc4af61a0478375ef065244c0c1e1d5256362561d6',
  '0xac6c9973e7e7139590e90495f2e373b1d8715a26c4c0ebd5c3c7d5324f2f96ee',
];

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN');

    const tx = await db.query(`
      SELECT id, user_id, type, amount_usdt, token_amount, phase_index, status, tx_hash
      FROM transactions
      WHERE LOWER(tx_hash) IN (LOWER($1), LOWER($2))
      ORDER BY id
      FOR UPDATE
    `, HASHES);

    if (tx.rows.length !== 2) {
      throw new Error(`Safety stop: expected exactly 2 transaction rows, found ${tx.rows.length}.`);
    }

    const userId = tx.rows[0].user_id;
    if (!tx.rows.every(r => r.user_id === userId)) {
      throw new Error('Safety stop: the two transactions belong to different users.');
    }
    if (!tx.rows.every(r => r.type === 'buy_presale')) {
      throw new Error('Safety stop: one or more rows are not buy_presale transactions.');
    }
    if (!tx.rows.every(r => r.status === 'failed')) {
      throw new Error('Safety stop: one or more rows are not currently failed. Nothing changed.');
    }
    if (!tx.rows.every(r => Math.abs(Number(r.amount_usdt) - 0.10) < 1e-9)) {
      throw new Error('Safety stop: expected both purchases to be exactly 0.10 USDT.');
    }
    if (!tx.rows.every(r => Math.abs(Number(r.token_amount) - 10) < 1e-9)) {
      throw new Error('Safety stop: expected both purchases to be exactly 10 NXBC.');
    }

    const user = await db.query(`
      SELECT id, wallet_address, total_purchased_tokens, total_invested_usdt
      FROM users WHERE id = $1 FOR UPDATE
    `, [userId]);

    if (user.rows.length !== 1) throw new Error('Safety stop: user row not found.');

    const u = user.rows[0];
    const newPurchased = Number(u.total_purchased_tokens || 0) + 20;
    const newInvested = Number(u.total_invested_usdt || 0) + 0.20;

    await db.query(`
      UPDATE transactions
      SET status = 'completed'
      WHERE id = ANY($1::int[])
    `, [tx.rows.map(r => r.id)]);

    await db.query(`
      UPDATE users
      SET total_purchased_tokens = $1,
          total_invested_usdt = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [newPurchased, newInvested, userId]);

    await db.query('COMMIT');

    console.log('RECONCILIATION SUCCESS');
    console.log('Wallet:', u.wallet_address);
    console.log('Recovered NXBC:', 20);
    console.log('Recovered USDT investment:', 0.20);
    console.log('New website asset total:', newPurchased, 'NXBC');
    console.log('New total invested:', newInvested, 'USDT');
    console.log('Both original blockchain purchase rows are now completed.');
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('RECONCILIATION STOPPED - NO CHANGES MADE');
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
