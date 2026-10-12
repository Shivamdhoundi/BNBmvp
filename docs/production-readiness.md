# Production release record

Scope: invite-only StayPilot operations, now including manual cleaning and
maintenance tasks, expense recording/voiding, completed-stay operating reports,
workspace settings, audited CSV exports and previewed guest CSV imports.
This is not the full product: payouts, channel sync, messaging, AI, automatic
turnover generation and property/booking/owner imports remain unfinished.

Status on 2026-10-13: **release candidate; NOT approved for production**.
Code changes are on `production-hardening`. Mumbai migrations 0000–0014 are
applied (15 journal entries). Preview is deployed separately from the older main
production release. WhatsApp/calendar configuration is draft-only, not automation.

## Latest verification — 2026-10-13

- Fixed missing authenticated column grants that prevented core writes on Mumbai.
  Existing RLS remains enabled; direct booking updates still require audited RPCs.
- 123 unit/API tests, 72 database tests under EACH of explicit-only and legacy
  default grants, and 13 local production-build Chromium smoke tests pass.
  Typecheck, lint and migration checks pass; one existing compiler warning remains.
- 11 hosted SQL checks pass on Mumbai: owner, property/unit/amenity, guest,
  booking edit/cancel, cleaning task, expense void, report, idempotent guest import,
  settings/draft, cross-workspace read denial, and rollback verification.
  Synthetic records are always rolled back. This does NOT test browser sessions,
  PostgREST exposure, real Auth sign-in, MFA enrollment, or SMTP delivery.
- Fixed health probe to use a server-only client after bearer authorization;
  anonymous table access is intentionally denied and must not indicate an outage.
- Pre-migration custom archive saved locally at
  `/tmp/staypilot-mumbai-pre-grants-kxa665/mumbai.dump` (368295 bytes), SHA256
  `23d65ff3623ad24411af816dd5da8d76e86cbfb0c42843f92b49e45bdab835dc`.
  Archive listing is readable. This temporary local copy is NOT a restore drill,
  durable off-site backup, or retention policy.

## Verified locally

- Next.js 16.3.8; locked runtime dependencies have zero reported vulnerabilities
  with `npm audit --omit=dev`.
- Unit/API tests cover permissions, API MFA/origin guards, bounded request bodies,
  failed MFA providers, signed recovery markers, validation and redirects.
- Disposable PGlite PostgreSQL tests install all 15 migrations and exercise real
  RLS/functions: two tenants, all roles, suspended owners, MFA assurance, private
  documents, team profiles, property transactions, unit edits, overlapping dates,
  invitation replay and role escalation, last-admin invariants, shared rate limits.
- Unit/action/API and database coverage includes task
  assignment and stale-update rejection, vendor scoping, immutable/void expenses,
  owner-scoped exact-decimal report totals, settings protection, CSV formula
  neutralization, bounded exports, and atomic/idempotent guest import.
- All 13 Chromium smoke tests pass using a local production build with an unreachable dummy backend:
  CSP/hydration, sign-in failure, dashboard redirect, disabled signup, API access,
  recovery failure, and health-check failure. These do NOT prove successful hosted
  Supabase sign-in, SMTP delivery, or authenticated browser CRUD.
- Type checking, linting and migration-journal validation. One existing TanStack
  Table/React Compiler warning remains; compilation safely skips that library.

## Confirmed release blockers

