import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import * as schema from './schema.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env before initializing connection pool
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(
    (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) ||
    (process.env.SQL_PASSWORD && process.env.SQL_PASSWORD.trim().length > 0)
  );
};

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const poolConfig: PoolConfig = {
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
      poolConfig.connectionString = process.env.DATABASE_URL.trim();
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    } else if (process.env.SQL_PASSWORD && process.env.SQL_PASSWORD.trim().length > 0) {
      poolConfig.host = process.env.SQL_HOST || 'localhost';
      poolConfig.port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432;
      poolConfig.user = process.env.SQL_USER || 'postgres';
      poolConfig.password = process.env.SQL_PASSWORD.trim();
      poolConfig.database = process.env.SQL_DB_NAME || 'civicfix';
      if (process.env.SQL_SSL === 'true') {
        poolConfig.ssl = {
          rejectUnauthorized: false,
        };
      }
    } else {
      // Neither DATABASE_URL nor SQL_PASSWORD is set.
      // Do not provide password: '' which causes SASL SCRAM auth crash.
      poolConfig.host = process.env.SQL_HOST || 'localhost';
      poolConfig.port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432;
      poolConfig.user = process.env.SQL_USER || 'postgres';
      poolConfig.database = process.env.SQL_DB_NAME || 'civicfix';
    }

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
