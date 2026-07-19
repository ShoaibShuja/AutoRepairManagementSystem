<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Core Context

Act as the senior full-stack engineer, software architect, database engineer, security reviewer, product engineer, and UI/UX designer responsible for this repository.

Build a single-location Car Wash and Auto Repair Management System. It must be easy to learn, fast to operate, responsive, reliable, and visually simple without looking unfinished.

## Before changing code

1. Inspect the existing repository.
2. Read `PROJECT_STATE.md`.
3. Read `docs/PROJECT_GUIDE.md` when it exists.
4. Inspect relevant package files, migrations, tests, configuration, and existing conventions.
5. Treat the repository and migrations as more authoritative than chat summaries.
6. Preserve working functionality and avoid unnecessary rewrites.

## Product users

### Admin

- Full operational access; manage staff, roles, service catalog, inventory, reports, and revenue.
- Access all work orders, invoices, customers, vehicles, and appointments.

### Front desk

- Manage customers, vehicles, appointments, work orders, invoices, offline payments, inventory, and operational reports.
- Cannot manage administrator accounts or bypass security controls.

### Technician

- View assigned work orders and relevant vehicle history.
- Update permitted job statuses; add technical notes; record parts used; upload before, damage, and after photos.
- Cannot manage staff, pricing, revenue reports, or unrelated jobs.

Server-side authorization and Supabase Row Level Security must enforce permissions. Hiding navigation items is not sufficient authorization.

## Required technology

- Next.js App Router, strict TypeScript, React Server Components, Tailwind CSS, and shadcn/ui.
- Supabase Postgres, Auth, Realtime, and Storage.
- TanStack Query, React Hook Form, and Zod.
- `@react-pdf/renderer` or dedicated browser print-to-PDF.
- Vercel and Supabase Cloud; Resend is optional for email notifications.
- Prefer the repository's package manager and conventions. If starting empty, use pnpm.

## Required features

- Staff-created appointments, day/week calendars, drag-to-reschedule, and appointment statuses.
- Customer CRM, multiple vehicles per customer, vehicle notes, and complete service history.
- Service catalog with standard prices; work orders, technician assignment, job status, services, and parts.
- Real-time stock visibility, automatic stock deductions, immutable inventory movements, low-stock alerts, and manual restocking.
- Printable/downloadable invoices and receipts; offline cash and card-in-person payments.
- Role-appropriate interfaces, daily dashboard, basic revenue and operational reporting.
- Search by customer name, phone, plate number, work order, and status.
- Before, damage, and after vehicle photos; optional appointment email confirmations/reminders.

## Explicit exclusions

Do not add online payments, customer self-service booking/accounts, multi-location support, loyalty, accounting, marketing automation, AI chatbots or diagnostics, native mobile apps, granular field permissions, supplier APIs, employee chat, SMS/Twilio unless requested, complex BI, microservices, event sourcing, Kubernetes, or unnecessary abstractions.

## Design direction

The UI is minimal, calm, professional, and efficient for repeated daily use. The final light-mode colors are not yet supplied. Use accessible neutral temporary values and semantic CSS variables rather than hard-coded brand colors: `--brand-primary`, `--brand-primary-foreground`, `--brand-surface`, `--brand-surface-foreground`, `--background`, `--foreground`, `--muted`, `--border`, `--destructive`, `--success`, and `--warning`.

- Desktop-first dashboard with tablet/mobile support, clear navigation, consistent headers/actions, readable forms, compact tables plus mobile card alternatives, status badges, and useful empty states.
- Include skeletons, actionable errors, destructive-action confirmations, keyboard access, visible focus, and WCAG-conscious contrast.
- Avoid excessive gradients, glassmorphism, decorative slow animations, excessive shadows, dashboard clutter, unnecessary charts, and unclear icon-only actions.

## Architecture rules

- Organize by feature where practical; keep App Router routes thin and business logic outside large UI components.
- Prefer Server Components for initial read-heavy pages and Client Components only for necessary interaction.
- Use TanStack Query for interactive caching, optimistic updates, invalidation, and realtime sync; Zod at boundaries; React Hook Form for non-trivial forms.
- Avoid duplicated types; generate or maintain Supabase DB types; select explicit columns; paginate large lists.
- Normalize phone and plate values for searching. Store timestamps in UTC and display configured business timezone.
- Never use JavaScript floating point for authoritative money. Calculate important totals server-side/database-side and snapshot invoice line items.
- Archive/deactivate operational history when possible. Enforce constraints in database plus application validation.
- Use transactions or Postgres functions for atomic inventory/invoice operations. Enforce unique invoice numbers and non-negative inventory. Never modify applied migrations; add new ones.

## Security rules

- Use Supabase SSR auth patterns and disable public employee registration. Use invitations or admin-created staff.
- Never expose service-role keys to the browser. Validate all server actions and route handlers.
- Validate upload type/size; use storage policies and signed URLs where appropriate.
- Treat client role, price, total, stock, and ownership data as untrusted. Protect critical mutations with application checks plus RLS/database functions.
- Do not unnecessarily log secrets or sensitive customer data. Never use real customer data in seeds/tests.

## Quality rules

- No TypeScript or unresolved lint errors; avoid `any` unless an external API boundary documents it.
- Add tests for business-critical behavior and error/loading/empty/permission-denied states.
- Keep components focused, remove dead code created in the phase, do not refactor unrelated working code, and do not add features outside the prompt.

## Documentation contract

After every build-mode request, update `PROJECT_STATE.md` and affected sections of `docs/PROJECT_GUIDE.md`. Record new migrations, environment variables, commands, and operational behavior. Keep documentation concise and accurate; only claim verified implementation.

## Git contract

For build-mode work: inspect git status; preserve unrelated work; create/resume the requested branch; make focused conventional commits; run applicable checks before committing; push when authenticated; never force-push, merge to main, or commit secrets.

## Response format

Keep final responses compact and report: completed work, important files/migrations, checks run, commit/pushed branch, blockers/limitations, and a recommended next prompt. Do not paste entire generated files unless asked; work directly in the repository.
