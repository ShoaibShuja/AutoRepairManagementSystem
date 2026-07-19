# AutoCare Pro Project Guide

## 1. Project Overview

AutoCare Pro is a staff-only, single-location operations system for a car wash and auto repair business. The product will support `admin`, `front_desk`, and `technician` roles. The initial foundation contains no business records, database schema, or authentication screens yet.

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

## 5. Folder Structure

- `src/app`: pages, layouts, loading states, and route-level error handling. These files define URLs.
- `src/components`: reusable application components. `src/components/ui` contains shadcn-compatible UI primitives.
- `src/features`: future domain modules such as appointments, customers, and inventory. Keep feature-specific UI, schemas, actions, and queries together here.
- `src/lib`: shared utilities, environment validation, formatting helpers, and Supabase client factories.
- `src/config`: central application-wide configuration.
- `src/types`: shared TypeScript types. Supabase-generated database types will live here after the first migration phase.
- `supabase/migrations`: versioned database migrations. It is intentionally empty until the schema phase.
- `tests`: unit/component tests and Playwright end-to-end tests.
- `docs`: durable project documentation and the approved implementation blueprint.

## 6. User Manual

There are no operational workflows available yet. The root route confirms that the application foundation is running. User-facing flows will be documented as they are introduced.

## 7. Common Configuration Changes

Update `src/config/app.ts` for application defaults such as business timezone and currency. Replace the temporary neutral semantic CSS tokens in `src/app/globals.css` when approved brand colors are supplied. Do not hard-code brand colors in components.

## 8. Database and Supabase

Required browser-safe variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is server-only and optional at this phase. It must never be sent to browser code, committed to git, or used for ordinary user requests. `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts` provide typed SSR-compatible client factories. The database schema, RLS policies, storage buckets, and migrations are deferred to the next schema phase.

## 9. Deployment

Deploy to Vercel after configuring the browser-safe Supabase variables in the Vercel project. Add the service-role key only when a later server-only administrative operation explicitly needs it. CI runs installation, linting, type checking, unit tests, and a production build.

## 10. Maintenance and Backups

Database backup, restore, and migration runbooks will be added when Supabase is configured. Never change an applied migration. Add a new migration for every database change.

## 11. Development Phases and Major Changes

The approved delivery roadmap is in [IMPLEMENTATION_BLUEPRINT.md](./IMPLEMENTATION_BLUEPRINT.md). This foundation phase establishes the project structure, dependencies, UI tokens, validation, testing, and CI. The next phase adds the Supabase schema and RLS baseline.

## 12. Troubleshooting

- Missing Supabase values: server/browser client creation will report a Zod validation error. Copy `.env.example` to `.env.local` and fill the browser-safe values.
- Playwright browser missing: run `npx playwright install chromium`.
- Dependency mismatch: remove no files manually; run `npm ci` to restore the lockfile state.
- Build or lint failure: run the individual command locally and address the reported file before committing.
