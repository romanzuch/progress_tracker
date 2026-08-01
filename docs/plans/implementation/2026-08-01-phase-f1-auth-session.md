# Phase F1 — Auth & Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase F0's `/login` and `/auth/callback` placeholders and the `session` store's stub with real Battle.net login/logout, a global 401 interceptor on the API client, and (dormant) `needs_reauth` banner plumbing — all verifiable with mocked `fetch`/Pinia/router, independent of the still-outstanding API-side `SameSite`/CORS/redirect-target change.

**Architecture:** The `session` store gains real actions; `lib/api/client.ts` gains a settable "unauthorized" handler (not a direct router import — see Task 2's note on why) plus the `401`/`needs_reauth` branching logic; a new `src/lib/auth.ts` holds the one Battle.net-redirect helper shared by `LoginView` and the new `NeedsReauthBanner`; `AppShell.vue` renders the banner globally and swaps its nav's "Login" link for a "Logout" button once authenticated; `main.ts` is the only file that wires the client's handler to the router.

**Tech Stack:** Same as F0 — Vue 3 (`<script setup lang="ts">`), Vite, Vue Router, Pinia (setup-store syntax), Tailwind CSS v4, Vitest + `@vue/test-utils` + jsdom, ESLint (flat config) + Prettier.

**Spec:** [docs/plans/prds/phase-f1-auth-session.md](../prds/phase-f1-auth-session.md)

## Global Constraints

- **Branch:** create off `main` using the git branch name Linear generates for this phase's ticket (visible on the ticket once created — F0's actual branch was `romanzuchowski/cb-93-...`, not the plan's aspirational slug, so don't hardcode a branch name here; check the ticket first).
- **Repo layout quirk carried over from F0:** the API client lives at repo-root `lib/api/client.ts`, *not* `src/lib/api/client.ts`. This phase adds a *different*, new directory, `src/lib/`, for `auth.ts` — the two `lib/` directories are unrelated; don't try to unify them, that's out of scope.
- **No path aliases.** All imports are relative. From `lib/api/client.ts` (repo root) to `src/stores/session.store.ts` is `../../src/stores/session.store`. From `src/lib/auth.ts` to `lib/api/client.ts` is `../../lib/api/client`.
- **Do not import the router from `lib/api/client.ts`.** `src/router/index.ts` statically imports `LoginView.vue`, which imports `src/lib/auth.ts`, which imports `lib/api/client.ts`. If `client.ts` imported the router back, that's a cycle. Use the `setUnauthorizedHandler` registration pattern (Task 2) instead; only `main.ts` (Task 8) ever imports both the router and the client together.
- **Every component file is `<script setup lang="ts">`.** No Options API.
- **Tests live in the flat `tests/` directory at repo root**, one file per unit, named `<PascalCaseName>.test.ts`, importing with a relative path — e.g. `../lib/api/client`, `../src/stores/session.store`.
- **`window.location` mocking happens in exactly one test file** (`tests/Auth.test.ts`, Task 3). Every other test that would otherwise need to check a Battle.net redirect instead mocks the `src/lib/auth` module itself (`vi.mock`) and asserts the mocked function was called — avoids re-deriving jsdom's `window.location` workaround in three places.
- **Before every commit:** `npm run build`, `npm run type-check`, `npm run lint`, `npm test` — all four must pass.
- **Commit messages:** plain descriptive imperative sentence (no ticket ID, no `feat:`/`fix:` prefix — matches F0's convention; the Linear ticket is tracked via the branch name only), trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- **No route guards, no session-check endpoint, no new env vars.** All explicitly out of scope per the PRD's Non-Goals.

## File Structure

**Create:**

| File | Responsibility |
| --- | --- |
| `src/lib/auth.ts` | `redirectToBattlenetLogin()` — the one shared Battle.net full-page-redirect helper |
| `src/components/NeedsReauthBanner.vue` | Global banner, visible when `session.needsReauth` is true (first file in a new `src/components/` dir) |
| `tests/Auth.test.ts` | Tests `redirectToBattlenetLogin` (the only file that mocks `window.location`) |
| `tests/ApiClientAuthInterceptor.test.ts` | Tests the 401 / `needs_reauth` branching in `lib/api/client.ts` |
| `tests/LoginView.test.ts` | Tests the login button |
| `tests/AuthCallbackView.test.ts` | Tests the callback view's mount behavior |
| `tests/NeedsReauthBanner.test.ts` | Tests the banner's visibility + action |

**Modify:**

| File | Change |
| --- | --- |
| `src/stores/session.store.ts` | Add `needsReauth` ref + `markAuthenticated`/`markLoggedOut`/`flagNeedsReauth` actions |
| `lib/api/client.ts` | Rename `baseUrl` → exported `apiBaseUrl`; add `setUnauthorizedHandler`; add 401/`needs_reauth` branching in `request()` |
| `src/views/LoginView.vue` | Real login button wired to `redirectToBattlenetLogin` |
| `src/views/AuthCallbackView.vue` | `onMounted`: mark authenticated, `router.replace` to `home` |
| `src/layouts/AppShell.vue` | Render `NeedsReauthBanner`; conditional Login link / Logout button in both nav blocks |
| `src/main.ts` | Call `setUnauthorizedHandler` wiring the client to the router |
| `tests/SessionStore.test.ts` | Cover `needsReauth` default + all three new actions |
| `tests/AppShell.test.ts` | Add Pinia setup; add authenticated-state case (3 links + Logout button) |
| `README.md` | Status line update (Task 9) |
| `PRD.md` (repo root) | Mark Phase F1 done (Task 9) |
| `docs/plans/prds/phase-f1-auth-session.md` | Status → Implemented (Task 9) |

---

## Task 1: `session` store — real state and actions

**Files:**
- Modify: `src/stores/session.store.ts`
- Test: `tests/SessionStore.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useSessionStore(): { isAuthenticated: Ref<boolean>; needsReauth: Ref<boolean>; markAuthenticated(): void; markLoggedOut(): void; flagNeedsReauth(): void }`

- [ ] **Step 1: Write the failing tests**

Replace `tests/SessionStore.test.ts` entirely:

```ts
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { useSessionStore } from "../src/stores/session.store"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("useSessionStore", () => {
  it("defaults to not authenticated with no reauth flag", () => {
    const store = useSessionStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.needsReauth).toBe(false)
  })

  it("markAuthenticated sets isAuthenticated and clears needsReauth", () => {
    const store = useSessionStore()
    store.flagNeedsReauth()

    store.markAuthenticated()

    expect(store.isAuthenticated).toBe(true)
    expect(store.needsReauth).toBe(false)
  })

  it("markLoggedOut resets both flags", () => {
    const store = useSessionStore()
    store.markAuthenticated()
    store.flagNeedsReauth()

    store.markLoggedOut()

    expect(store.isAuthenticated).toBe(false)
    expect(store.needsReauth).toBe(false)
  })

  it("flagNeedsReauth sets needsReauth without affecting isAuthenticated", () => {
    const store = useSessionStore()
    store.markAuthenticated()

    store.flagNeedsReauth()

    expect(store.isAuthenticated).toBe(true)
    expect(store.needsReauth).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/SessionStore.test.ts
```

Expected: FAIL — `needsReauth`/the three actions don't exist yet.

- [ ] **Step 3: Update the store**

Replace `src/stores/session.store.ts` entirely:

```ts
import { defineStore } from "pinia"
import { ref } from "vue"

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

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/SessionStore.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/stores/session.store.ts tests/SessionStore.test.ts && git commit -m "$(printf 'Add real state and actions to the session store\n\nReplaces the F0 placeholder (a bare isAuthenticated ref) with\nneedsReauth state and markAuthenticated/markLoggedOut/flagNeedsReauth\nactions, so callers stop mutating the ref directly.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 2: API client — `apiBaseUrl` export, unauthorized handler, 401 branching

**Files:**
- Modify: `lib/api/client.ts`
- Test: `tests/ApiClientAuthInterceptor.test.ts`

**Interfaces:**
- Consumes: `useSessionStore` (Task 1).
- Produces:
  - `apiBaseUrl: string` (renamed from the private `baseUrl` constant)
  - `setUnauthorizedHandler(handler: () => void): void`
  - The existing `apiClient`/`ApiError` exports, now with 401-branching side effects inside `request()`.

**Note on why this doesn't just import the router:** see this plan's Global Constraints — `client.ts → router` would close a cycle back through `router → LoginView.vue → src/lib/auth.ts → client.ts`. The handler-registration pattern sidesteps that entirely; verify it by never adding a `vue-router` or `../src/router` import to this file.

- [ ] **Step 1: Write the failing tests**

`tests/ApiClientAuthInterceptor.test.ts`:

```ts
import { createPinia, setActivePinia } from "pinia"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient, ApiError, setUnauthorizedHandler } from "../lib/api/client"
import { useSessionStore } from "../src/stores/session.store"

