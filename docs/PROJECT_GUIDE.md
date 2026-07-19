# AutoCare Pro Project Guide

## 1. Project Overview

AutoCare Pro is a staff-only, single-location operations system for a car wash and auto repair business. The product supports `admin`, `front_desk`, and `technician` roles. Its baseline includes CRM/catalog, work orders, appointments, inventory, and offline invoicing.

## 2. Main Features

Planned features include staff authentication, customer and vehicle records, appointments, work orders, service catalog, inventory, invoices, offline payments, photos, and operational reporting. Online payments, customer self-service, multi-location support, and marketing features are intentionally excluded.

## 3. User Roles

- `admin`: manages staff, catalog, inventory, configuration, and all operational data.
- `front_desk`: manages operational records and reports but cannot administer accounts.
- `technician`: sees assigned work and can update permitted technical information only.

Permissions will be enforced by server-side checks and Supabase Row Level Security, not by navigation visibility.

## 4. How to Run the Project

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the Supabase browser values when a Supabase project is available.
4. Run `npm run dev` and open `http://localhost:3000`.

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`test:e2e` requires Playwright browsers, which can be installed with `npx playwright install chromium`.

For local Supabase development, install and start Docker Desktop, then run:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:types
```

`supabase:reset` applies every migration from an empty local database and loads only synthetic seed catalog/inventory data. Never alter an applied migration; add a timestamped migration instead.

## 5. Folder Structure

- `app`: thin Next.js route entry points required by the starter. They delegate to `src/app`.
- `src/app`: implementations for pages, layouts, loading states, and route-level error handling.
- `src/components`: reusable application components. `src/components/app-shell` owns protected navigation and shell behavior; `src/components/operational` owns shared page, state, display, form, table, filter, and dialog primitives; `src/components/ui` contains shadcn-compatible UI primitives.
- `src/features`: domain modules including `crm` and `work-orders`; keep feature-specific UI, schemas, actions, and queries together here.
- `src/lib`: shared utilities, environment validation, formatting helpers, and Supabase client factories.
- `src/config`: central application-wide configuration.
- `src/types`: shared TypeScript types. Supabase-generated database types will live here after the first migration phase.
- `supabase/migrations`: versioned v1 schema and Storage-policy migrations. Add new migrations only; never modify an applied migration.
- `tests`: unit/component tests and Playwright end-to-end tests.
- `docs`: durable project documentation and the approved implementation blueprint.

## 6. User Manual

Staff sign in at `/login` with their work email/password or a magic link. There is no public registration. Active accounts land on `/dashboard`; inactive or unauthorized accounts are denied before protected screens render. Administrators can open `/staff` to create accounts, assign `admin`, `front_desk`, or `technician`, and activate/deactivate staff. The administrator-set initial password is permanent unless the staff member changes it through Supabase Auth later.

## 7. Common Configuration Changes

Update `src/config/app.ts` for application defaults such as business timezone and currency. Replace the temporary light brand values in `src/app/globals.css`: `--brand-primary`, `--brand-primary-foreground`, `--brand-surface`, and `--brand-surface-foreground`. Keep every component on semantic token utilities; do not hard-code brand colors in components.

## 7.1 Authenticated UI conventions

Protected routes use the `(app)` layout and `AppShell`, which performs presentation-only role-aware navigation. Server-side `requireStaff` and `requireRole` remain authoritative. Use `PageHeader`, `SectionHeader`, `EmptyState`, `ErrorState`, `StatusBadge`, and loading skeletons for consistent operational screens. Use `DataTable` on desktop with `MobileRecordCard` alternatives on mobile. Shared dialogs provide Escape dismissal and a focused cancel action; destructive flows use `DestructiveActionDialog`.

The authenticated shell has a desktop sidebar, tablet-safe content layout, and an accessible mobile navigation dialog. Each protected page must preserve a single `h1`, landmarks, visible focus, and honest loading, error, empty, and permission states.

## 7.2 CRM and service catalog

Admin and front-desk staff manage customers at `/customers`. Search accepts a customer name or normalized phone number; shared family phone numbers are permitted. Customer records contain contact details, operational notes, vehicles, timestamps, and archive/restore controls. Vehicle records include plate, make, model, year, color, optional VIN and dated mileage, notes, archive/restore, and a work-order history placeholder. Active plate numbers are unique within the shop; archived vehicles no longer reserve a plate.

All staff can browse the service catalog at `/services`; only administrators can create, edit, archive, or reactivate services. Catalog prices are stored in integer minor units. Editing a catalog service never alters `work_order_services` snapshots, which keep their own service name and unit price.

## 7.3 Work orders, technician workspace, and vehicle history

Admin and front-desk staff manage work orders at `/work-orders`. Creation verifies customer/vehicle ownership, requires active catalog services, and captures service name, description, and integer-minor-unit price snapshots. Work-order numbers are identity-backed and rendered as `WO-000001`. Price adjustment is intentionally unavailable in this phase.

The lifecycle is `draft → assigned → in_progress → ready_for_review → completed → invoiced`, with cancellation from active operational states. Security-definer RPCs enforce transitions. Technicians can only transition their own assigned work from `assigned` to `in_progress` and from `in_progress` to `ready_for_review`; notes are appended only through a scoped RPC. Concise activity records cover creation, assignment, service changes, transitions, completion, cancellation, and technician notes.

Technicians use `/my-work` for active assigned jobs only. It contains vehicle context, concerns, services, notes, permitted actions, and explicit parts/photo placeholders. `/vehicles/[id]` shows authorized history with date, services, technician, mileage, status, concern, and work-order link.

## 7.4 Appointment calendar and conversion

Admin and front-desk staff use `/appointments` for a FullCalendar day/week view in the configured `Asia/Kabul` business timezone, with current-day, previous/next, date-picker navigation, drag/resize rescheduling, and a keyboard-accessible edit page. Mobile uses an agenda list. The appointment form selects an active customer, that customer's active vehicle, requested services, optional technician, local business times, and notes.

The appointment lifecycle is `scheduled → checked_in → in_progress → completed`; staff can mark scheduled or checked-in appointments as `cancelled` or `no_show`. A technician overlap is blocked by default; only an administrator may explicitly override it. Revision numbers make edits, reschedules, transitions, and conversion reject stale concurrent changes.

Creating a work order from an appointment is atomic, prevents duplicate conversion, copies customer, vehicle, technician, requested services, and notes, links both records, and changes a scheduled appointment to checked in. Appointment queries and mutations are feature-scoped so Supabase Realtime can be added later without changing calendar components.

## 7.5 Inventory and parts usage

Admin and front-desk staff manage `/inventory`, including searchable/filterable paginated parts, optional SKU/category, unit, threshold, selling price, status, and low-stock filtering. Administrators also see and set authorized cost information. New parts create an initial-stock ledger movement; current stock cannot be edited afterward.

Every restock, administrator correction, confirmed work-order use, and reversal creates an immutable `inventory_movements` row with the actor, timestamp, resulting quantity, and reason. Corrections require an administrator and reason. The database locks the part row, rejects negative resulting stock, rejects duplicate work-order use lines, and links usage to a work-order part snapshot. A technician may confirm/reverse use only for their assigned work order; front desk and administrators may do so for operational work. Archived parts cannot be newly used.

Parts become used only when staff choose **Confirm use** in a work order. A correction to a confirmed line is a reversal that restores stock; historical lines and movements are never silently edited or deleted. Low stock is defined as `quantity_on_hand <= reorder_threshold`, is ready for dashboard queries, and has no supplier or purchase-order integration.

## 7.6 Invoices, payments, printing, and private files

Staff create an invoice only from a completed work order. A database function allocates the configured invoice sequence, snapshots service and non-reversed part lines, calculates integer-minor-unit totals, records the business currency, and prevents a second active invoice for the same work order. The approved simple tax model is no additional tax or discount calculation.

Invoices move from `issued` to `paid` after a single full offline cash or card-in-person payment, or may be voided with a required reason while unpaid. Invoice detail uses a print-first layout compatible with browser Print-to-PDF; no generated PDF is stored because browser printing is sufficient and avoids duplicate private files.

Vehicle attachment buckets remain private, with Storage policies restricted to operational staff and assigned technicians. The `register_work_order_attachment` RPC validates authorized work-order paths, categories, mime type, and 10 MB maximum metadata before creating the attachment record. The browser upload/preview UI remains a follow-up task.

## 8. Database and Supabase

Required browser-safe variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be sent to browser code, committed to git, or used for ordinary user requests. It is currently limited to administrator-authorized Auth Admin API calls for staff creation and Auth bans. `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts` provide typed SSR-compatible client factories; `src/lib/supabase/admin.ts` is server-only.

`supabase/config.toml` disables public email sign-up, requires a 12-character complex password, configures local Auth redirect URLs, and enables local email testing. Configure the equivalent Auth settings and production redirect URL in the hosted Supabase project.

Schema migrations create all v1 operational tables, normalized search indexes, archive fields, a singleton `business_settings` record, profile creation trigger, RLS policies, and private Storage buckets. Every application mutation must continue to verify the server-side role; RLS is a second enforcement layer. Technicians can read only records associated with assigned work orders and cannot update profiles or promote themselves.

To bootstrap the first administrator, use a secure server-only Supabase Auth Admin API session or Supabase Dashboard user creation with confirmed email, then set trusted Auth app metadata to `{ "role": "admin" }` before the profile trigger runs. Do not use user metadata for roles, do not create the bootstrap user through a browser, and do not commit or document its credentials. Later administrators use the `/staff` screen.

## 9. Deployment

Deploy to Vercel after configuring the browser-safe Supabase variables and the server-only service-role key in the Vercel project. CI runs installation, linting, type checking, unit tests, and a production build.

## 10. Maintenance and Backups

Never change an applied migration. Add a new migration for every database change, verify it through `npm run supabase:reset`, regenerate types, and run the application checks. Database backup and restore runbooks remain a production-readiness task.

## 11. Development Phases and Major Changes

The foundation through offline invoicing establish the operational baseline. Basic dashboard metrics and date-range essential reports are available at `/dashboard` and `/reports`; technicians do not receive collected-revenue or unpaid-invoice metrics. Global search, scoped Realtime, optional email, and attachment browser UX remain pending.

## 12. Troubleshooting

- Missing Supabase values: server/browser client creation will report a Zod validation error. Copy `.env.example` to `.env.local` and fill the browser-safe values.
- Playwright browser missing: run `npx playwright install chromium`.
- Dependency mismatch: remove no files manually; run `npm ci` to restore the lockfile state.
- Build or lint failure: run the individual command locally and address the reported file before committing.
