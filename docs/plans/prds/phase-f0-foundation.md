# PRD: Phase F0 — Frontend Foundation

## Status

Implemented

## Summary

Turn the default Vite + Vue 3 scaffold currently in this repo into a working foundation for the WoW Character Progress Tracker frontend: TypeScript, Vue Router with every future page stubbed out, Pinia store skeletons, Tailwind CSS v4, a responsive app shell, a small API client module, and the test/lint tooling to build on top of. This is pure scaffolding — no auth, no data fetching, no real UI beyond placeholders. It exists so Phases F1–F5 (see the umbrella [PRD.md](../../../PRD.md)) have structure to fill in rather than starting from an empty template each time.

## Background / Context

The repo (`wow-tracker`) is currently the unmodified `npm create vite -- --template vue` output: plain JavaScript, a single `HelloWorld.vue`, no router, no state management, no styling framework, no tests, no linting, and **no git repository at all**. The umbrella PRD's Phase F0 line item ("Vue Router setup, Pinia stores skeleton, Tailwind config, responsive app shell/layout, API client module") is the only description of this phase; everything else here is this PRD's job to pin down.

This frontend consumes the [WoW Character Progress Tracker API](../../../PRD_API.md) (a separate repo/project — see `docs/plans/api/` in this repo for that project's own sub-PRDs, which this frontend's umbrella PRD was written against). No API work happens here; F0 only needs to know the API is a separate origin reachable at a configurable base URL.

## Goals

- Convert the project to TypeScript (`vue-tsc`, `.ts`/`<script setup lang="ts">` throughout).
- Vue Router installed with a real route for every page the umbrella PRD's phases will eventually build, each pointing at a minimal placeholder view component.
- Pinia installed with one store file per domain the umbrella PRD assigns to state (`session`, `trackedCharacters`, `locale`), each with a minimal typed state shape and no real logic yet.
- Tailwind CSS v4 wired in via the Vite plugin, default palette, no custom design tokens yet.
- A responsive, mobile-first app shell (header, nav with a mobile hamburger toggle, main content area) wrapping `<RouterView>`.
- An API client module (`src/lib/api/client.ts`): a `fetch` wrapper with a configurable base URL, `credentials: 'include'` on every request, and normalized error handling (typed `ApiError` on non-2xx and network failure). No auth-redirect behavior yet — that lands in Phase F1 once a real login route exists.
- Vitest + Vue Test Utils installed and configured, with smoke-level tests proving the router resolves every stubbed route, each store initializes with its default state, and the API client's request/error-handling behavior.
- ESLint + Prettier configured for Vue + TypeScript, with `lint` and `format` npm scripts.
- Git repository initialized for the project, with the pre-F0 scaffold committed as a baseline and a `phase-f0-foundation` branch for this work.

## Non-Goals

