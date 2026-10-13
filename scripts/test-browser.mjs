import { spawnSync } from 'node:child_process';

// NEXT_PUBLIC variables are frozen at build time. Build and run against the
// same dummy backend; never reuse an artifact built with production values.
const env = { ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  HEALTHCHECK_SECRET: 'local-test-health-secret-at-least-32-characters',
};
for (const args of [['run', 'build'], ['exec', '--', 'playwright', 'test']]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
