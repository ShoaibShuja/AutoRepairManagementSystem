# Hashimi Pro Project Guide

## What this system does

Hashimi Pro is a staff-only system for one car wash and auto repair shop. It records customers and vehicles, schedules appointments, manages work orders and parts, tracks stock, creates offline invoices, and shows basic operational reports. It does not provide online payments, customer accounts, public bookings, multi-location support, SMS, or marketing automation.

## Who uses it

- **Administrator:** manages staff accounts, service catalog entries, inventory settings and cost data, reports, and all operational records.
- **Front desk:** manages customers, vehicles, appointments, work orders, invoices, payments, inventory, and reports. It cannot manage staff accounts.
- **Technician:** opens assigned jobs only, records technical notes, changes permitted job statuses, records parts used, and uploads before, damage, and after files only for assigned work orders.

Staff sign in at `/login` with their work email and password or a magic link. There is no public registration. Disabled accounts are denied access even if they still have an old browser session.

## Daily use

### Front desk

1. Create or find a customer in **Customers**. Search matches normalized customer names and phone digits. Use **Add customer** to open the customer form, then add the customer’s vehicle from their record.
2. Create an **Appointment** with the customer, vehicle, at least one service, and times. Technician assignment and notes are optional. Use the daily appointment queue to choose a date and status, then open a record to reschedule or update it.
3. Convert a checked-in appointment to a **Work order**, or create a work order directly. Assign a technician and follow its status through completion.
4. In **Inventory**, select **Adjust stock** for the relevant part. Add received stock with a positive amount. Administrators can select **Correct count** only when the physical count differs; use a signed amount and always record the reason.
5. After a work order is completed, create its **Invoice**. Record one full cash or card-in-person payment, or void an unpaid invoice with a reason. Use the browser print command to print or save the invoice as PDF.

### Technicians

1. Open **My work** to see only assigned jobs.
2. Open a job, review its concern and services, add technical notes, and move it through the permitted statuses.
3. Confirm each part actually used. This deducts stock atomically. Reverse an incorrect use with a reason instead of editing history.
4. Do not share job links or attempt to access other work orders. The application and database limit access to assigned work.

### Administrators

1. Use **Staff** to create accounts, assign a role, or deactivate an account. Keep at least one active administrator.
2. Use **Services** to manage catalog prices and durations. Existing work orders and invoices retain their original snapshots.
3. Use **Inventory** to set reorder thresholds, restock, and review low-stock parts. Only administrators can set cost information or make stock corrections.
4. Use **Reports** and the dashboard for collected-payment, work, and low-stock summaries. Revenue means recorded offline payments, not issued invoices.

## Important settings

| Change                                                                  | Where and how                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shop name, phone, address, invoice prefix, sequence, currency, timezone | `public.business_settings` in Supabase. Change only with an administrator-approved SQL procedure or future settings screen; these affect historical operations and invoice numbering.                                                                                                                        |
| Currency/timezone defaults                                              | `src/config/app.ts`. The app currently uses AFN minor units and `Asia/Kabul`. Staff enter prices as ordinary AFN amounts such as `1500` or `1500.50`; the server converts them to integer minor units. Changing currency or timezone after production data exists requires a migration and financial review. |
| Light primary and secondary colors                                      | `src/app/globals.css`. The current premium blue palette is defined through `--brand-primary` and `--brand-surface`, plus their foreground variables. Replace only these semantic tokens when final brand colors are approved.                                                                                |
| Display mode                                                            | Use the sun/moon control on the sign-in screen or protected workspace header. The preference is stored only in that browser and applies to the full application.                                                                                                                                             |
| Service catalog                                                         | **Services** as an administrator. Archive instead of deleting services with history.                                                                                                                                                                                                                         |
| Low-stock thresholds                                                    | **Inventory** on the individual part. Low stock means quantity on hand is less than or equal to the threshold.                                                                                                                                                                                               |
| Email and magic links                                                   | Supabase Dashboard Auth settings and the deployment environment variables below. Resend is not installed or required.                                                                                                                                                                                        |

Do not casually change applied migration files, invoice sequence fields, the currency precision, RLS policies, private bucket policies, or `SUPABASE_SERVICE_ROLE_KEY`. Those changes can break security, invoice history, or deployment recovery.

