# AutoCare Pro

Staff-only, single-location car wash and auto repair operations management. It covers customers, vehicles, appointments, work orders, inventory, offline invoices, and role-based staff access.

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, TanStack Query, Zod, and Playwright/Vitest.

## Quick local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill the browser-safe Supabase variables in `.env.local` before opening `http://localhost:3000`. Never commit `.env.local` or service-role credentials.

## Required commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run supabase:start
npm run supabase:reset
npm run supabase:types
```

Install Playwright Chromium once with `npx playwright install chromium`, then run `npm run test:e2e`.

## Documentation

- [Project state](./PROJECT_STATE.md)
- [Beginner project and deployment guide](./docs/PROJECT_GUIDE.md)
- [Implementation blueprint](./docs/IMPLEMENTATION_BLUEPRINT.md)
