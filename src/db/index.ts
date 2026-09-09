import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const poolConfig: any = {
      max: 10,
      connectionTimeoutMillis: 15000,
    };
    
    if (process.env.DATABASE_URL) {
      poolConfig.connectionString = process.env.DATABASE_URL;
    } else {
      poolConfig.connectionString = "postgresql://nxbc_user:NxbcAdmin2026@localhost:5432/nxbc_db";
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
