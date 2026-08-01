# PRD: Phase F1 — Auth & Session

## Status

Implemented

## Summary

Wire up real Battle.net login/logout in the frontend on top of Phase F0's scaffolding: the `/login` and `/auth/callback` routes stop being placeholders, the `session` Pinia store gains real state and actions, and the API client gets a global 401-handling interceptor so the rest of the app never has to think about auth on a per-call basis. This phase also builds the `needs_reauth` banner's plumbing (store state + a global banner component), even though nothing calls into it yet — the only thing that can trigger it (a live Battle.net-backed call) doesn't exist until Phase F2's "add a character" screen, per the project owner's explicit decision to build this dormant infrastructure now rather than bundle it with F2.

## Background / Context

Phase F0 ([`phase-f0-foundation.md`](phase-f0-foundation.md)) shipped the routes (`login`, `auth-callback`), the `session` store, and the API client module (`lib/api/client.ts`) as placeholders/skeletons with no real logic — its own Non-Goals explicitly deferred "any authentication logic, session handling, or calling the real API" and "the 401 → redirect-to-login global interceptor" to this phase. Its Dependencies/Follow-ups section flagged both as blocked on F1 existing.

The umbrella [`PRD.md`](../../../PRD.md)'s Phase F1 section is the source of truth for this phase's scope: a login button that does a full-page redirect to `GET /api/auth/battlenet`, an auth-callback route that just lands the user in the app once the API has already set the session cookie, a `POST /api/auth/logout` call, a global 401 → login-page interceptor (since there's no dedicated session-check endpoint), and opportunistic `needs_reauth` surfacing via a global banner.

**Confirmed as still outstanding (not this repo's job, but a blocking dependency):** the API-side change the umbrella PRD calls out — the session cookie must become `SameSite=None; Secure` with an explicit CORS allow-list for the frontend's origin (credentials enabled), and the OAuth callback must redirect the browser to a concrete frontend URL (e.g. `${FRONTEND_BASE_URL}/auth/callback`) instead of returning JSON. As of this PRD, that work has **not** landed on the API side. This phase's code can be built and unit-tested against mocked responses independent of it, but full manual, browser-based, end-to-end verification (real Battle.net login → real cookie → real redirect) is blocked until it does.

## Goals

- `/login` renders a real "Log in with Battle.net" action that does a full browser redirect (`window.location.href`, not `fetch`) to `GET ${VITE_API_BASE_URL}/api/auth/battlenet`.
- `/auth/callback` marks the session store authenticated and immediately redirects (client-side, `router.replace`) to the home route — no data is read from the callback URL itself; arriving here at all means the API already completed the OAuth flow and set the session cookie.
- A visible "Logout" action (replacing the nav's "Login" link once authenticated) that calls `POST /api/auth/logout`, clears session state, and returns the user to `/login`.
- The `session` Pinia store gains `needsReauth` state alongside the existing `isAuthenticated`, plus actions (`markAuthenticated`, `markLoggedOut`, `flagNeedsReauth`) — replacing ad hoc external mutation of the store's refs.
- The API client (`lib/api/client.ts`) gets a global interceptor: any `401` response marks the session logged out and invokes a registered "unauthorized" handler (wired to a login-page redirect in `main.ts`) — **except** a `401` whose body is `{ error: "needs_reauth" }`, which instead flags `needsReauth` and leaves `isAuthenticated`/navigation untouched.
- A global `NeedsReauthBanner` component, rendered in the app shell, visible whenever `session.needsReauth` is `true`, with a "Log in again" action that re-triggers the Battle.net redirect. Built now per the project owner's decision; nothing calls `flagNeedsReauth` yet since that requires a live Battle.net-backed call, which is Phase F2's job.
- Every new behavior covered by tests that don't depend on a real API or real Battle.net — mocked `fetch` responses, same pattern F0 established.

## Non-Goals

- Anything that requires the API-side `SameSite=None`/CORS/redirect-target change to actually be live — this PRD documents that dependency but doesn't implement or verify it; it's the API project's work.
- A dedicated session-check endpoint / proactive "am I logged in" check on app load — the umbrella PRD explicitly rules this out for v1. On a fresh page load (not arriving via `/auth/callback`), `isAuthenticated` starts `false` until the first real API call either succeeds (a future phase would need to flip it back on success, which isn't needed yet since no phase makes an authenticated call on app load) or 401s. This is a known, accepted gap, not a bug.
- Wiring a real caller into `flagNeedsReauth` — that's Phase F2's "add a character" screen, per the umbrella PRD.
- Any UI for the account overview, character tracking, or settings — those are F2–F5.
- A `FRONTEND_BASE_URL` env var or any other new frontend env var — the API-side redirect target is the API's own config, not something this repo sets.
- Redirecting away from `/login` if the user is already authenticated, or any other route-guard behavior — not requested by the umbrella PRD; out of scope to avoid inventing requirements.

## Proposed Solution

### `session` store: real state and actions

Replace `src/stores/session.store.ts`'s single `isAuthenticated` ref with:

```ts
export const useSessionStore = defineStore("session", () => {
    const isAuthenticated = ref(false)
    const needsReauth = ref(false)

    function markAuthenticated() {
        isAuthenticated.value = true
        needsReauth.value = false
    }

    function markLoggedOut() {
        isAuthenticated.value = false
        needsReauth.value = false
    }

    function flagNeedsReauth() {
        needsReauth.value = true
    }

    return { isAuthenticated, needsReauth, markAuthenticated, markLoggedOut, flagNeedsReauth }
})
```

`markAuthenticated` clears any stale `needsReauth` flag (a fresh login resolves it); `markLoggedOut` resets both.

### API client: 401 interceptor without a circular import

`lib/api/client.ts` needs to react to `401`s, but it must **not** import the router directly: `src/router/index.ts` statically imports every view component, including `LoginView.vue`, which (see below) imports the shared login-redirect helper, which imports `lib/api/client.ts` for `apiBaseUrl`. If `client.ts` imported the router back, that's a module cycle (`router → LoginView → auth helper → client → router`). Importing the `session` store from `client.ts` is safe (the store has no app-specific imports), but the router is not.

The fix: `client.ts` exposes a settable handler instead of importing the router itself. Only `main.ts` — the composition root, which already imports both — wires them together:

```ts
// lib/api/client.ts
import { useSessionStore } from "../../src/stores/session.store"

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: () => void): void {
    onUnauthorized = handler
}

function isNeedsReauthBody(body: unknown): body is { error: "needs_reauth" } {
    return typeof body === "object" && body !== null && (body as { error?: unknown }).error === "needs_reauth"
}

// inside request(), where the existing code currently does
// `if (!response.ok) { throw new ApiError(response.status, await parseBody(response)) }`:
if (!response.ok) {
    const body = await parseBody(response)
    if (response.status === 401) {
        const sessionStore = useSessionStore()
        if (isNeedsReauthBody(body)) {
            sessionStore.flagNeedsReauth()
        } else {
            sessionStore.markLoggedOut()
            onUnauthorized?.()
        }
    }
    throw new ApiError(response.status, body)
}
```

```ts
// src/main.ts
import { setUnauthorizedHandler } from "../lib/api/client"
import { router } from "./router/index.ts"

setUnauthorizedHandler(() => {
    if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" })
    }
})
```

The existing `baseUrl` module constant is renamed to `apiBaseUrl` and exported, since `src/lib/auth.ts` (below) needs it too.

### Shared Battle.net redirect helper

Both the login page and the reauth banner need to do the exact same full-page redirect. One small shared module avoids duplicating the URL string in two components:

```ts
// src/lib/auth.ts
import { apiBaseUrl } from "../../lib/api/client"

export function redirectToBattlenetLogin(): void {
    window.location.href = `${apiBaseUrl}/api/auth/battlenet`
}
```

(`src/lib/` and the repo-root `lib/` are two different directories — an existing naming quirk from F0, not something this phase fixes.)

### `LoginView.vue`

```vue
<script setup lang="ts">
import { redirectToBattlenetLogin } from "../lib/auth"
</script>

<template>
  <div>
    <h1>Login</h1>
    <p>Sign in with your Battle.net account to track characters and view their progress.</p>
    <button type="button" @click="redirectToBattlenetLogin">Log in with Battle.net</button>
  </div>
</template>
```

### `AuthCallbackView.vue`

```vue
<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useSessionStore } from "../stores/session.store"

const router = useRouter()
const sessionStore = useSessionStore()

onMounted(() => {
    sessionStore.markAuthenticated()
    router.replace({ name: "home" })
})
</script>

<template>
  <h1>Signing you in&hellip;</h1>
</template>
```

`router.replace` (not `push`) so the browser's back button doesn't return to `/auth/callback`.

### `NeedsReauthBanner.vue`

New file, `src/components/NeedsReauthBanner.vue` (first file in a new `src/components/` directory):

```vue
<script setup lang="ts">
import { useSessionStore } from "../stores/session.store"
import { redirectToBattlenetLogin } from "../lib/auth"

const sessionStore = useSessionStore()
</script>

<template>
  <div
    v-if="sessionStore.needsReauth"
    role="alert"
    class="bg-amber-100 text-amber-900 px-4 py-2 text-sm flex items-center justify-between gap-4"
  >
    <span>Your Battle.net session has expired. Log in again to keep tracking characters.</span>
    <button type="button" class="underline" @click="redirectToBattlenetLogin">Log in again</button>
  </div>
</template>
```

### `AppShell.vue`: conditional nav + logout + banner

- Render `<NeedsReauthBanner />` once, at the top of the shell (above the header), so it's visible regardless of route.
- Replace the nav's unconditional "Login" `RouterLink` with: `RouterLink` to `login` when `!sessionStore.isAuthenticated`, else a "Logout" `<button>` calling a local `logout()`:

```ts
async function logout() {
    await apiClient.post("/api/auth/logout")
    sessionStore.markLoggedOut()
    router.push({ name: "login" })
}
```

Both the desktop nav and the mobile nav (two separate `<nav>` blocks already in `AppShell.vue`, per F0) get the same conditional — matching the existing duplication pattern rather than introducing a new abstraction for two call sites.

### Testing

All new behavior tested with mocked `fetch`/Pinia/router, no real network or Battle.net involved — same approach F0 used:

- `session.store.ts`: default state now covers `needsReauth`; each action (`markAuthenticated`, `markLoggedOut`, `flagNeedsReauth`) tested for its exact state transition.
- `lib/api/client.ts`: two new cases — a plain `401` marks the store logged out and calls the registered handler; a `{ error: "needs_reauth" }` `401` flags `needsReauth` and does **not** call the handler or touch `isAuthenticated`.
- `src/lib/auth.ts`: `redirectToBattlenetLogin` sets `window.location.href` to the expected URL (the one place that mocks `window.location`; `LoginView` and `NeedsReauthBanner`'s own tests mock this module instead of re-testing the redirect).
- `LoginView.vue`: clicking the button calls `redirectToBattlenetLogin`.
- `AuthCallbackView.vue`: mounting it marks the session authenticated and navigates to `home`.
- `NeedsReauthBanner.vue`: hidden when `needsReauth` is `false`; visible and wired to `redirectToBattlenetLogin` when `true`.
- `AppShell.vue`: existing "renders a link for every nav destination" test still passes unauthenticated (still 4 links — same count as F0, since "Login" is still one of them by default). New case: authenticated state renders 3 links + a "Logout" button, no "Login" link.

## Acceptance Criteria

- [ ] Clicking "Log in with Battle.net" on `/login` sets `window.location.href` to `${VITE_API_BASE_URL}/api/auth/battlenet` (full redirect, not a `fetch` call).
- [ ] Landing on `/auth/callback` (however the browser got there) marks the session store authenticated and redirects to the home route with no user action required.
- [ ] The "Logout" nav action (visible only when authenticated) calls `POST /api/auth/logout`, resets both `isAuthenticated` and `needsReauth` to their logged-out defaults, and lands the user on `/login`.
- [ ] Any `401` API response without a `needs_reauth` error body marks the session store logged out and invokes the registered unauthorized handler.
- [ ] A `401` with `{ error: "needs_reauth" }` flags `needsReauth` only — `isAuthenticated` and the unauthorized handler are untouched — and the global banner becomes visible with a working "Log in again" action.
- [ ] `npm run build`, `npm run type-check`, `npm run lint`, and `npm test` all pass with zero errors.
- [ ] Manual, real-browser end-to-end verification (actual Battle.net login) is explicitly called out as blocked until the API-side `SameSite=None`/CORS/redirect-target change lands — not a gate on merging this phase's code, but not claimed as "verified" either until it does.

## Open Questions

None outstanding for this document — both open items raised while drafting it were resolved with the project owner before writing the Proposed Solution:

- **API-side prerequisite status:** confirmed **not yet implemented**. Treated here as an external blocking dependency for full manual verification (see Background/Context and the last Acceptance Criterion), not as something this phase's frontend code needs to wait on to be written, reviewed, or unit-tested.
- **`needs_reauth` plumbing timing:** confirmed to build the store state + global banner now, in F1, even without a live caller — per the umbrella PRD's own placement of that behavior under the Phase F1 heading.

## Dependencies / Follow-ups

- **Blocked on (API-side, external):** session cookie → `SameSite=None; Secure`, CORS allow-list for the frontend origin with credentials, and the OAuth callback redirecting to a frontend URL instead of returning JSON. Not implemented as of this PRD.
- **Blocks:** Phase F2 (character tracking management) needs a real, authenticated session and is the phase that finally calls `flagNeedsReauth` for real via its live profile-summary/character-detail calls.
- **Related:** F0's own Dependencies/Follow-ups section anticipated both changes this PRD makes (the interceptor, the real `login`/`auth-callback` routes) — nothing here is a surprise relative to that phase's plan.
- **Follow-up:** the umbrella PRD's own Open Questions note that `needs_reauth`'s opportunistic-only surfacing might prove too easy to miss in practice; still an accepted v1 limitation, unchanged by this phase.
