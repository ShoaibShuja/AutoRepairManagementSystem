# AutoCare Pro Implementation Blueprint

## Summary and Scope Lock

Build a single-location internal operations system for three roles only: `admin`, `front_desk`, and `technician`. The required stack is Next.js 16 App Router, strict TypeScript, Tailwind/shadcn, Supabase (Postgres/Auth/Realtime/Storage), TanStack Query, React Hook Form, Zod, and Vercel.

**MVP includes:** staff-only authentication; role-enforced operations; customer and vehicle CRM; appointments with day/week scheduling and drag rescheduling; work orders; technician assignment and updates; service catalog; inventory and immutable movements; invoice and offline payment recording; receipts; photos; dashboard; searchable operational records; basic reports.

**Deferred to production hardening:** email confirmations/reminders via Resend, richer calendar recurrence, export formats beyond printable PDF, audit-log dashboard, performance monitoring, backup/restore runbooks, accessibility audit, load testing, automated deployment checks, and fuller reporting drill-down.

**Explicitly excluded:** online payment gateways, customer booking/accounts, multi-location/franchise support, loyalty, accounting, marketing, AI features, native mobile apps, granular field permissions, supplier APIs, employee chat, SMS/Twilio, complex BI, microservices, event sourcing, Kubernetes, and unrelated abstractions.

## User Workflows

- **Front desk, appointment to invoice:** search or create customer, add/select vehicle, create appointment with services and requested time, reschedule by drag/drop or edit, check in to create a draft work order, assign technician, track progress, review services/parts, generate immutable invoice snapshot, record cash or card-in-person payment, print/download receipt.
- **Technician, assigned job:** open “My work” queue, inspect permitted vehicle history and assigned work order, move through allowed statuses, add technical notes and categorized photos, record parts used through an atomic inventory operation, mark work ready for front-desk review. Technicians never set prices, payments, staff, or unrelated jobs.
- **Administrator, setup and management:** create/invite staff, assign one role, deactivate staff, maintain service catalog and inventory, configure shop profile, business timezone, invoice prefix/sequence, and low-stock thresholds; review reports and all operational data.
- **Customer/vehicle lookup:** universal search normalizes customer phone and vehicle plate values; customer profile shows contacts, vehicles, appointments, work orders, invoices, notes, and service history; vehicle profile scopes history to that vehicle.
- **Inventory:** staff records restock adjustment with reason; technician/front desk adds part usage to a work order; the database atomically prevents negative stock, writes an immutable movement, and updates availability; dashboard/inventory views surface low-stock items.

## Route, Screen, and UI Map

Use a protected `(app)` route group with a persistent application shell and a `(auth)` group.

| Area | Routes and screens |
|---|---|
| Authentication | `/login`, `/auth/callback`, `/invite/accept`, `/access-denied` |
| Dashboard | `/dashboard`: today’s appointments, job queue, low stock, unpaid invoices, compact daily metrics |
| Appointments | `/appointments`, `/appointments/day`, `/appointments/week`, `/appointments/new`, `/appointments/[id]` |
| Customers | `/customers`, `/customers/new`, `/customers/[id]` |
| Vehicles | `/vehicles/[id]`, linked vehicle creation/editing from customer pages |
| Work orders | `/work-orders`, `/work-orders/new`, `/work-orders/[id]`, `/my-work` |
| Service catalog | `/services`, `/services/new`, `/services/[id]` |
| Inventory | `/inventory`, `/inventory/new`, `/inventory/[id]`, `/inventory/[id]/movements`, `/inventory/restock` |
| Invoices | `/invoices`, `/invoices/[id]`, `/invoices/[id]/print` |
| Reports | `/reports`, with date-range revenue, operational, technician workload, and inventory movement sections |
| Staff | `/staff`, `/staff/invite`, `/staff/[id]` |
| Configuration | `/settings/business`, `/settings/invoicing`, `/settings/storage` |

Route-level authorization rejects access before rendering. Each list page supports explicit pagination, filters, empty state, loading state, error state, and a narrow-screen card alternative.

## Architecture and Security

