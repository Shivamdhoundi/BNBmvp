// Read-only configuration gate. Never prints credentials or changes services.
// Deliberately inspect only the supplied runtime environment. Falling back to
// .env.local can hide missing deployed secrets or select the wrong database.
const failures = [];
for (const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_APP_URL','SUPABASE_SERVICE_ROLE_KEY','HEALTHCHECK_SECRET','MFA_ENFORCEMENT_DATE']) {
  if (!process.env[key]?.trim()) failures.push(`${key} is missing`);
}
try {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) failures.push('NEXT_PUBLIC_APP_URL must be the canonical HTTPS origin');
} catch { failures.push('NEXT_PUBLIC_APP_URL is invalid'); }
try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) failures.push('NEXT_PUBLIC_SUPABASE_URL must be an HTTPS origin');
} catch { failures.push('NEXT_PUBLIC_SUPABASE_URL is invalid'); }
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') failures.push('Release gate requires the Production environment, not Preview or Development');
if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_secret_') ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  failures.push('A server secret must never be used as the public API key');
}
if ((process.env.HEALTHCHECK_SECRET?.length ?? 0) < 32) failures.push('HEALTHCHECK_SECRET must have at least 32 characters');
const deadline = Date.parse(process.env.MFA_ENFORCEMENT_DATE ?? '');
if (!Number.isFinite(deadline) || deadline > Date.now()) failures.push('Privileged MFA enforcement must be active before production launch');
if (failures.length) {
  failures.forEach(failure => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
} else {
  console.log('PASS production environment shape. Live auth, SMTP, database MFA policy, backups and deployment acceptance still require verification (see docs/production-readiness.md).');
}
