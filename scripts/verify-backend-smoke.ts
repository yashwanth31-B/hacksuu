import { requireAuth } from '../src/middleware/auth.ts';
import express from 'express';

async function testBackendSmoke() {
  console.log('--- Testing Backend Auth Middleware ---');
  const app = express();
  app.use(express.json());

  app.get('/api/protected-test', requireAuth, (_req, res) => {
    res.json({ success: true });
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;

  try {
    // 1. Test unauthenticated request - should return 401
    const unauthRes = await fetch(`http://127.0.0.1:${port}/api/protected-test`);
    const unauthData = await unauthRes.json();
    console.log('Unauthenticated request status:', unauthRes.status, unauthData);
    if (unauthRes.status !== 401 || !unauthData.error) {
      throw new Error('Auth middleware failed to protect endpoint');
    }

    // 2. Test invalid bearer token - should return 401
    const invalidTokenRes = await fetch(`http://127.0.0.1:${port}/api/protected-test`, {
      headers: { Authorization: 'Bearer invalid_token_123' },
    });
    const invalidTokenData = await invalidTokenRes.json();
    console.log('Invalid token request status:', invalidTokenRes.status, invalidTokenData);
    if (invalidTokenRes.status !== 401) {
      throw new Error('Auth middleware failed on invalid token');
    }

    console.log('AUTHENTICATION MIDDLEWARE: PASS');
  } finally {
    server.close();
  }
}

testBackendSmoke().catch((err) => {
  console.error('Backend smoke test failed:', err);
  process.exit(1);
});