- Any authentication logic, session handling, or calling the real API (that's Phase F1 onward — see umbrella `PRD.md`).
- The 401 → redirect-to-login global interceptor described in the umbrella PRD's Architecture section — deferred to Phase F1, since it needs a real `/login` route to redirect to.
- Real content for any view — every route's component is a placeholder (e.g. a heading naming the page) until its owning phase builds it out.
- Any custom Tailwind theme/design tokens (brand colors, typography scale, spacing scale) — F0 uses Tailwind's default palette; a design system is not part of this phase.
- CI/CD pipeline setup, deployment configuration, or hosting decisions.
- Choosing or wiring up the real API base URL — F0 only adds the `VITE_API_BASE_URL` env var with a localhost placeholder default; pointing it at a real deployed API is a later, non-code concern.
- A component library (Vuetify, PrimeVue, etc.) — the umbrella PRD already decided against this in favor of Tailwind utility classes.
- Any of the umbrella PRD's own open questions (public/third-party auth scheme, raw payload retention, `needs_reauth` surfacing) — those are API-side or Phase F1 concerns, not F0.

## Proposed Solution

### Project conversion (JS → TypeScript)

- Add `typescript`, `vue-tsc`, and `@vue/tsconfig` (or equivalent) as dev dependencies.
- `tsconfig.json` (app) + `tsconfig.node.json` (Vite config itself), following the standard Vue 3 + Vite TS template split.
- Rename `src/main.js` → `src/main.ts`; convert `src/App.vue`'s `<script setup>` to `<script setup lang="ts">`.
- Add `src/env.d.ts` with the `/// <reference types="vite/client" />` triple-slash directive and a typed `ImportMetaEnv` interface covering `VITE_API_BASE_URL`.
- Remove the scaffold leftovers that don't serve F0: `src/components/HelloWorld.vue` and the unused `src/assets/vue.svg` / `src/assets/hero.png` (keep `public/favicon.svg` and `public/icons.svg` — already referenced by `index.html` / plausibly by later views).
- `npm run type-check` script running `vue-tsc --noEmit`.

### Vue Router

`src/router/index.ts` exports a `createRouter` instance (`createWebHistory`) with one route per future page, each mapped to a placeholder component under `src/views/`:

| Path | Name | Component | Owning phase |
| --- | --- | --- | --- |
| `/` | `home` | `HomeView.vue` | F3 (account overview) |
| `/login` | `login` | `LoginView.vue` | F1 |
| `/auth/callback` | `auth-callback` | `AuthCallbackView.vue` | F1 |
| `/characters/add` | `characters-add` | `CharactersAddView.vue` | F2 |
| `/characters/:realmSlug/:characterName` | `character-detail` | `CharacterDetailView.vue` | F4 |
| `/settings` | `settings` | `SettingsView.vue` | F5 |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView.vue` | — |

Each placeholder view is a `<script setup lang="ts">` component that renders only a heading naming the page (e.g. `<h1>Character Detail</h1>`) — no logic, no store/API usage. `main.ts` registers the router via `app.use(router)`.

### Pinia stores

`src/stores/session.store.ts`, `src/stores/trackedCharacters.store.ts`, `src/stores/locale.store.ts` — each a `defineStore` using the setup-store syntax, with a minimal typed placeholder state and no actions yet:

- `useSessionStore`: `{ isAuthenticated: boolean }` (hardcoded `false` default; F1 fills in real logic).
- `useTrackedCharactersStore`: `{ characters: [] as TrackedCharacter[] }` — `TrackedCharacter` declared as a minimal placeholder interface (`{ id: string; realmSlug: string; characterName: string }`) local to the store file, expected to move to a shared types module and grow fields in F2/F3.
- `useLocaleStore`: `{ locale: string }` (default `'en_US'`, matching the API's documented default).

`main.ts` registers Pinia via `app.use(createPinia())`.

### Tailwind CSS v4

- Add `tailwindcss` and `@tailwindcss/vite` as dev dependencies.
- `vite.config.ts` adds the `tailwindcss()` plugin alongside the existing `vue()` plugin.
- `src/style.css` reduced to `@import "tailwindcss";` (existing scaffold CSS reset/defaults removed since Tailwind's preflight replaces them).
- No `tailwind.config.js` and no `@theme` customization in F0 — default palette, default breakpoints (`sm`/`md`/`lg`/etc.).

### App shell / responsive layout

- `src/layouts/AppShell.vue`: header (app name/logo placeholder text, nav links to the stubbed routes) + `<main>` containing `<RouterView />`. Nav collapses behind a hamburger toggle (a local `ref<boolean>` for open/closed) below Tailwind's `sm` breakpoint, shown as a horizontal list above it. No conditional nav items based on auth state — F0's nav always shows all stub links.
- `App.vue` becomes a thin wrapper: `<template><AppShell /></template>`.

### API client module

`src/lib/api/client.ts`:

```ts
export class ApiError extends Error {
  constructor(public status: number, public body: unknown) { ... }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> { ... }

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', ... }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

- Base URL read from `import.meta.env.VITE_API_BASE_URL`.
- Every request sent with `credentials: 'include'` (required for the cross-origin session cookie per the umbrella PRD).
- Non-2xx responses throw `ApiError` with the parsed response status and body (JSON-parsed if the content-type allows, otherwise raw text).
- A rejected `fetch` (network failure) is caught and rethrown as `ApiError(0, { message: 'Network error' })` (or similar) so callers only ever deal with one error type.
- No retry logic, no request/response interceptor chain, no auth-redirect behavior — deliberately minimal until F1 needs more.

### Testing

- `vitest`, `@vue/test-utils`, `jsdom` (or `happy-dom`) as dev dependencies; `vitest.config.ts` (or a `test` block in `vite.config.ts`) with the jsdom/happy-dom environment.
- `npm run test` runs Vitest once (CI-style); a `test:watch` script for local dev.
- Smoke tests only, matching F0's scope:
  - Router: resolving each named route returns the expected component/path (including the dynamic `character-detail` route and the catch-all).
  - Each store: mounting with a fresh Pinia instance yields the documented default state.
  - API client: constructs the request with base URL + `credentials: 'include'`; a mocked 404 response throws `ApiError` with `status: 404`; a mocked `fetch` rejection throws `ApiError` too.

### Linting & formatting

- `eslint`, `eslint-plugin-vue`, `@vue/eslint-config-typescript`, `prettier`, `eslint-config-prettier` as dev dependencies.
- `eslint.config.js` (flat config) extending the Vue + TypeScript recommended sets, with Prettier last to disable conflicting stylistic rules.
- `.prettierrc` with the project's formatting preferences (defaults acceptable — no strong opinions stated).
- `npm run lint` (`eslint .`) and `npm run format` (`prettier --write .`) scripts.

### Environment configuration

- `.env.example` at repo root: `VITE_API_BASE_URL=http://localhost:3000` — a placeholder; whoever runs this locally against a real API instance overrides it in their own untracked `.env`.
- `.gitignore` (already present from the Vite scaffold) confirmed to already exclude `.env` — extend if it doesn't.

### Git

- `git init` at repo root; commit the pre-F0 scaffold as-is (baseline) on `main`.
- Create and work on branch `phase-f0-foundation` for every change described in this PRD.
- Plain, descriptive commit messages — no ticket-ID trailer (no ticket-tracking system is wired up for this repo).

## Acceptance Criteria

- [ ] `npm run dev` starts the app with no console errors; navigating (via the nav links or directly by URL) to every route in the table above renders that route's placeholder view inside the app shell.
- [ ] `npm run build` and `npm run type-check` both succeed with zero TypeScript errors.
- [ ] `npm run lint` passes with zero errors on the full `src/`.
- [ ] `npm test` passes, covering: all named routes resolve; all three stores initialize to their documented default state; the API client attaches `credentials: 'include'`, resolves a successful JSON response, and throws `ApiError` on both a non-2xx response and a network failure.
- [ ] The app shell is usable at both a mobile width (nav behind the hamburger toggle) and a desktop width (nav inline) — verified manually in a browser.
- [ ] `git log` on `main` shows the pre-F0 scaffold as its own commit, separate from the F0 work on `phase-f0-foundation`.
- [ ] `.env.example` exists and documents `VITE_API_BASE_URL`; no real/secret values are committed.

## Open Questions

None outstanding — all decisions in this PRD (TypeScript conversion, Vitest adoption, Tailwind v4, deferring the 401 interceptor to F1, git baseline approach, full route/store stubbing) were confirmed with the project owner before writing this document.

## Dependencies / Follow-ups

- **Blocks:** Phase F1 (auth & session) — needs the `login`/`auth-callback` routes, the `session` store, and the API client from this phase.
- **Related:** The umbrella `PRD.md`'s Architecture section notes a required API-side change (cookie `SameSite=None; Secure` + CORS allow-list) — not this phase's concern, but Phase F1 is blocked on it independent of anything in F0.
- **Follow-up:** once Phase F1 exists, revisit whether the API client needs a response interceptor (rather than only per-call error throwing) to support the global 401 → login redirect described in the umbrella PRD.