- **Project organization:** use `app/` for thin route composition; `features/<domain>/` for UI, schemas, actions, query hooks, and mappers; `lib/` for Supabase clients, authorization, date/money helpers, and shared utilities; `components/` only for cross-feature primitives; `supabase/migrations/`, `supabase/seed/`, and generated database types.
- **Rendering boundary:** Server Components load initial authorized list/detail/dashboard data. Client Components own calendar drag/drop, dialogs, forms, data tables with filters, photo uploads, mutations, live status lists, and print triggers.
- **Data access:** Server Components and server actions use the Supabase SSR server client. Browser interactions use the browser client only with the authenticated user session. Select explicit columns through typed repository/query functions; never expose service-role credentials to the client.
- **Mutations:** server actions or narrowly scoped route handlers validate Zod input, resolve the current profile/role, execute database RPC functions where atomicity matters, return typed success/failure results, and revalidate affected routes.
- **TanStack Query:** client-side filter/pagination cache, mutation lifecycle, optimistic non-financial status updates, invalidation after server mutations, and Supabase Realtime cache synchronization. It does not replace initial server reads or authorize requests.
- **Forms:** React Hook Form plus shared Zod schemas. Use typed controlled components only where necessary, normalize phone/plate values at the boundary, show field-level errors, preserve valid input after server failure, and confirm destructive/deactivation actions.
- **Authentication/authorization:** Supabase Auth permits no public staff registration. Admins invite or create staff; a `profiles` row maps `auth.users.id` to the role enum and active state. RLS is enabled on every operational table, and policy helpers use `auth.uid()` plus active profile role. RPCs independently authorize the caller. UI visibility mirrors policy but is never the enforcement mechanism.
- **Realtime:** publish only appointments, work orders, inventory summaries, and notifications relevant to active users. Subscribe per route/filter, deduplicate by primary key/version, update or invalidate the appropriate query key, and clean up subscriptions on unmount. Realtime is advisory; server refetch remains the source of truth.
- **Storage:** private bucket `vehicle-photos`, object key prefix `work-orders/{workOrderId}/...`, metadata records in `vehicle_photos`, client validation before upload, server-validated file type/size and ownership, storage RLS, and short-lived signed URLs for display/download.
- **PDF:** use `@react-pdf/renderer` to render invoices/receipts from immutable invoice snapshots server-side or in the print route; the invoice screen also provides a browser print stylesheet as a fallback.
- **Testing:** unit-test Zod schemas, status guards, money helpers, and mapping; integration-test RLS/RPC behavior against local Supabase; Playwright-test role flows and critical paths; run lint, type-check, production build, and migration validation in CI.

## Initial Domain Model

- `profiles`: staff identity, display name, role, active state, timestamps; one-to-one with Supabase Auth.
- `customers` → `vehicles`: one customer owns many vehicles. Customer phone and vehicle plate have normalized search columns; vehicle notes remain append-only history entries rather than overwritten operational facts.
- `services`: active/archiveable catalog entry, standard price in integer minor currency units, duration, category, and description.
- `appointments`: customer, vehicle, requested service summary, scheduled start/end, status, staff creator, optional linked work order, notes.
- `work_orders`: sequential public number, customer, vehicle, source appointment, assigned technician, status, intake/technical notes, check-in/complete timestamps.
- `work_order_services` and `work_order_parts`: work-order line items. Service lines snapshot name and unit price when added; parts lines snapshot item/SKU/name/unit cost or sell price as configured. Both support invoice creation without catalog drift.
- `inventory_items`: SKU, name, unit, quantity on hand, reorder threshold, active state; `inventory_movements` is append-only and references work-order usage, restock, or correction source.
- `invoices`: unique invoice number, work order, immutable line-item snapshot, totals in integer minor units, status, generated timestamp; `payments` records offline payment method, amount, received time, and recording staff member.
- `vehicle_photos`: work order, photo category (`before`, `damage`, `after`), private storage object path, uploader, caption, timestamp.
- `business_settings`: singleton shop details, timezone, currency, invoice prefix, next-sequence policy, and configurable defaults.

### Status Machines

- Appointment: `scheduled → checked_in | cancelled | no_show`; `scheduled → rescheduled` is represented by time-change history plus continued `scheduled`; `checked_in` links one work order.
- Work order: `draft → assigned → in_progress → ready_for_review → completed → invoiced`; `cancelled` is allowed before completion. Only admins/front desk assign and complete; technicians may transition only their assigned work from `assigned` to `in_progress` to `ready_for_review`.
- Invoice: `draft → issued → partially_paid | paid | void`; issued invoices are immutable except payment state and permitted void metadata.
- Inventory: no mutable transaction history. Current stock is derived/maintained only through authorized restock, usage, and correction movements.

### Transactional Database Operations

- Create appointment plus optional new customer/vehicle.
- Check in appointment and create linked work order exactly once.
- Add, change, or remove a part usage line while applying the compensating immutable inventory movement and enforcing non-negative stock.
- Restock/correct stock while writing movement history.
- Issue invoice: allocate unique number, snapshot lines/totals, and lock the invoice content.
- Record payment: validate unpaid balance, update invoice payment status, and preserve payment record.

## UI/UX System

- **Navigation:** desktop left sidebar organized by Today, Operations, Catalog, Finance, and Administration; mobile bottom navigation for Dashboard, Appointments, Work, Customers, More; role-specific navigation and server authorization.
- **Responsive behavior:** desktop prioritizes dense tables and split detail panes; tablet collapses sidebar and reduces columns; mobile switches to cards, bottom sheets, sticky primary actions, and horizontal calendar navigation.
- **Reusable operations UI:** page header with action slot, searchable/filterable data table, mobile record card, status badge, assignee selector, money field, date/time picker, confirmation dialog, empty-state panel, skeleton, error callout, permission-denied panel, photo uploader/gallery, activity timeline, and invoice summary.
- **Forms:** sectioned card layout with a sticky submit bar on small screens; required labels, help text, inline validation, server-error summary, safe defaults, and unsaved-change warning for complex work orders.
- **Calendar:** staff calendar supports day/week views, color by appointment status, keyboard-accessible detail opening, drag/drop reschedule with conflict warning, explicit save/revert result, and server-side scheduling validation.
- **Tokens:** define semantic light-mode variables for all supplied tokens. Default to accessible neutral slate surfaces and a restrained neutral primary until `LIGHT_PRIMARY_COLOR` and `LIGHT_SECONDARY_COLOR` are supplied. Brand colors are configuration-only CSS token replacements, not component-level literals. Do not implement dark mode unless separately requested.

