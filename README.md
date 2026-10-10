# StayPilot Operations

Internal, multi-tenant short-term rental operations platform for a controlled Gurgaon/Gurugram launch.

## Included in the internal MVP

- Next.js 16, TypeScript strict mode, Tailwind CSS 4
- Supabase Auth with SSR-safe browser/server clients and session-refresh proxy
- PostgreSQL schema and Drizzle migrations
- Organization tenant isolation using PostgreSQL Row Level Security
- Roles: `super_admin`, `admin`, `operations`, `owner`, `vendor`
- Invite-only workspace selection and team administration
- Property, owner, guest, booking, and calendar workflows
- One rentable unit created atomically with each property; the schema supports multiple units later
- Booking overlap prevention at the database layer
- Password recovery and gradual TOTP MFA enforcement
- Append-only audit records for security and core operational mutations
- Versioned `GET`/`POST /api/v1/properties` route

Cleaning, maintenance, expenses, reporting, import/export, owner payouts, channel integrations, AI, and messaging remain clearly marked as future work.

## Local setup

Prerequisites: Node.js 22.12+ (22.x; see `.nvmrc`) and a Supabase project.

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. In Supabase, open **Project Settings → API** and set:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   For older Supabase projects, the legacy anon key can be used as the publishable key.

3. In **Project Settings → Database**, copy the URI connection string and set `DATABASE_URL`. It is used only by Drizzle migration and administrative scripts; it is never exposed to the browser.

   For invitations and shared auth/API rate limits, configure `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret. Set `NEXT_PUBLIC_APP_URL` to the canonical application origin and generate a high-entropy `HEALTHCHECK_SECRET` (also used to sign password-recovery markers). Never expose the service-role or database credentials through a `NEXT_PUBLIC_` variable. Missing rate-limit configuration fails closed, including at sign-in.

4. Apply the schema and security migration:

   ```bash
   npm run db:migrate
   ```

5. In **Authentication → URL Configuration**, add these redirect URLs:

   ```text
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/recovery
   ```

   Add the equivalent HTTPS URLs for the production domain when you deploy.

6. In **Authentication → Providers → Email**, enable Email and disable public user signup. Configure production SMTP before relying on invitations or password recovery. For local Supabase, the checked-in configuration already disables signup and enables TOTP.

7. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` and sign in with an approved account that already has an active organization membership. New teammates are added from **Team & Security**.

## Useful commands

Production release prerequisites, verified coverage, rollout order and remaining
live blockers are tracked in [the release record](docs/production-readiness.md).

```bash
npm run dev          # local server
npm run lint         # ESLint
npm run build        # production build
npm run db:generate  # create a future Drizzle migration after a schema change
npm run db:check     # validate migration history
npm run db:migrate   # apply migrations from drizzle/
npm run check        # lint, types, unit/API + isolated DB tests, audit, build
npm run test:e2e     # rebuild with dummy backend, then Chromium security smoke tests
npm run check:production # validate production configuration (no writes)
```

The demo seed and clear commands are intentionally guarded. Before running either, set `DEMO_ORGANIZATION_ID` to the exact target workspace UUID and set `DEMO_DATA_CONFIRM=ALLOW_DEMO_DATA_MUTATION` for that single shell/session. Never add those confirmation values to production deployment variables.

## Security model

StayPilot is configured as an internal, invite-only application:

- The sign-in form authenticates existing Supabase users only; failed sign-ins never create accounts.
- `/sign-up` and self-service workspace creation are disabled.
- Users without an active organization membership cannot enter the dashboard.
- Workspace selection is verified server-side before the active-workspace cookie is written.
- PostgreSQL Row Level Security enforces organization and role boundaries even for direct API calls.

Create or invite approved users in Supabase Authentication, then add an active `organization_members` record with the appropriate role. For production, keep **Allow new users to sign up** disabled in Supabase Authentication settings and configure Supabase Auth rate limits/CAPTCHA as appropriate.

Every tenant-owned record contains `organization_id`. The first migration enables RLS on all Phase 1 tables and provides a narrowly scoped RPC for property creation:

- `create_property_with_unit` confirms an admin role, creates the property and its first rentable unit in one transaction, then writes an audit log.

The original self-service organization creation RPC is revoked by the security-lockdown migration. The application uses Supabase’s authenticated client for all runtime data access, so RLS remains effective. The direct `DATABASE_URL` is reserved for migrations and local administrative scripts; it must remain server-only.

### Password recovery, invitations, and MFA

- Password recovery: `/forgot-password` → Supabase recovery email → `/auth/recovery` → `/auth/reset-password`. Responses never reveal whether an email exists.
- Invitations: admins invite users from **Team & Security** (`/dashboard/team`). Supabase Auth Admin operations run only in server-only modules using `SUPABASE_SERVICE_ROLE_KEY`.
- MFA: TOTP is supported for `super_admin`/`admin`. Set `MFA_ENFORCEMENT_DATE` (ISO 8601) only after at least one administrator has verified enrollment. Before that date—or when unset—administrators without a factor are allowed through for a safe rollout. Once a user enrolls a factor, that user must verify at AAL2.

### Monitoring

- **Supabase → Authentication → Audit Logs / Reports**: authoritative record of sign-in, sign-out, recovery, and MFA events.
- **Supabase → Logs**: Auth, PostgREST, and database errors.
- **Vercel → Logs**: route and Server Action failures, latency.
- **`GET /api/health`**: protected uptime probe. Send `Authorization: Bearer <HEALTHCHECK_SECRET>`. Returns `200 {"status":"ok"}` when healthy, `401` when unauthenticated, `503` when connectivity fails. It never exposes credentials, URLs, schema, or tenant data. Point an external uptime monitor at it.
- Recommended alerts: repeated failed logins, privileged membership changes, MFA removal, large exports, and elevated 5xx/latency.

## Project structure

```text
src/
  app/                 # App Router pages, Route Handlers, Server Actions
    api/v1/properties/ # Versioned property API
    dashboard/         # Protected property operations workspace
  components/          # UI grouped by domain
  lib/                 # environment, permissions, Supabase clients
  server/              # auth context, Drizzle schema, property services/validation
  proxy.ts             # SSR session refresh and optimistic route protection
drizzle/               # generated SQL migration + snapshots
drizzle.config.ts      # Drizzle configuration
.env.example           # safe environment template
```
