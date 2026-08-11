# Project State

Last updated: 2026-08-11
Current phase: Version 1 staging-release verification
Current branch: codex/simplify-inventory-adjustments
Current status: The version 1 release candidate, premium dashboard refinement, customer-directory UI refinement, customer-search fix, and simplified money inputs were merged to `main`. This branch simplifies inventory adjustments with no database changes; production deployment remains blocked until staging migration/RLS/Storage, browser acceptance, hosted Auth/SMTP, backup, and restore gates pass.

## Working Features

- Staff login with password or magic link, sign-out, auth callback, SSR session refresh proxy, protected dashboard, and access-denied route.
- Administrator-only staff directory with account creation, role assignment, activation, and deactivation controls.
- Shared TanStack Query provider and Sonner notification host.
- Semantic, neutral light-mode Tailwind CSS token system and a shadcn-compatible Button primitive.
- Responsive protected application shell with role-matched navigation, mobile navigation dialog, user menu, breadcrumb, skip link, dashboard placeholders, and route-level loading/error states.
- Shared operational display, form, filter, search, table, pagination, responsive record-card, status, and accessible confirmation-dialog primitives.
- Customer and vehicle records, archive/restore workflows, normalized name/phone/plate search, and a role-safe service catalog baseline.
- Work-order creation with server-captured catalog service snapshots, controlled transitions, concise activity history, technician workspace, and vehicle work history.
- Staff-managed appointment calendar with day/week interaction, mobile agenda, technician conflict controls, rescheduling, and work-order conversion.
- Immutable inventory movements, low-stock visibility, restock/correction operations, and confirmed work-order part usage with safe reversals.
- Offline invoices with database-generated numbering, service/part snapshots, payment and void lifecycle, and browser print-to-PDF layout.
- Role-scoped daily dashboard metrics and date-range essential operations reports.
- Browser and SSR Supabase client factories, with deferred runtime environment validation.
- Production hardening revokes public RPC execution and direct protected-table writes, preserves an active administrator, prevents concurrent active technician appointments, and checks invoice line-item totals.
- Release-candidate attachment support uploads only private, validated work-order files; registration verifies the work order vehicle, previews use signed URLs, and archive retains operational evidence.
- Route-scoped Realtime subscriptions refresh authoritative appointment, work-order, inventory, and dashboard data without appending duplicate records.
- Money display converts stored integer minor units using the configured AFN precision; work-order search applies before pagination.
- Unit/component test harness, Playwright foundation, formatting configuration, and GitHub Actions quality workflow.
- Beginner deployment, release, backup, recovery, and troubleshooting guide with explicit Vercel/Supabase configuration checklists.

## Architecture and Important Decisions

- Root `app/` files remain thin App Router entry points; implementations live in `src/app/`, and `@/*` resolves to `src/*`.
- Future domain code belongs in `src/features`; shared code belongs in `src/components`, `src/lib`, `src/config`, and `src/types`.
- The service-role credential remains server-only and is used only by administrator-authorized staff provisioning and Auth suspension actions.
- UI color values use semantic CSS variables. Approved brand colors can replace token values without component rewrites.
- Replace the temporary light brand colors only in `src/app/globals.css` (`--brand-primary`, `--brand-primary-foreground`, `--brand-surface`, and `--brand-surface-foreground`). Feature components must consume semantic Tailwind token utilities.

## Database and Migrations

- `20260720000100_core_schema.sql` creates the v1 enums, profiles, singleton settings, CRM, scheduling, work-order, inventory, invoice, payment, attachment, and activity-log tables; it also adds normalization/audit/profile triggers, indexes, RLS, and Realtime publication.
- `20260720000200_storage_policies.sql` creates private `vehicle-attachments` and `invoice-pdfs` buckets and path-aware storage policies.
- `20260720000400_work_order_workflow.sql` adds estimated completion/mileage, service-description snapshots, atomic creation/edit RPCs, lifecycle transitions, technician notes, and activity events.
- `20260720000450_appointment_statuses.sql` adds appointment `in_progress` and `completed` enum states in a separate committed migration before they are referenced.
- `20260720000500_appointment_workflow.sql` adds requested appointment services, assigned technicians, optimistic revisions, conflict checks, approved appointment transitions, and atomic work-order conversion.
- `20260720000600_inventory_workflow.sql` adds optional SKUs/categories, immutable inventory RPCs, initial-stock ledger entries, stock locks, usage reversals, and invoice-ready work-order part snapshots; it reuses the core inventory indexes.
- `20260720000700_invoicing_files.sql` adds atomic invoice generation, offline payments, invoice voiding, and private attachment registration constraints.
- `20260720000800_production_hardening.sql` revokes public RPC execution and direct protected-table mutations, retains authorized RPCs, prevents loss of the last active admin and overlapping active technician appointments, and adds financial consistency/index protections.
- `20260720000900_release_candidate_integrity.sql` verifies attachment vehicle/work-order consistency and adds authorized attachment archiving.
- All operational tables use RLS. Admin/front desk have operational access; technicians can read only assigned-work context. Inventory movements and activity logs are append-only.
- `src/types/database.ts` is maintained locally and must be regenerated with `npm run supabase:types` after a successful local reset.