## Delivery Roadmap

| Prompt | Deliverable |
|---|---|
| 2 | Foundation: project cleanup, shadcn/Tailwind token system, feature structure, environment validation, Supabase SSR clients, baseline testing/CI, project documentation. |
| 3 | Supabase schema v1: enums, tables, indexes, generated types, profile trigger, RLS baseline, singleton settings, local setup and migration tests. |
| 4 | Authentication and staff lifecycle: login/callback, protected shell, role guards, invitation/admin staff management, access-denied flows. |
| 5 | Customer and vehicle CRM: normalized search, customer/vehicle CRUD, notes, service-history foundations, responsive list/detail UI. |
| 6 | Service catalog and inventory: catalog CRUD/archive, inventory item management, restocking, movement ledger, low-stock signals, atomic stock RPCs. |
| 7 | Appointments: appointment schema/actions, day/week schedule, filters, appointment status, drag-to-reschedule and conflict handling. |
| 8 | Work orders: intake from appointment/manual creation, service lines, technician assignment, permitted role actions, status machine, My Work queue. |
| 9 | Technician completion: technical notes, photo storage/policies, part usage, live stock refresh, work-order timeline and vehicle history. |
| 10 | Invoices and payments: immutable invoice issuance RPC, offline cash/card payments, receipt PDF/print, invoice lists and unpaid state. |
| 11 | Daily dashboard: role-specific queue, operational counters, low-stock and unpaid invoice alerts, realtime synchronization. |
| 12 | Reports: date-filtered revenue, appointment, work-order, technician workload, and inventory movement reports with authorization. |
| 13 | Usability pass: mobile table cards, empty/loading/error/permission states, keyboard/focus review, destructive confirmations, responsive QA. |
| 14 | Security and reliability hardening: RLS policy matrix tests, RPC permission tests, upload abuse protection, rate/size limits, audit trails, error observability. |
| 15 | Production readiness: CI gates, migration/deployment runbook, backup/restore notes, environment documentation, Vercel/Supabase deployment validation. |
| 16 | Optional Resend integration: configurable appointment confirmation/reminder delivery, failure-safe logs, templates, and feature flag. |

### MVP Acceptance After Prompt 10

- Admin can invite/deactivate staff and each role is blocked by both server authorization and RLS from unauthorized records/actions.
- Front desk can complete customer/vehicle → appointment → work order → invoice → offline payment without manual database intervention.
- Technician can only view assigned jobs, update permitted statuses, add notes/photos, and record parts.
- Inventory never becomes negative; every restock, usage, and correction has an immutable movement.
- Issued invoices retain their original line names, quantities, unit prices, totals, and unique number after catalog changes.
- Search works for normalized name/phone/plate/work-order/status criteria; all primary screens work at desktop and mobile widths.
- Lint, type-check, production build, critical unit tests, RLS/RPC integration tests, and core Playwright workflows pass.

### Production-Readiness Criteria

- Prompt 16 complete or consciously deferred with the feature disabled; migrations tested from an empty local Supabase database; CI blocks lint/type/build/test failures; RLS matrix and atomic inventory/invoice operations are covered by integration tests; private storage and signed URL access validated; monitoring/error reporting, backups, deployment configuration, and operator documentation verified.

## Risks and Decisions

- **RLS mistakes:** maintain a role-by-table policy matrix and test allowed and denied cases with real authenticated sessions. Database functions perform their own actor/role checks.
- **Inventory race conditions:** never calculate stock in the browser; use row locking and single RPC transactions, `numeric` or integer quantities as appropriate, and database `quantity_on_hand >= 0` enforcement.
- **Invoice inconsistency:** use integer minor currency units, server-calculated totals, immutable issued snapshots, unique sequence allocation in the issuing transaction, and payment records separate from invoice content.
- **Calendar complexity:** MVP has one location, no resource/bay scheduling, no recurring appointments, and fixed configurable appointment duration defaults. **Configurable:** timezone, business hours, and scheduling increment.
- **Realtime duplication:** use narrow channel filters, idempotent event application keyed by record ID/update timestamp, query invalidation fallback, and subscription cleanup.
- **File access:** private-only bucket, ownership-aware policies, signed URLs, server-known paths, MIME/size limits, and no direct public URL storage.
- **Scope growth:** all new business domains require an explicit prompt after MVP; do not reintroduce proposal-era MongoDB, Clerk, Stripe, manager/cashier roles, or payment-provider functionality.
