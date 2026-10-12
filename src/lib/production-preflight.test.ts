import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/production-preflight.mjs', import.meta.url));
const valid = {
  NEXT_PUBLIC_APP_URL: 'https://app.example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test_only',
  HEALTHCHECK_SECRET: 'x'.repeat(32),
  MFA_ENFORCEMENT_DATE: '2020-01-01T00:00:00Z',
  VERCEL_ENV: 'production',
};
function run(env: Record<string, string>) {
  return spawnSync(process.execPath, [script], { env: { NODE_ENV: 'test', ...env }, encoding: 'utf8' });
}
describe('production environment preflight', () => {
  it('passes explicit production configuration without claiming live acceptance', () => {
    const result = run(valid);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('still require verification');
  });
  it('does not silently load local development credentials', () => {
    const result = run({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('NEXT_PUBLIC_SUPABASE_URL is missing');
  });
  it.each(['https://app.example.com?redirect=1', 'https://app.example.com#fragment', 'http://app.example.com'])('rejects noncanonical origin %s', url => {
    expect(run({ ...valid, NEXT_PUBLIC_APP_URL: url }).status).toBe(1);
  });
  it('rejects Preview configuration', () => {
    expect(run({ ...valid, VERCEL_ENV: 'preview' }).status).toBe(1);
  });
  it('rejects exposed server secrets without printing them', () => {
    const result = run({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: valid.SUPABASE_SERVICE_ROLE_KEY });
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain(valid.SUPABASE_SERVICE_ROLE_KEY);
  });
  it('rejects invalid backend origins and future MFA enforcement', () => {
    expect(run({ ...valid, NEXT_PUBLIC_SUPABASE_URL: 'http://localhost' }).status).toBe(1);
    expect(run({ ...valid, MFA_ENFORCEMENT_DATE: '2999-01-01' }).status).toBe(1);
  });
});
