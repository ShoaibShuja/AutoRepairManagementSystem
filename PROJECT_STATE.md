# Project State

Last updated: 2026-07-20
Current phase: Foundation
Current branch: chore/foundation
Current status: Application foundation implemented; Supabase schema and business features are intentionally pending.

## Working Features

- Minimal public root route, loading state, not-found page, and route/global error boundaries.
- Shared TanStack Query provider and Sonner notification host.
- Semantic, neutral light-mode Tailwind CSS token system and a shadcn-compatible Button primitive.
- Browser and SSR Supabase client factories, with deferred runtime environment validation.
- Unit/component test harness, Playwright foundation, formatting configuration, and GitHub Actions quality workflow.

## Architecture and Important Decisions

- Root `app/` files remain thin App Router entry points for this starter; their implementations live in `src/app/`, and `@/*` resolves to `src/*`.
- Future domain code belongs in `src/features`; shared code belongs in `src/components`, `src/lib`, `src/config`, and `src/types`.
- Supabase service-role credentials are server-only and intentionally not used by the base client factories.
- UI color values use semantic CSS variables. Approved brand colors can replace token values without component rewrites.

## Database and Migrations

- `supabase/migrations/` has been created but contains no applied migration.
- No tables, RLS policies, RPCs, storage buckets, or generated types are implemented yet.

## Recent Changes

- Added Supabase SSR, TanStack Query, React Hook Form, Zod, date utilities, shadcn-compatible UI utilities, and test dependencies.
- Replaced starter App Router files with foundation pages and infrastructure.
- Added `.env.example`, testing configuration, Playwright configuration, Prettier configuration, and CI workflow.
- Consolidated the permanent guide at `docs/PROJECT_GUIDE.md`.

## Tests and Quality Checks

- Passed on 2026-07-20: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Playwright foundation is available through `npm run test:e2e`; browser installation is a local prerequisite.

## Known Issues and Technical Debt

- The root route is intentionally a minimal foundation screen, not an operational dashboard.
- No Supabase project or local Supabase CLI configuration is committed yet.
- `src/types/database.ts` is a placeholder and must be replaced with generated types after the first schema migration.
- Final light-mode brand colors have not been supplied.

## Environment or Setup Notes

- Copy `.env.example` to `.env.local`; never commit `.env.local`.
- Browser-safe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, only for future narrow administrative paths.
- Use npm because `package-lock.json` is committed.

## Next Recommended Task

Implement Supabase schema v1: baseline enums/tables/indexes, profile trigger, RLS policy matrix, singleton settings, generated database types, and local migration testing.
