# Automation setup: draft stage only

Workspace administrators can open **Settings → Automation & integrations** to
save channel preferences, draft confirmation/reminder wording, and reminder
lead time. Samples use synthetic guest/property data. Saving does not send
messages, create jobs, import reservations, or change inventory.

This is not a WhatsApp connector or calendar synchronizer. There are no live
credentials, connection verification, send endpoints, workers or activation
switches in this release. Do not store credentials, private feed URLs or guest
data in message drafts.

## Storage and security

Apply the repository's Drizzle migration `0013_automation_setup` to the intended
database before deploying. Never point a migration at Sydney/Production merely
because `.env.local` defaults there. Use the reviewed Mumbai Preview target.

`automation_drafts` contains non-secret configuration only. Explicit grants and
RLS restrict it to active workspace administrators and respect the existing MFA
gate. The workspace ID is derived from the authenticated session. Versioned
updates reject stale edits. A private trigger records an atomic, metadata-only
audit without storing message contents in the audit log. No service-role key is
used by the setup page or action.

## WhatsApp activation work remaining

1. Select/provision the real Business Platform provider and business sender.
2. Store credentials server-side and verify the connection with the provider.
3. Implement guest opt-in records, opt-out processing and approved templates.
4. Add authenticated, signature-verified webhooks and delivery state tracking.
5. Implement a durable outbox, rate limits, duplicate prevention, cancellation
   handling, timezone-aware reminders and safe treatment of ambiguous sends.
6. Test with an explicitly approved test recipient, then approve live activation.

The draft variable syntax is internal, not provider-approved template syntax.
Provider selection may require mapping these drafts to provider templates.

## Calendar activation work remaining

1. Obtain private calendar exports for each eligible Airbnb/Booking.com listing.
2. Add protected, encrypted feed storage and explicit property mappings.
3. Implement bounded iCalendar parsing, SSRF-safe fetching, timezones and
   exclusive end-date handling. Reject unsupported recurrence rather than
   silently losing dates.
4. Separate external availability blocks from guest reservations. Do not invent
   guest names, contact details, prices or cancellation facts from unavailable data.
5. Add idempotent imports, conflict review, cancellation/reconciliation rules,
   sync history and a scheduler supported by the hosting plan.
6. Test changed dates, retries, empty/malformed feeds and concurrent bookings
   against test properties before enabling scheduled imports.

An iCalendar feed is not a full channel-manager API and cannot guarantee
instantaneous updates or prevent every double booking.

Reference: [Airbnb calendar sync](https://www.airbnb.com/help/article/99).

## Verification

Run `npm run typecheck`, `npm test`, `npm run test:db`, `npm run lint`,
`npm run db:check` and `npm run build`. Database tests run in disposable in-memory
PostgreSQL and cover tenant/role isolation, MFA, stale updates and audit rollback.
After deployment, verify admin draft save/reload and non-admin denial in a real
signed-in session. A successful build is not an end-to-end integration test.