## Project folders

- `app/`: thin Next.js route entrypoints.
- `src/app/`: page, layout, loading, and error implementations.
- `src/features/`: business actions, schemas, and feature UI for auth, CRM, appointments, work orders, inventory, invoices, and staff.
- `src/components/`: shared app shell, operational controls, and UI primitives.
- `src/lib/`: auth guards, Supabase clients, environment validation, dates, and formatting.
- `src/config/`: application defaults.
- `src/types/`: maintained Supabase database types.
- `supabase/migrations/`: append-only database and Storage changes.
- `supabase/seed.sql`: synthetic local catalog and inventory seed only.
- `supabase/demo-seed.sql`: larger, SQL Editor-ready fictional dataset for local or non-production demos. It must never be run against production or real customer data.
- `tests/`: Vitest unit/component tests and Playwright foundations.
- `docs/`: durable operating and implementation documentation.

## Run locally

1. Install Node.js **22** and Docker Desktop. Use **npm** because `package-lock.json` is committed.
2. Run `npm install`, copy `.env.example` to `.env.local`, and add local or hosted Supabase values.
3. For a local database, run `npm run supabase:start`, `npm run supabase:reset`, then `npm run supabase:types`.
4. Run `npm run dev` and open `http://localhost:3000`.

Useful checks:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`test:e2e` needs `npx playwright install chromium` first. Formatting is enforced with `npm run format:check`.

## Deploy to Vercel and Supabase

### 1. Create the Supabase production project

1. Create a new Supabase project in the intended production region. Do not reuse local credentials.
2. In **Auth > Providers**, keep email enabled and public sign-up disabled. Require strong passwords and configure your production SMTP provider before relying on email delivery.
3. In **Auth > URL Configuration**, set the Site URL to `https://your-domain.example` and add `https://your-domain.example/auth/callback` as a redirect URL. Add preview URLs only when you deliberately need magic links in previews.
4. Apply migrations from a clean, reviewed working tree using the release procedure below. Do not paste migration SQL manually into the dashboard.
5. Confirm both `vehicle-attachments` and `invoice-pdfs` buckets are private, have the committed size/MIME limits, and retain the migrated Storage policies.
6. Create the first administrator only through the secure bootstrap procedure in the Supabase Dashboard or a server-only Admin API session. Never use browser user metadata to grant a role.

### 2. Configure Vercel

1. Import the repository and use the reviewed `main` branch for staging. Promote the same reviewed commit to production only after every release gate passes.
2. Vercel detects Next.js automatically. Use **Install Command** `npm ci`, **Build Command** `npm run build`, and Node.js **22**.
3. Configure the variables for Production, Preview only when required, and Development as appropriate:

| Variable                               | Where                 | Notes                                                                                                                                                     |
| -------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser-safe          | Production project URL.                                                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe          | Production publishable/anon key.                                                                                                                          |
| `NEXT_PUBLIC_APP_URL`                  | Browser-safe          | Exact canonical HTTPS URL, no trailing path.                                                                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only           | Production secret; required for administrator staff provisioning and Auth bans only. Never expose it to the browser, logs, Git, or Preview unless needed. |
| `RESEND_API_KEY`                       | Server-only, optional | Do not add until appointment email is implemented. Resend is not used today.                                                                              |

4. Deploy. No `vercel.json` is required by this repository. Do not mark the deployment successful until the health checks below pass.

### 3. Production health check

1. Visit `/login`; confirm no application error and password/magic-link controls render.
2. Sign in as a test administrator and verify dashboard, staff list, services, inventory, and reports.
3. Sign in as test front desk and technician accounts. Verify role-specific navigation and denied access for forbidden pages.
4. Create only synthetic test records: appointment, work order, part use, completed invoice, and one cash payment. Print the invoice and verify its number and amount.
5. Check Supabase logs for Auth, database, and Storage errors. Check Vercel deployment and function logs for server failures.
6. Delete or archive synthetic records according to shop policy; never use real customer data for a first deployment test.

## Migration and release procedure

