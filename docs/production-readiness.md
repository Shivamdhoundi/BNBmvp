# Production release record

Scope: the existing invite-only internal StayPilot MVP. The future cleaning,
maintenance, expenses, reporting, imports, payouts and integration modules are
not part of this release.

Status on 2026-10-11: **release candidate; NOT approved for production**.
Code changes are on `production-hardening`. No live migration or deployment has
been performed as part of this hardening pass.

## Verified locally

- Next.js 16.3.8; locked runtime dependencies have zero reported vulnerabilities
  with `npm audit --omit=dev`.
- Unit/API tests cover permissions, API MFA/origin guards, bounded request bodies,
  failed MFA providers, signed recovery markers, validation and redirects.
- Disposable PGlite PostgreSQL tests install all 11 migrations and exercise real
  RLS/functions: two tenants, all roles, suspended owners, MFA assurance, private
  documents, team profiles, property transactions, unit edits, overlapping dates,
  invitation replay and role escalation, last-admin invariants, shared rate limits.
- Chromium tests use a local production build with an unreachable dummy backend:
  CSP/hydration, sign-in failure, dashboard redirect, disabled signup, API access,
  recovery failure, and health-check failure. These do NOT prove successful hosted
  Supabase sign-in, SMTP delivery, or authenticated browser CRUD.
- Type checking, linting and migration-journal validation. One existing TanStack
  Table/React Compiler warning remains; compilation safely skips that library.

## Confirmed release blockers

| Requirement | Observed state / action |
| --- | --- |
| Vercel access | Project `staypilot`, team `bnbpilot-team`: project inspection denied (403); CLI has no authenticated session. Reconnect a principal with access. |
| Invite-only Auth | Sydney Supabase project `mmewrudedcifohamfetc` returns `disable_signup=false` and `mailer_autoconfirm=true`. Disable public signup and require email confirmation before inviting users. |
| Admin MFA | 3 privileged memberships; no privileged users with verified factors in the inspected database. Enroll admins before enabling enforcement. |
| Runtime configuration | Local environment lacks canonical app URL, service-role key, health secret, and MFA deadline. Vercel values could not be inspected. Configure these in the deployment environment; never commit them. |
| Migration | Live Drizzle history contains 10 entries; this branch adds `0010_production_security`. Validate on staging, then apply through Drizzle before deploying this code. |
| Staging acceptance | Successful real sign-in, MFA, invite email/acceptance, password recovery and property/guest/owner/booking CRUD remain unverified. |
| Operations | SMTP delivery, backup/restore drill, uptime monitor, alert routing, deployment checks, and rollback need live evidence. |

GitHub `main` had no branch protection at inspection time. Enable the required
CI check before merging this candidate; do not treat a green local build as a
release gate.

The production database reports PostgreSQL 17.6.1.166. Review the supported
17.11 security upgrade with Supabase before release. See the
[provider upgrade advisory](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).
Do not perform a database upgrade without a backup, maintenance plan and validation.

## Release order

1. Configure a dedicated staging Supabase project with production-equivalent Auth
   settings and SMTP. Add the staging HTTPS callback URLs for `/auth/confirm` and
   `/auth/recovery`. Avoid broad wildcard redirect URLs in production.
2. Set Node.js 22.x on Vercel. Configure `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and a random `HEALTHCHECK_SECRET` of at least 32
   characters. The health secret also signs recovery cookies; rotating it expires
   pending recovery markers. `DATABASE_URL` belongs in the migration environment,
   not browser variables. Preview environments must use a staging backend and
   their own canonical `NEXT_PUBLIC_APP_URL`.
3. Apply migrations to staging: `npm run db:migrate`. Do not use `db:push` or mix
   the Drizzle journal with Supabase migration history. Migration 0010 introduces
   private tables outside the Drizzle-generated schema snapshots; preserve its
   custom SQL on future schema generation.
4. Enroll privileged users at `/mfa/enroll`, verify AAL2, and retain a tested
   recovery-capable administrator. Set `MFA_ENFORCEMENT_DATE` to a past ISO date
   and, using the migration/admin database connection, enable the database gate:

   ```sql
   UPDATE private.security_settings SET require_admin_mfa = true WHERE singleton;
   ```

   The app deadline does not configure the database. Both gates are required;
   otherwise direct PostgREST calls by unenrolled administrators bypass the app
   deadline. Existing verified factors require AAL2 regardless of this rollout.
5. Run `npm run check:production` with the intended deployment environment. It
   checks configuration only and does not replace hosted acceptance tests.
6. Exercise two workspaces and each role in staging. Verify invitation send,
   verified-email acceptance, revoked/expired invitations, reset email and new
   password, MFA, sign-out, property/unit/pricing persistence, guest and owner
   edits, booking edit/cancellation, overlap rejection, and suspended-user denial.
7. Require GitHub check `Verify production build` on the protected main branch
   and in Vercel Deployment Checks. CI alone does not prevent Vercel Git deploys
   from becoming production. Review the full dependency audit as well as runtime
   audit; development-only advisories remain (see below).
8. Confirm backup retention and successfully restore to an isolated database.
   Apply the same reviewed migration to production; stage a production deployment
   without assigning the production domain; verify it, then promote it.
9. Configure an external uptime probe on `/api/health` with a secret Authorization
   header. Alert on non-200 status, elevated 5xx and latency. Route structured
   `request_failed`, `rate_limit_backend_unavailable`, and `audit_event_failed`
   logs to an operator. Confirm Auth audit logs and test alert delivery.

## Deployment compatibility and rollback

The new code requires migration 0010 and `SUPABASE_SERVICE_ROLE_KEY` for rate
limits. Missing configuration fails closed: login and protected write requests
will not proceed. The code must not be deployed ahead of its database changes.
Rate limits use shared PostgreSQL counters, not per-process memory. On Vercel,
the platform's overwritten IP header supplies the network bucket. Other hosts
use a shared conservative bucket until their trusted proxy is integrated.

Migration 0010 keeps the old property RPC compatible. For an application rollback,
promote the previously verified Vercel deployment; preserve database data and the
security migration. Confirm that old code honors required MFA before reopening
access. Do not drop tables or run reverse schema migrations as a routine rollback.

PGlite proves SQL behavior, but not concurrent hosted transactions, PostgREST
schema exposure, Supabase Auth HTTP behavior, or email delivery. Verify those on
staging. Membership mutations now serialize on an organization advisory lock;
exercise concurrent admin changes on the real staging database as part of release.

## Known limitations and follow-up

- The full npm audit still reports tooling advisories in the `braces`/Next ESLint
  dependency chain and old esbuild bundled by Drizzle. Runtime audit is clear.
  Do not run lint/dev tooling as a public service or process untrusted glob input;
  upgrade when compatible upstream patches are available. Do not force-downgrade
  Next/Drizzle to satisfy npm's suggested incompatible fixes.
- Leaked-password protection is disabled in the inspected Supabase project.
  Enable it if supported by the account plan; review password and Auth rate limits.
- Some intentional authenticated SECURITY DEFINER RPCs remain and carry explicit
  tenant/role checks. Anonymous access to the sensitive helpers is revoked.
  Supabase also flagged the existing public `btree_gist` extension; schedule its
  schema relocation with the database maintenance rather than blindly moving it.
- Ordinary audit writes in several services remain best-effort; failure is logged.
  Property creation and team/booking RPC mutations include transactional audits.
- A user-facing successful invite for an existing Auth account needs a separately
  verified onboarding path; the existing implementation returns delivery failure.
  Validate the approved-user onboarding scenario with your operational accounts.
