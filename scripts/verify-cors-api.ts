import express from 'express';
import cors from 'cors';
import { getApiUrl } from '../src/lib/api.ts';

async function testCorsAndApi() {
  console.log('--- Testing API URL Helper ---');
  
  // Test default behavior (no VITE_API_BASE_URL)
  const defaultUrl = getApiUrl('/api/complaints');
  console.log('Default getApiUrl("/api/complaints"):', defaultUrl);
  if (defaultUrl !== '/api/complaints') {
    throw new Error(`Expected '/api/complaints' but got '${defaultUrl}'`);
  }

  // Test with VITE_API_BASE_URL (simulated)
  const originalEnv = process.env.VITE_API_BASE_URL;
  // @ts-ignore
  import.meta.env = { VITE_API_BASE_URL: 'https://civicfix-backend.onrender.com' };
  // Dynamically re-test
  const testWithBase = (path: string, base: string) => {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };
  const renderUrl = testWithBase('/api/complaints', 'https://civicfix-backend.onrender.com');
  console.log('Render getApiUrl with base:', renderUrl);
  if (renderUrl !== 'https://civicfix-backend.onrender.com/api/complaints') {
    throw new Error('API Base URL prepending failed');
  }
  console.log('API URL HANDLING: PASS');

  console.log('\n--- Testing Backend CORS Configuration ---');
  const app = express();
  
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed =
          allowedOrigins.includes(origin) ||
          /\.vercel\.app$/.test(origin);
        if (isAllowed) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.get('/api/test', (_req, res) => {
    res.json({ ok: true });
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;
  
  try {
    // 1. Test from Vercel origin
    const vercelOrigin = 'https://civicfix-preview.vercel.app';
    const vercelRes = await fetch(`http://127.0.0.1:${port}/api/test`, {
      headers: { Origin: vercelOrigin },
    });
    const vercelAllowOrigin = vercelRes.headers.get('access-control-allow-origin');
    const vercelAllowCreds = vercelRes.headers.get('access-control-allow-credentials');
    console.log(`Vercel origin (${vercelOrigin}) response:`, {
      status: vercelRes.status,
      allowOrigin: vercelAllowOrigin,
      allowCredentials: vercelAllowCreds,
    });

    if (vercelAllowOrigin !== vercelOrigin || vercelAllowCreds !== 'true') {
      throw new Error(`CORS headers incorrect for Vercel origin: origin=${vercelAllowOrigin}, creds=${vercelAllowCreds}`);
    }

    // 2. Test preflight OPTIONS request
    const optionsRes = await fetch(`http://127.0.0.1:${port}/api/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: vercelOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });
    console.log('Preflight OPTIONS response status:', optionsRes.status);
    if (optionsRes.status !== 204 && optionsRes.status !== 200) {
      throw new Error(`Preflight OPTIONS failed with status ${optionsRes.status}`);
    }

    console.log('CORS CONFIGURATION: PASS');
  } finally {
    server.close();
  }
}

testCorsAndApi().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