### Local database

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:types
npm run lint
npm run typecheck
npm test
npm run build
```

`supabase:reset` rebuilds the local database and loads synthetic seed data. It is destructive to the local Supabase database only. Never point it at production.

### Production database

1. Back up the production database and note the current migration history.
2. Review `git diff`, migration filenames, and release checks. Each change must be a new timestamped migration.
3. Link the Supabase CLI to the production project with an owner-approved session, then run `npx supabase db push --linked`. Confirm the linked project reference is production before running it.
4. Verify applied migration entries in Supabase migration history and run the production health check.
5. Regenerate types against local schema after a local reset with `npm run supabase:types`; review and commit the generated type changes separately.

`20260720000450_appointment_statuses.sql` must run and commit before `20260720000500_appointment_workflow.sql`. PostgreSQL does not allow a newly added enum value to be used by an index or function in the same transaction.

`20260720000600_inventory_workflow.sql` depends on the low-stock and inventory-movement indexes created by the core schema and must not recreate them.

If a deployment fails, stop new operational changes, keep the previous Vercel deployment available, inspect Vercel/Supabase logs, and fix forward with a new migration or application commit. Never edit or delete an applied migration, force-push, or manually alter migration history to “make it green.”

## Backups and maintenance

- **Supabase backups:** configure the project plan and retention in Supabase Dashboard. Record who can restore, the retention period, and where the restore test is documented.
- **Exports:** use a controlled database export only for approved recovery or reporting. Protect customer data and do not place exports in the repository.
- **Storage:** database backups do not automatically prove that private vehicle files are recoverable. Periodically test access to a known authorized file and document the bucket/object recovery procedure for your Supabase plan.
- **Restore test:** at least quarterly, restore a recent backup into a separate non-production project and verify sign-in, a customer record, an invoice, and a private-file policy. Do not point production Vercel variables at the restored project.
- **Dependencies and security:** monthly, review Dependabot/GitHub alerts, run `npm ci`, checks, and a build in a branch. Update intentionally, not during an incident.
- **Failed builds:** open Vercel deployment logs first, reproduce with `npm ci` and `npm run build`, then inspect environment-variable names without printing secret values.
- **Low stock:** review dashboard/inventory low-stock records daily; restock through the normal workflow and use corrections only for verified count differences.
- **Staff removal:** deactivate the profile in **Staff**; do not delete users with operational history. Confirm the person can no longer sign in.
- **Email:** check Supabase Auth email logs, SMTP sender/domain settings, Site URL, redirect URLs, and `NEXT_PUBLIC_APP_URL`. Resend has no effect until an email feature is implemented.
- **Invoices:** monthly, create a synthetic completed work order in a non-production environment, generate an invoice, record a test offline payment, and verify the next invoice number and printed amount.

## Development history and current limits

Implemented phases cover authentication/RBAC, CRM, catalog, work orders, appointments, inventory, offline invoicing, reporting, private attachment upload/preview/archive, scoped Realtime refresh, production database hardening, and a role-safe premium operational dashboard. Staging database/RLS/Storage tests and critical-path E2E validation remain release gates. See `PROJECT_STATE.md` for the current verified state.

## Troubleshooting

| Problem                              | Action                                                                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Missing Supabase values”            | Copy `.env.example` to `.env.local`; fill the two public Supabase variables and restart the dev server.                                                          |
| Magic link returns to the wrong site | Set `NEXT_PUBLIC_APP_URL`, Supabase Site URL, and `/auth/callback` redirect URL to the same HTTPS domain.                                                        |
| User is denied after sign-in         | Confirm the profile is active and has the expected role. Do not change roles in browser metadata.                                                                |
| Local migration fails                | Start Docker Desktop, run `npm run supabase:start`, inspect the first failing migration, and add a new migration if a prior one is already applied elsewhere.    |
| Invoice or stock operation fails     | Refresh the record, verify its legal status and stock, then check the Supabase database logs. Do not edit ledger rows directly.                                  |
| Private file is inaccessible         | Confirm the bucket is private, the attachment is not archived, the record is assigned to the technician where applicable, and Storage policies match migrations. |
| Build fails on Vercel                | Verify Node 22, `npm ci`, environment-variable names, and Vercel logs. Reproduce locally with `npm run build`.                                                   |
| Playwright cannot run                | Install Chromium with `npx playwright install chromium`.                                                                                                         |