| Requirement | Observed state / action |
| --- | --- |
| Vercel access | Project `staypilot`, team `bnbpilot-team`: deployment/env metadata accessible, but runtime logs return 403 and CLI has no authenticated session. Restore scoped access for live investigation. |
| Invite-only Auth | Mumbai `/auth/v1/settings` returns `disable_signup=false`, `mailer_autoconfirm=false`, and email auth enabled (2026-10-13). Disable public signup in provider settings; the app's disabled signup page alone does not protect the Auth API. Successful SMTP delivery still needs verification. |
| Admin MFA | Mumbai has 3 active privileged users and zero with verified factors; database enforcement is false. Enroll administrators before enabling both gates to prevent lockout. |
| Runtime configuration | Vercel list shows five variables, all Preview-only. Production settings, canonical app URL and MFA deadline are absent from that list. Configure intended environments with appropriate backend credentials. |
| Migration | Mumbai has 15 Drizzle entries through 0014; explicit-grant SQL workflow checks pass. A separately isolated staging backend remains needed for browser acceptance. |
| Staging acceptance | Successful real sign-in, MFA, invite email/acceptance, password recovery and property/guest/owner/booking CRUD remain unverified. |
| Operations | SMTP delivery, backup/restore drill, uptime monitor, alert routing, deployment checks, and rollback need live evidence. |

GitHub `main` now requires the up-to-date `Verify production build` check from
the GitHub Actions app. Force pushes and branch deletion are disabled. Repository
administrators retain an override; Vercel Deployment Checks still need configuring
because GitHub protection alone does not control Vercel domain assignment.

The previously inspected Sydney database reported PostgreSQL 17.6.1.166. Review the supported
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
   the Drizzle journal with Supabase migration history. Migrations 0010 and 0012
   introduce private tables outside the Drizzle-generated schema snapshots;
   preserve their custom SQL on future schema generation. Snapshot 0011 also
   reconciles invitations and archive columns created by earlier custom SQL;
   it deliberately does not recreate those existing objects. A fresh schema
   generation reports no drift.
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
   deliberately does not load `.env.local`, rejects an explicitly non-Production
   Vercel environment and invalid origins, and never prints credentials.
   For an explicitly prepared, gitignored environment file, use
   `node --env-file=.env.production.local scripts/production-preflight.mjs`.
   Secret variables omitted by provider env pulls must still be supplied securely.
   This checks configuration only and does not replace hosted acceptance tests.
6. Exercise two workspaces and each role in staging. Verify invitation send,
   verified-email acceptance, revoked/expired invitations, reset email and new
   password, MFA, sign-out, property/unit/pricing persistence, guest and owner
   edits, booking edit/cancellation, overlap rejection, and suspended-user denial.
   Also verify task creation/reassignment/progress as operations and vendor users,
   expenses/void reasons, owner-visible reports, CSV downloads and formula safety,
   preview/import/re-import with rollback on invalid rows, and settings conflicts.
7. Keep GitHub check `Verify production build` required on main and configure
   it in Vercel Deployment Checks. CI alone does not prevent Vercel Git deploys
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

The new code requires migrations through 0014 and `SUPABASE_SERVICE_ROLE_KEY` for rate
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

- Operational reports count completed bookings by checkout date in the workspace
  reporting timezone, not collected cash. They exclude confirmed/pending/cancelled
  stays and void expenses. The difference is before fees/taxes, not owner payout
  or accounting profit. Base currency cannot be relabeled by authenticated clients.
- Task due dates are property-local calendar dates. Staff manage assignment and
  scheduling; vendors can only progress their own tasks. Automatic checkout
  turnovers, recurring tasks, attachments and outbound notifications are not built.
- CSV exports cover six datasets, are admin-only, audited and limited to 1,000
  rows in a creation-date window (up to 367 days). Truncated data is rejected.
  Directories/reports fail rather than display partial results if the backend
  response cap is exceeded. Add server-side search/paging before larger tenants.
- Guest import supports 200 rows / 128 KB, validates before confirmation and again
  on submission, and commits atomically with audit. Identical normalized batches
  are not applied twice. Existing emails (including archived records) are skipped;
  email-less guests in different batches can duplicate. No other entity imports.
- Full authenticated browser-to-PostgREST verification is still blocked on a
  dedicated staging target and deployment credentials; local SQL tests do not
  prove live RPC exposure. Provider discovery via the installed Vercel CLI also
  requested device authentication. No external provider has been provisioned.

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
