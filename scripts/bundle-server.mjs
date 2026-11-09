import { rmSync } from 'node:fs';
import { build } from 'esbuild';

rmSync('build', { recursive: true, force: true });

await build({
  entryPoints: ['server/index.ts'],
  outfile: 'build/server.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  legalComments: 'none',
  logLevel: 'warning',
  define: { 'process.env.NODE_ENV': '"production"' },
});

console.log('✔ تم تجهيز build/server.cjs');
