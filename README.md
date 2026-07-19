# AutoCare Pro

Staff-only, single-location car wash and auto repair operations management.

## Quick start

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Before using Supabase clients, replace the placeholder browser-safe values in `.env.local`. Never commit real credentials.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For browser tests, install Chromium once with `npx playwright install chromium`, then run `npm run test:e2e`.

## Documentation

- [Project guide](./docs/PROJECT_GUIDE.md): setup, folders, environment variables, and maintenance notes.
- [Implementation blueprint](./docs/IMPLEMENTATION_BLUEPRINT.md): approved architecture and phased roadmap.
- [Project state](./PROJECT_STATE.md): current implementation status and next task.