function mockFetch(
  overrides: Partial<{
    ok: boolean
    status: number
    json: () => Promise<unknown>
    text: () => Promise<string>
  }>,
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({}),
    text: async () => "",
    ...overrides,
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.unstubAllGlobals()
  setUnauthorizedHandler(() => {})
})

describe("apiClient 401 handling", () => {
  it("marks the session logged out and calls the unauthorized handler on a plain 401", async () => {
    mockFetch({ ok: false, status: 401, json: async () => ({}) })
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    await expect(apiClient.get("/api/profile/wow/characters")).rejects.toBeInstanceOf(ApiError)

    expect(sessionStore.isAuthenticated).toBe(false)
    expect(handler).toHaveBeenCalledOnce()
  })

  it("flags needsReauth without logging out or calling the handler on a needs_reauth 401", async () => {
    mockFetch({ ok: false, status: 401, json: async () => ({ error: "needs_reauth" }) })
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    await expect(apiClient.get("/api/profile/wow")).rejects.toBeInstanceOf(ApiError)

    expect(sessionStore.isAuthenticated).toBe(true)
    expect(sessionStore.needsReauth).toBe(true)
    expect(handler).not.toHaveBeenCalled()
  })

  it("does not touch the session or call the handler on a non-401 error", async () => {
    mockFetch({ ok: false, status: 500, json: async () => ({}) })
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    await expect(apiClient.get("/api/profile/wow/characters")).rejects.toBeInstanceOf(ApiError)

    expect(sessionStore.isAuthenticated).toBe(true)
    expect(handler).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/ApiClientAuthInterceptor.test.ts
```

Expected: FAIL — `setUnauthorizedHandler` doesn't exist yet.

- [ ] **Step 3: Update the client**

Replace `lib/api/client.ts` entirely:

```ts
import { useSessionStore } from "../src/stores/session.store"

export class ApiError extends Error {
    status: number
    body: unknown

    constructor(status: number, body: unknown) {
        super(`API request failed with status ${status}`)
        this.name = "ApiError"
        this.status = status
        this.body = body
    }
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: () => void): void {
    onUnauthorized = handler
}

function isNeedsReauthBody(body: unknown): body is { error: "needs_reauth" } {
    return typeof body === "object" && body !== null && (body as { error?: unknown }).error === "needs_reauth"
}

async function parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
        return response.json()
    }
    return response.text()
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response

    try {
        response = await fetch(`${apiBaseUrl}${path}`, {
            ...init,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...init.headers
            },
        })
    } catch {
        throw new ApiError(0, { message: "Network error" })
    }

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

    if (response.status === 204) {
        return undefined as T
    }

    return (await parseBody(response)) as T
}

export const apiClient = {
    get<T>(path: string): Promise<T> {
        return request<T>(path)
    },

    post<T>(path: string, body?: unknown): Promise<T> {
        return request<T>(path, {
            method: "POST",
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    },

    delete<T>(path: string): Promise<T> {
        return request<T>(path, { method: "DELETE" })
    },
}
```

- [ ] **Step 4: Run both client test files to verify they pass**

```bash
npx vitest run tests/ApiClient.test.ts tests/ApiClientAuthInterceptor.test.ts
```

Expected: PASS (5 + 3 tests). `tests/ApiClient.test.ts` (F0's, unchanged) still passes since `credentials: 'include'`/method/body behavior is untouched.

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add lib/api/client.ts tests/ApiClientAuthInterceptor.test.ts && git commit -m "$(printf 'Add a 401 interceptor to the API client\n\nA plain 401 marks the session logged out and calls a registered\nunauthorized handler; a 401 with { error: "needs_reauth" } instead\nflags needsReauth and leaves the session alone. The client takes a\nsettable handler rather than importing the router directly, to avoid\na module cycle through the login view and its redirect helper.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 3: Shared Battle.net redirect helper

**Files:**
- Create: `src/lib/auth.ts`
- Test: `tests/Auth.test.ts`

**Interfaces:**
- Consumes: `apiBaseUrl` (Task 2).
- Produces: `redirectToBattlenetLogin(): void` from `src/lib/auth.ts`.

- [ ] **Step 1: Write the failing test**

`tests/Auth.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { redirectToBattlenetLogin } from "../src/lib/auth"

describe("redirectToBattlenetLogin", () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    })
  })

  it("sets window.location.href to the API's Battle.net OAuth endpoint", () => {
    redirectToBattlenetLogin()

    expect(window.location.href).toContain("/api/auth/battlenet")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/Auth.test.ts
```

Expected: FAIL — `Cannot find module '../src/lib/auth'`.

- [ ] **Step 3: Write the helper**

`src/lib/auth.ts`:

```ts
import { apiBaseUrl } from "../../lib/api/client"

export function redirectToBattlenetLogin(): void {
    window.location.href = `${apiBaseUrl}/api/auth/battlenet`
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/Auth.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts tests/Auth.test.ts && git commit -m "$(printf 'Add the shared Battle.net login redirect helper\n\nOne function, reused by LoginView and the reauth banner, so the OAuth\nentry URL is built in exactly one place.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 4: `LoginView.vue`

**Files:**
- Modify: `src/views/LoginView.vue`
- Test: `tests/LoginView.test.ts`

**Interfaces:**
- Consumes: `redirectToBattlenetLogin` (Task 3).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Write the failing test**

`tests/LoginView.test.ts`:

```ts
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import LoginView from "../src/views/LoginView.vue"

vi.mock("../src/lib/auth", () => ({
  redirectToBattlenetLogin: vi.fn(),
}))

import { redirectToBattlenetLogin } from "../src/lib/auth"

describe("LoginView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to Battle.net login when the button is clicked", async () => {
    const wrapper = mount(LoginView)

    await wrapper.find("button").trigger("click")

    expect(redirectToBattlenetLogin).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/LoginView.test.ts
```

Expected: FAIL — the current placeholder has no `<button>`.

- [ ] **Step 3: Write the view**

Replace `src/views/LoginView.vue` entirely:

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

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/LoginView.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/views/LoginView.vue tests/LoginView.test.ts && git commit -m "$(printf 'Wire up the login button\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 5: `AuthCallbackView.vue`

**Files:**
- Modify: `src/views/AuthCallbackView.vue`
- Test: `tests/AuthCallbackView.test.ts`

**Interfaces:**
- Consumes: `useSessionStore` (Task 1).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Write the failing test**

`tests/AuthCallbackView.test.ts`:

```ts
import { flushPromises, mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import AuthCallbackView from "../src/views/AuthCallbackView.vue"
import { useSessionStore } from "../src/stores/session.store"

describe("AuthCallbackView", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("marks the session authenticated and redirects to home on mount", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/auth/callback", name: "auth-callback", component: AuthCallbackView },
        { path: "/", name: "home", component: { template: "<div>home</div>" } },
      ],
    })
    await router.push("/auth/callback")
    await router.isReady()

    const sessionStore = useSessionStore()
    mount(AuthCallbackView, { global: { plugins: [router] } })
    await flushPromises()

    expect(sessionStore.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.name).toBe("home")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/AuthCallbackView.test.ts
```

Expected: FAIL — the current placeholder does nothing on mount.

- [ ] **Step 3: Write the view**

Replace `src/views/AuthCallbackView.vue` entirely:

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

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/AuthCallbackView.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/views/AuthCallbackView.vue tests/AuthCallbackView.test.ts && git commit -m "$(printf 'Handle the OAuth callback landing route\n\nArriving here at all means the API already completed the Battle.net\nflow and set the session cookie, so the view just marks the store\nauthenticated and replaces straight to home.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 6: `NeedsReauthBanner.vue`

**Files:**
- Create: `src/components/NeedsReauthBanner.vue`
- Test: `tests/NeedsReauthBanner.test.ts`

**Interfaces:**
- Consumes: `useSessionStore` (Task 1), `redirectToBattlenetLogin` (Task 3).
- Produces: `NeedsReauthBanner.vue`, a default-exported SFC with no props, consumed by `AppShell.vue` (Task 7).

- [ ] **Step 1: Write the failing tests**

`tests/NeedsReauthBanner.test.ts`:

```ts
import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import NeedsReauthBanner from "../src/components/NeedsReauthBanner.vue"
import { useSessionStore } from "../src/stores/session.store"

vi.mock("../src/lib/auth", () => ({
  redirectToBattlenetLogin: vi.fn(),
}))

import { redirectToBattlenetLogin } from "../src/lib/auth"

describe("NeedsReauthBanner", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it("renders nothing when needsReauth is false", () => {
    const wrapper = mount(NeedsReauthBanner)

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it("renders the banner and redirects on click when needsReauth is true", async () => {
    const sessionStore = useSessionStore()
    sessionStore.flagNeedsReauth()

    const wrapper = mount(NeedsReauthBanner)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.find("button").trigger("click")

    expect(redirectToBattlenetLogin).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/NeedsReauthBanner.test.ts
```

Expected: FAIL — `Cannot find module '../src/components/NeedsReauthBanner.vue'`.

- [ ] **Step 3: Write the component**

`src/components/NeedsReauthBanner.vue`:

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

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/NeedsReauthBanner.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/components/NeedsReauthBanner.vue tests/NeedsReauthBanner.test.ts && git commit -m "$(printf 'Add the needs_reauth banner\n\nGlobally visible whenever session.needsReauth is true. Nothing sets\nthat flag for real yet (that needs a live Battle.net-backed call,\nwhich lands in Phase F2) — this task only builds the dormant plumbing,\nper the umbrella PRD placing this behavior under Phase F1.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 7: `AppShell.vue` — banner + conditional nav + logout

**Files:**
- Modify: `src/layouts/AppShell.vue`
- Test: `tests/AppShell.test.ts`

**Interfaces:**
- Consumes: `NeedsReauthBanner` (Task 6), `useSessionStore` (Task 1), `apiClient` (Task 2).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Update the test**

Replace `tests/AppShell.test.ts` entirely:

```ts
import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import AppShell from "../src/layouts/AppShell.vue"
import { useSessionStore } from "../src/stores/session.store"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("AppShell", () => {
  it("hides the mobile nav until the toggle is clicked", async () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll("nav")).toHaveLength(1)

    await wrapper.find("button").trigger("click")

    expect(wrapper.findAll("nav")).toHaveLength(2)
  })

  it("renders a link for every nav destination when unauthenticated, including Login", () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll("router-link-stub")).toHaveLength(4)
    expect(wrapper.text()).toContain("Login")
    expect(wrapper.text()).not.toContain("Logout")
  })

  it("swaps Login for a Logout button when authenticated", () => {
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll("router-link-stub")).toHaveLength(3)
    expect(wrapper.text()).toContain("Logout")
    expect(wrapper.text()).not.toContain("Login")
  })
})
```

- [ ] **Step 2: Run it to verify the new/changed assertions fail**

```bash
npx vitest run tests/AppShell.test.ts
```

Expected: FAIL on the second and third cases — the current shell always renders a static "Login" link and never reads the session store.

- [ ] **Step 3: Update the shell**

Replace `src/layouts/AppShell.vue` entirely:

```vue
<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { apiClient } from "../../lib/api/client"
import { useSessionStore } from "../stores/session.store"
import NeedsReauthBanner from "../components/NeedsReauthBanner.vue"

const isMobileNavOpen = ref(false)
const sessionStore = useSessionStore()
const router = useRouter()

const navLinks = computed(() => [
  { to: { name: "home" }, label: "Dashboard" },
  { to: { name: "characters-add" }, label: "Add character" },
  { to: { name: "settings" }, label: "Settings" },
])

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

async function logout() {
  await apiClient.post("/api/auth/logout")
  sessionStore.markLoggedOut()
  router.push({ name: "login" })
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NeedsReauthBanner />
    <header class="border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <span class="font-semibold">WoW Tracker</span>
        <button
          type="button"
          class="sm:hidden"
          aria-label="Toggle navigation"
          @click="toggleMobileNav"
        >
          &#9776;
        </button>
        <nav class="hidden sm:flex sm:gap-4 sm:items-center">
          <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
            {{ link.label }}
          </RouterLink>
          <RouterLink v-if="!sessionStore.isAuthenticated" :to="{ name: 'login' }">
            Login
          </RouterLink>
          <button v-else type="button" @click="logout">Logout</button>
        </nav>
      </div>
      <nav v-if="isMobileNavOpen" class="mt-2 flex flex-col gap-2 sm:hidden">
        <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
          {{ link.label }}
        </RouterLink>
        <RouterLink v-if="!sessionStore.isAuthenticated" :to="{ name: 'login' }">
          Login
        </RouterLink>
        <button v-else type="button" @click="logout">Logout</button>
      </nav>
    </header>
    <main class="flex-1 p-4">
      <RouterView />
    </main>
  </div>
</template>
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/AppShell.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Manual responsive + banner check**

```bash
npm run dev
```

Confirm: nav shows "Login" by default; the mobile toggle still works; nothing renders from `NeedsReauthBanner` (no way to trigger it manually yet without a real API — this is expected per this phase's scope).

- [ ] **Step 7: Commit**

```bash
git add src/layouts/AppShell.vue tests/AppShell.test.ts && git commit -m "$(printf 'Wire session state into the app shell\n\nRenders the needs_reauth banner globally and swaps the nav Login link\nfor a Logout button once authenticated.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 8: Wire the client's unauthorized handler to the router

**Files:**
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `setUnauthorizedHandler` (Task 2), `router` (F0).
- Produces: nothing new — this is the composition root wiring, not a reusable interface.

- [ ] **Step 1: Update `main.ts`**

Replace `src/main.ts` entirely:

```ts
import { createApp } from "vue"
import { createPinia } from "pinia"
import "./style.css"
import App from "./App.vue"
import { router } from "./router/index.ts"
import { setUnauthorizedHandler } from "../lib/api/client"

setUnauthorizedHandler(() => {
    if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" })
    }
})

createApp(App)
    .use(createPinia())
    .use(router)
    .mount("#app")
```

- [ ] **Step 2: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 3: Manual check**

```bash
npm run dev
```

Confirm the app still mounts with no console errors (this wiring has no automated test — it's two lines of composition-root glue with no branching logic of its own; the branching it calls is already covered by Task 2's tests).

- [ ] **Step 4: Commit**

```bash
git add src/main.ts && git commit -m "$(printf 'Wire the API client unauthorized handler to the router\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 9: Docs and final verification

**Files:**
- Modify: `README.md`, `PRD.md` (repo root), `docs/plans/prds/phase-f1-auth-session.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Update `README.md`'s Status section**

In `README.md`, change:

```md
## Status

Phase F0 (foundation: router, Pinia, Tailwind, API client, tooling) is complete. See `PRD.md`'s Roadmap for what's next.
```

to:

```md
## Status

Phase F0 (foundation) and Phase F1 (auth & session: login/logout, session store, API client 401 interceptor, needs_reauth banner plumbing) are complete. Full end-to-end login is still blocked on an API-side change — see `PRD.md`'s Architecture section. See `PRD.md`'s Roadmap for what's next.
```

- [ ] **Step 2: Update the umbrella `PRD.md`**

Change the Phase F1 heading:

```md
### Phase F1 — Auth & session
```

to:

```md
### Phase F1 — Auth & session (Done)
```

- [ ] **Step 3: Update this phase's own PRD status**

In `docs/plans/prds/phase-f1-auth-session.md`, change:

```md
## Status

Draft
```

to:

```md
## Status

Implemented
```

- [ ] **Step 4: Final full verification**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

Expected: all four succeed with zero errors.

- [ ] **Step 5: Commit**

```bash
git add README.md PRD.md docs/plans/prds/phase-f1-auth-session.md && git commit -m "$(printf 'Document Phase F1 setup and mark it complete\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Self-Review Notes

- **Spec coverage:** every PRD goal maps to a task — login redirect (Task 4), auth-callback handling (Task 5), logout (Task 7), session store actions (Task 1), API client interceptor (Task 2), needs_reauth banner (Task 6), router wiring (Task 8), docs (Task 9).
- **No circular imports:** `lib/api/client.ts` imports only `session.store.ts` (Task 2), never the router; the router only reaches `client.ts` transitively through `LoginView.vue → src/lib/auth.ts`, one direction only. `main.ts` (Task 8) is the sole place both are imported together.
- **Test isolation for `window.location`:** mocked in exactly one file (`tests/Auth.test.ts`); every other affected test (`LoginView`, `NeedsReauthBanner`) mocks `src/lib/auth` instead.
- **Type consistency:** `apiBaseUrl` is defined once (Task 2) and imported everywhere it's needed (Task 3). The `needs_reauth` body shape (`{ error: "needs_reauth" }`) is checked in exactly one place (`isNeedsReauthBody` in `lib/api/client.ts`, Task 2) — no duplicate parsing logic elsewhere.
- **No placeholders:** every step ships real, complete code — no `TODO`/`TBD`.
- **Known limitation carried into this phase, not fixed by it:** per the PRD's Non-Goals, `isAuthenticated` still starts `false` on every fresh page load that isn't `/auth/callback`, since there's no session-check endpoint to call. This is unchanged from the umbrella PRD's own accepted v1 scope, not a gap introduced here.
