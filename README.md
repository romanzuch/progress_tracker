# WoW Tracker (Frontend)

Vue 3 + Vite frontend for the WoW Character Progress Tracker. See [`PRD.md`](PRD.md) for product scope and roadmap, and [`docs/plans/`](docs/plans/) for phase-by-phase PRDs and implementation plans.

## Setup

```bash
npm install
cp .env.example .env
```

`VITE_API_BASE_URL` in `.env` should point at a running instance of the [API project](PRD.md#architecture--tech-stack) (defaults to `http://localhost:3000`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview a production build locally |
| `npm run type-check` | `vue-tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint, with `--fix` |
| `npm run format` | Prettier, writing changes |

## Status

Phase F0 (foundation: router, Pinia, Tailwind, API client, tooling) is complete. See `PRD.md`'s Roadmap for what's next.