## Recent Changes

- Replaced cluttered per-row inventory forms with a focused Adjust stock dialog. Front desk can add received stock; administrators can record signed, reason-required physical-count corrections. Both paths continue to create immutable inventory movements through the existing authorized RPCs.
- Simplified service and inventory price entry to normal AFN whole or decimal amounts and formatted catalog prices on the work-order form. Server actions convert valid staff input to exact integer minor units before database operations; whole amounts display without an unnecessary `.00` suffix.
- Fixed customer search so name-only input no longer expands into an empty phone predicate that matches the full phone directory. Search terms are normalized and special wildcard syntax is removed before the authorized database query.
- Reworked the customer directory with a primary add-customer dialog, a count-aware responsive record list, richer contact and activity details, and improved touch-sized search controls. Existing role guards, server validation, archive behavior, and customer search semantics are unchanged.
- Refreshed the dashboard and protected app shell with a premium blue service-bay visual system, role-safe command-center metrics, live follow-up panels, and direct operational links. The dashboard continues to use existing authoritative queries and never shows payment details to technicians.
- Added local Supabase CLI configuration, safe demo seed catalog/inventory data, and reset/type-generation scripts.
- Added server-side role helpers, an admin-only service-role client, auth/server actions, and basic protected staff administration.
- Added role-safe customer/vehicle CRUD, archive and restore flows, normalized customer/phone/plate searches, and service catalog management. Active vehicle plates are unique while archived vehicles no longer reserve their plate.

## Tests and Quality Checks

- Passed for the current inventory-adjustment branch: targeted Prettier checks, `npm run lint`, `npm run typecheck`, `npm test` (23 tests), `npm run build`, and `git diff --check`. The original release candidate also passed `npm ci` and repository-wide `npm run format:check` with 20 tests.
- Not executable in the release-candidate environment: Docker-backed Supabase reset/type generation/database-RLS-Storage tests; Chromium-based Playwright test (browser installation timed out).
- Required before production release: `npm ci`, `npm run format:check`, a clean `npm run build`, local Supabase reset/type generation, database/RLS/Storage tests, and Playwright critical-path checks.
- Production release is prohibited while a critical migration, database/RLS/Storage, browser, or external setup check is unverified.

## Known Issues and Technical Debt

- Optional Resend appointment email is intentionally not implemented.
- Hosted Supabase/Vercel deployment, backup retention, and restore verification remain owner-controlled external requirements.
- The maintained type baseline should be replaced by CLI-generated types after the first successful local database reset.
- Final light-mode brand colors have not been supplied.
- Vercel project, Supabase production project, SMTP sender, redirect URLs, backup retention, and restore runbook ownership require external owner configuration; no deployment credentials are committed or available here.

## Environment or Setup Notes

- Copy `.env.example` to `.env.local`; never commit `.env.local`.
- Browser-safe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, required for administrator-authorized staff provisioning and deactivation Auth bans.
- `NEXT_PUBLIC_APP_URL` is the canonical application origin used for magic-link callbacks.
- Use npm because `package-lock.json` is committed.

## Recommended Post-Deployment Checks

1. Validate staff sign-in, role boundaries, appointment-to-invoice workflow, private file access, Realtime refresh, and printed invoice with synthetic records.
2. Review Vercel and Supabase Auth, Database, and Storage logs after the first business day.
3. Record backup retention, restore owner, and a successful restore into a separate project before production data is onboarded.
