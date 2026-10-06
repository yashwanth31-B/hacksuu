import { spawn } from 'child_process';

const proc = spawn('npx', ['tsx', 'server.ts'], {
  env: { ...process.env, PORT: '3099', NODE_ENV: 'production' },
  shell: true,
});

let output = '';
proc.stdout.on('data', (d) => {
  output += d.toString();
  if (output.includes('CivicFix V2 server running')) {
    console.log('Backend boot verified:', output.trim());
    proc.kill();
    process.exit(0);
  }
});

proc.stderr.on('data', (d) => {
  console.error('stderr:', d.toString());
});

setTimeout(() => {
  console.log('Timeout waiting for backend. Captured output:', output);
  proc.kill();
  process.exit(output.includes('CivicFix V2 server running') ? 0 : 1);
}, 6000);
