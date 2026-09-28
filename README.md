# StayPilot Operations

Internal, multi-tenant short-term rental property-management platform. Phase 1 establishes secure organization workspaces, authentication, RBAC, and the properties foundation for a Gurgaon/Gurugram launch.

## Included in Phase 1

- Next.js 16, TypeScript strict mode, Tailwind CSS 4
- Supabase Auth with SSR-safe browser/server clients and session-refresh proxy
- PostgreSQL schema and Drizzle migrations
- Organization tenant isolation using PostgreSQL Row Level Security
- Roles: `super_admin`, `admin`, `operations`, `owner`, `vendor`
- First-workspace onboarding; the creator becomes `super_admin`
- Property list, property detail, and validated property creation
- One rentable unit created atomically with each property; the schema supports multiple units later
- Append-only audit records for organization and property creation
- Versioned `GET`/`POST /api/v1/properties` route

Bookings, AI, channel integrations, cleaning, expenses, owner payouts, and messaging are intentionally not part of this phase.

## Local setup

Prerequisites: Node.js 20.9+ and a Supabase project.

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

3. In **Project Settings → Database**, copy the URI connection string and set `DATABASE_URL`. It is used only by Drizzle migration commands; it is never exposed to the browser.

4. Apply the schema and security migration:

   ```bash
   npm run db:migrate
   ```

5. In **Authentication → URL Configuration**, add these redirect URLs:

   ```text
   http://localhost:3000/auth/confirm
   http://localhost:3000
   ```

   Also add your deployed application URL and `/auth/confirm` URL when you deploy.

6. In **Authentication → Providers → Email**, enable Email. For local testing, disable confirmation temporarily or use the confirmation email workflow implemented at `/auth/confirm`.

7. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`, create an account, confirm the email if required, create your organization, then add your first property.

## Useful commands

```bash
npm run dev          # local server
npm run lint         # ESLint
npm run build        # production build
npm run db:generate  # create a future Drizzle migration after a schema change
npm run db:check     # validate migration history
npm run db:migrate   # apply migrations from drizzle/
```

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
