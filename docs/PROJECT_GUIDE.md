# AutoCare Pro Project Guide

## 1. Project Overview

AutoCare Pro is a staff-only, single-location operations system for a car wash and auto repair business. The product supports `admin`, `front_desk`, and `technician` roles. Its current baseline includes the Supabase v1 schema, staff authentication, protected routes, and administrator staff management; operational CRM and workflow screens remain pending.

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
- `src/components`: reusable application components. `src/components/ui` contains shadcn-compatible UI primitives.
- `src/features`: future domain modules such as appointments, customers, and inventory. Keep feature-specific UI, schemas, actions, and queries together here.
- `src/lib`: shared utilities, environment validation, formatting helpers, and Supabase client factories.
- `src/config`: central application-wide configuration.
- `src/types`: shared TypeScript types. Supabase-generated database types will live here after the first migration phase.
- `supabase/migrations`: versioned v1 schema and Storage-policy migrations. Add new migrations only; never modify an applied migration.
- `tests`: unit/component tests and Playwright end-to-end tests.
- `docs`: durable project documentation and the approved implementation blueprint.

## 6. User Manual

Staff sign in at `/login` with their work email/password or a magic link. There is no public registration. Active accounts land on `/dashboard`; inactive or unauthorized accounts are denied before protected screens render. Administrators can open `/staff` to create accounts, assign `admin`, `front_desk`, or `technician`, and activate/deactivate staff. The administrator-set initial password is permanent unless the staff member changes it through Supabase Auth later.

## 7. Common Configuration Changes

Update `src/config/app.ts` for application defaults such as business timezone and currency. Replace the temporary neutral semantic CSS tokens in `src/app/globals.css` when approved brand colors are supplied. Do not hard-code brand colors in components.

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

The approved delivery roadmap is in [IMPLEMENTATION_BLUEPRINT.md](./IMPLEMENTATION_BLUEPRINT.md). The foundation and data/auth/RBAC phases establish project structure, Supabase schema, security baseline, staff access lifecycle, and local development workflow. The next phase adds customer and vehicle CRM workflows.

## 12. Troubleshooting

- Missing Supabase values: server/browser client creation will report a Zod validation error. Copy `.env.example` to `.env.local` and fill the browser-safe values.
- Playwright browser missing: run `npx playwright install chromium`.
- Dependency mismatch: remove no files manually; run `npm ci` to restore the lockfile state.
- Build or lint failure: run the individual command locally and address the reported file before committing.
