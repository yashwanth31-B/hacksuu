import { pool, db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

async function testDatabaseInit() {
  console.log('--- Testing Database Module Initialization ---');
  console.log('Pool instance created:', Boolean(pool));
  console.log('Drizzle DB instance created:', Boolean(db));
  
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  console.log('DATABASE_URL present in environment:', hasDbUrl);

  if (hasDbUrl) {
    console.log('Attempting non-destructive connectivity check (SELECT 1)...');
    try {
      const client = await pool.connect();
      try {
        const res = await client.query('SELECT 1 as connected');
        console.log('Direct PG Query Result:', res.rows[0]);
      } finally {
        client.release();
      }
      
      const drizzleRes = await db.execute(sql`SELECT 1 as drizzle_connected`);
      console.log('Drizzle execute result:', drizzleRes.rows);
      console.log('DATABASE CONNECTIVITY: PASS');
    } catch (err: any) {
      console.error('Database connection failed:', err.message);
      console.log('DATABASE CONNECTIVITY: FAIL (Check DATABASE_URL credentials or IP allowance)');
    }
  } else {
    console.log('No DATABASE_URL supplied in current environment.');
    console.log('Verified: Pool and Drizzle instances initialize successfully without runtime exceptions on module load.');
    console.log('DATABASE INITIALIZATION: PASS');
  }

  await pool.end();
}

testDatabaseInit().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
