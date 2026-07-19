# Project State

Last updated: 2026-07-20
Current phase: Data, authentication, RBAC, and authenticated UI foundation
Current branch: feat/ui-shell
Current status: Supabase schema v1, staff authentication, protected routes, administrator staff management, and the responsive authenticated application shell are implemented.

## Working Features

- Staff login with password or magic link, sign-out, auth callback, SSR session refresh proxy, protected dashboard, and access-denied route.
- Administrator-only staff directory with account creation, role assignment, activation, and deactivation controls.
- Shared TanStack Query provider and Sonner notification host.
- Semantic, neutral light-mode Tailwind CSS token system and a shadcn-compatible Button primitive.
- Responsive protected application shell with role-matched navigation, mobile navigation dialog, user menu, breadcrumb, skip link, dashboard placeholders, and route-level loading/error states.
- Shared operational display, form, filter, search, table, pagination, responsive record-card, status, and accessible confirmation-dialog primitives.
- Browser and SSR Supabase client factories, with deferred runtime environment validation.
- Unit/component test harness, Playwright foundation, formatting configuration, and GitHub Actions quality workflow.

## Architecture and Important Decisions

- Root `app/` files remain thin App Router entry points; implementations live in `src/app/`, and `@/*` resolves to `src/*`.
- Future domain code belongs in `src/features`; shared code belongs in `src/components`, `src/lib`, `src/config`, and `src/types`.
- The service-role credential remains server-only and is used only by administrator-authorized staff provisioning and Auth suspension actions.
- UI color values use semantic CSS variables. Approved brand colors can replace token values without component rewrites.
- Replace the temporary light brand colors only in `src/app/globals.css` (`--brand-primary`, `--brand-primary-foreground`, `--brand-surface`, and `--brand-surface-foreground`). Feature components must consume semantic Tailwind token utilities.

## Database and Migrations

- `20260720000100_core_schema.sql` creates the v1 enums, profiles, singleton settings, CRM, scheduling, work-order, inventory, invoice, payment, attachment, and activity-log tables; it also adds normalization/audit/profile triggers, indexes, RLS, and Realtime publication.
- `20260720000200_storage_policies.sql` creates private `vehicle-attachments` and `invoice-pdfs` buckets and path-aware storage policies.
- All operational tables use RLS. Admin/front desk have operational access; technicians can read only assigned-work context. Inventory movements and activity logs are append-only.
- `src/types/database.ts` is maintained against v1 and must be regenerated with `npm run supabase:types` after a local reset.

## Recent Changes

- Added local Supabase CLI configuration, safe demo seed catalog/inventory data, and reset/type-generation scripts.
- Added server-side role helpers, an admin-only service-role client, auth/server actions, and basic protected staff administration.

## Tests and Quality Checks

- Passed on 2026-07-20: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check` after the RBAC implementation.
- Local Supabase migrations could not be applied in this environment because Docker Desktop is not running. Run `npm run supabase:start` then `npm run supabase:reset` before connecting a remote project.

## Known Issues and Technical Debt

- Atomic stock, appointment-conversion, invoice, payment, and status-transition RPCs are intentionally deferred to the corresponding operational feature phases.
- The maintained type baseline should be replaced by CLI-generated types after the first successful local database reset.
- Final light-mode brand colors have not been supplied.

## Environment or Setup Notes

- Copy `.env.example` to `.env.local`; never commit `.env.local`.
- Browser-safe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, required for administrator-authorized staff provisioning and deactivation Auth bans.
- Use npm because `package-lock.json` is committed.

## Next Recommended Task

Implement customer and vehicle CRM: normalized search, customer/vehicle CRUD, notes, service-history foundations, and responsive list/detail UI using the shared operational components.
