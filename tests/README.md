# Security Test Suites

## Unit tests (run in CI and locally)

`npm test` runs pure-logic security tests with Vitest:

- `src/lib/permissions.test.ts` — role/permission matrix, super_admin assignment guard
- `src/lib/auth/mfa.test.ts` — MFA requirement and AAL gate decisions
- `src/lib/safe-redirect.test.ts` — open-redirect prevention
- `src/lib/auth/password-recovery.test.ts` — recovery redirect + marker + canonical origin
- `src/server/audit/sanitize.test.ts` — audit metadata secret stripping

These require no database and never touch production.

## Integration, RLS, and E2E tests (disposable Supabase only)

The following suites MUST run against a disposable local Supabase project or a
dedicated test project — never production. They require:

- `SUPABASE_TEST_URL`, `SUPABASE_TEST_SERVICE_ROLE_KEY`, `SUPABASE_TEST_DB_URL`
- A safety guard that refuses to run if the target host matches the production
  Supabase project ref.

Planned coverage (tasks 8.3–8.5):

- Password recovery request/exchange/reset with valid and invalid sessions
- Invitation reserve → send → accept, including expiry, replay, and revocation
- Membership invariants: role hierarchy, self-suspension block, last-super-admin
- Two-organization RLS matrix across every role/status for properties, owners,
  guests, bookings, invitations, and memberships
- Forged cross-tenant identifiers rejected on read and write
- MFA enrollment/verification gates (AAL1 vs AAL2)
- Suspended/invited member cannot obtain active context or tenant data

E2E (Playwright) covers login/logout, forgot/reset password, invitation
acceptance, unauthorized dashboard/Team access, and MFA flows.

> These suites are intentionally excluded from `npm test` (see `vitest.config.ts`)
> so the default command cannot accidentally run against a live database.
