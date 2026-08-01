# Phase F0 — Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the default Vite + Vue 3 JS scaffold in this repo into a TypeScript foundation with Vue Router (every future page stubbed), Pinia store skeletons, Tailwind CSS v4, a responsive app shell, an API client module, and the test/lint tooling later phases build on.

**Architecture:** No application logic yet — this is pure scaffolding. Each of Router, Pinia, Tailwind, and the API client is installed and wired into `main.ts` independently, verified by its own smoke-level test, so each task leaves the app in a working, buildable state. Placeholder view components exist only so the router has something real to point at.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Vite, Vue Router, Pinia (setup-store syntax), Tailwind CSS v4 (`@tailwindcss/vite`), Vitest + `@vue/test-utils` + jsdom, ESLint (flat config) + Prettier.

**Spec:** [docs/plans/prds/phase-f0-foundation.md](../prds/phase-f0-foundation.md)

## Global Constraints

- **Repo has no git history yet.** Task 1 runs `git init` and commits the pre-existing scaffold as a baseline on `main` before anything else changes.
- **Branch:** `phase-f0-foundation`, created off `main` immediately after the baseline commit (Task 1). All other tasks commit to this branch.
- **ESM, no explicit `.js` suffix on relative imports.** `package.json` already has `"type": "module"`, but unlike a Node-run API project, Vite/`vue-tsc` resolve extensionless relative imports (`.ts`/`.vue`) natively — do not append `.js` to import paths in this project.
- **No path aliases.** All imports are relative (`../src/...`, `./...`). No `@/*` alias is configured.
- **Every component file is `<script setup lang="ts">`.** No Options API, no plain `<script>`.
- **Tests live in a flat `tests/` directory at repo root**, one file per unit under test, named `<PascalCaseName>.test.ts`, importing the unit with a relative path (e.g. `../src/lib/api/client`).
- **Before every commit:** `npm run build`, `npm run type-check`, `npm run lint`, `npm test` — all four must pass.
- **Commit messages:** plain descriptive imperative sentence (no ticket ID, no `feat:`/`fix:` prefix), trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- **No custom Tailwind theme, no component library, no real API calls, no auth logic** — all explicitly out of scope for this phase (see the PRD's Non-Goals).

## File Structure

**Create:**

| File | Responsibility |
| --- | --- |
| `tsconfig.json`, `tsconfig.node.json` | TypeScript project config (app + Vite config) |
| `src/env.d.ts` | Vite client types, `.vue` module shim, `ImportMetaEnv` |
| `src/lib/api/client.ts` | `apiClient` (`get`/`post`/`delete`) + `ApiError` |
| `src/stores/session.store.ts` | `useSessionStore` skeleton |
| `src/stores/trackedCharacters.store.ts` | `useTrackedCharactersStore` skeleton + `TrackedCharacter` type |
| `src/stores/locale.store.ts` | `useLocaleStore` skeleton |
| `src/router/index.ts` | `router` — every stubbed route |
| `src/views/HomeView.vue`, `LoginView.vue`, `AuthCallbackView.vue`, `CharactersAddView.vue`, `CharacterDetailView.vue`, `SettingsView.vue`, `NotFoundView.vue` | Placeholder page components |
| `src/layouts/AppShell.vue` | Header, responsive nav, `<RouterView>` |
| `.env.example` | `VITE_API_BASE_URL` placeholder |
| `eslint.config.js`, `.prettierrc.json` | Lint/format config |
| `tests/AppMount.test.ts` (temporary, removed in Task 9) | Proves the Vitest harness works |
| `tests/ApiClient.test.ts`, `tests/SessionStore.test.ts`, `tests/TrackedCharactersStore.test.ts`, `tests/LocaleStore.test.ts`, `tests/Router.test.ts`, `tests/AppShell.test.ts` | Task-level tests |

**Modify:**

| File | Change |
| --- | --- |
| `package.json` | New dependencies + `type-check`/`test`/`test:watch`/`lint`/`format` scripts |
| `vite.config.ts` (renamed from `.js`) | Vitest config block (Task 3), Tailwind plugin (Task 5) |
| `src/main.ts` (renamed from `.js`) | Register Pinia (Task 7), then Router (Task 8) |
| `src/App.vue` | Trivial placeholder (Task 2) → renders `<AppShell />` (Task 9) |
| `src/style.css` | Replaced with the Tailwind import (Task 5) |
| `.gitignore` | Add explicit `.env` line |
| `README.md` | Setup, env vars, and available scripts (Task 10) |
| `PRD.md` (repo root) | Mark Phase F0 done (Task 10) |
| `docs/plans/prds/phase-f0-foundation.md` | Status → Implemented (Task 10) |

**Delete:**

| File | Reason |
| --- | --- |
| `src/components/HelloWorld.vue` | Scaffold leftover, not part of any planned view |
| `src/assets/vue.svg`, `src/assets/hero.png` | Unused scaffold assets |

---

## Task 1: Git baseline and branch

**Files:**
- Modify: `.gitignore`

**Interfaces:** None — no application code yet.

- [ ] **Step 1: Check repo state**

```bash
git status
```

Expected: `fatal: not a git repository` — confirms there's nothing to lose.

- [ ] **Step 2: Initialize git**

```bash
git init
```

- [ ] **Step 3: Explicitly ignore `.env`**

The existing `.gitignore` covers `*.local` but not a plain `.env`. Add a line so a real `.env` (created later from `.env.example`) is never committed. Add, right after the `*.local` line:

```
.env
```

- [ ] **Step 4: Commit the baseline scaffold**

```bash
git add -A && git commit -m "$(printf 'Commit pre-F0 Vite + Vue scaffold as a baseline\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

- [ ] **Step 5: Create the working branch**

```bash
git checkout -b phase-f0-foundation
```

Expected: `Switched to a new branch 'phase-f0-foundation'`. All remaining tasks commit here.

---

## Task 2: Convert the project to TypeScript

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`, `src/env.d.ts`
- Modify: `vite.config.ts` (renamed from `.js`), `src/main.ts` (renamed from `.js`), `src/App.vue`, `package.json`
- Delete: `src/components/HelloWorld.vue`, `src/assets/vue.svg`, `src/assets/hero.png`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a TypeScript-buildable project; `npm run type-check` script.

- [ ] **Step 1: Install TypeScript tooling**

```bash
npm install -D typescript vue-tsc
```

- [ ] **Step 2: Add `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Add `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Add `src/env.d.ts`**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 5: Rename the Vite config and main entry to TypeScript**

```bash
git mv vite.config.js vite.config.ts
git mv src/main.js src/main.ts
```

`vite.config.ts` content stays the same for now:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

- [ ] **Step 6: Remove the scaffold leftovers**

```bash
git rm src/components/HelloWorld.vue src/assets/vue.svg src/assets/hero.png
```

- [ ] **Step 7: Replace `src/App.vue` with a typed placeholder**

```vue
<script setup lang="ts"></script>

<template>
  <div>wow-tracker</div>
</template>
```

- [ ] **Step 8: Add the `type-check` script**

In `package.json`, add to `"scripts"`:

```json
"type-check": "vue-tsc --noEmit"
```

- [ ] **Step 9: Verify the build and type-check pass**

```bash
npm run build && npm run type-check
```

Expected: both succeed with no errors.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "$(printf 'Convert project to TypeScript\n\nAdds tsconfig/vue-tsc, renames the Vite config and entry point to .ts,\nand removes the create-vue scaffold leftovers (HelloWorld and its assets)\nthat no phase plans to use.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 3: Test tooling (Vitest + Vue Test Utils)

**Files:**
- Modify: `vite.config.ts`, `package.json`
- Test: `tests/AppMount.test.ts`

**Interfaces:**
- Consumes: `App.vue` (Task 2).
- Produces: `npm test` / `npm run test:watch` scripts; the `tests/` convention every later task's tests follow.

- [ ] **Step 1: Install the test dependencies**

```bash
npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 2: Write the failing test**

`tests/AppMount.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../src/App.vue'

describe('App', () => {
  it('mounts and renders its placeholder content', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('wow-tracker')
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

```bash
npx vitest run tests/AppMount.test.ts
```

Expected: FAIL — no test runner is configured yet (`vitest` command not found, or it errors immediately without a jsdom environment).

- [ ] **Step 4: Add the Vitest config block**

Replace `vite.config.ts` entirely:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 5: Add the `test` scripts**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run it to verify it passes**

```bash
npm test
```

Expected: PASS (1 test).

- [ ] **Step 7: Build, type-check, commit**

```bash
npm run build && npm run type-check
```

```bash
git add -A && git commit -m "$(printf 'Add Vitest and Vue Test Utils\n\njsdom environment configured directly on the Vite config via the\nvitest/config triple-slash reference. tests/AppMount.test.ts is the first\nreal test, proving the harness against actual app code rather than a\nthrowaway assertion.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 4: ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing new — lints whatever exists in the repo so far.
- Produces: `npm run lint` / `npm run format` scripts.

- [ ] **Step 1: Install the lint/format dependencies**

```bash
npm install -D eslint @eslint/js eslint-plugin-vue @vue/eslint-config-typescript @vue/eslint-config-prettier prettier
```

- [ ] **Step 2: Add `eslint.config.js`**

```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  skipFormatting,
]
```

- [ ] **Step 3: Add `.prettierrc.json`**

Matches the no-semicolon, single-quote style the scaffold already used:

```json
{
  "semi": false,
  "singleQuote": true
}
```

- [ ] **Step 4: Add the `lint` and `format` scripts**

In `package.json`, add to `"scripts"`:

```json
"lint": "eslint . --fix",
"format": "prettier --write src/ tests/"
```

- [ ] **Step 5: Run lint and fix anything it flags**

```bash
npm run lint
```

Expected: exits 0. If it flags anything in files from Tasks 1–3, fix them (most likely quote/semicolon style — `--fix` handles that automatically).

- [ ] **Step 6: Build, type-check, test, commit**

```bash
npm run build && npm run type-check && npm test
```

```bash
git add -A && git commit -m "$(printf 'Add ESLint and Prettier\n\nStandard flat-config Vue + TypeScript ESLint setup with Prettier wired in\nlast so its formatting rules win over any conflicting stylistic lint rule.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 5: Tailwind CSS v4

**Files:**
- Modify: `vite.config.ts`, `src/style.css`
- Package: adds `tailwindcss`, `@tailwindcss/vite`

**Interfaces:**
- Consumes: nothing new.
- Produces: Tailwind utility classes usable in any `.vue` file from Task 6 onward.

- [ ] **Step 1: Install Tailwind**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add the Tailwind Vite plugin**

Replace `vite.config.ts` entirely:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Replace the stylesheet**

Replace the entire contents of `src/style.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Manually verify Tailwind is live**

Temporarily add `class="bg-red-500"` to the `<div>` in `src/App.vue`, then:

```bash
npm run dev
```

Open the printed local URL in a browser and confirm the placeholder text has a red background. Remove the temporary class from `App.vue` afterward — this step is a manual check, not a committed change.

- [ ] **Step 5: Build, type-check, test, commit**

```bash
npm run build && npm run type-check && npm test
```

```bash
git add -A && git commit -m "$(printf 'Add Tailwind CSS v4\n\nCSS-first setup via the @tailwindcss/vite plugin — no tailwind.config.js\nand no custom theme yet, per the PRD (default palette only for F0).\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 6: API client module

**Files:**
- Create: `src/lib/api/client.ts`
- Test: `tests/ApiClient.test.ts`

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_BASE_URL` (typed in Task 2's `env.d.ts`).
- Produces:
  - `class ApiError extends Error { status: number; body: unknown }` from `src/lib/api/client.ts`
  - `apiClient: { get<T>(path: string): Promise<T>; post<T>(path: string, body?: unknown): Promise<T>; delete<T>(path: string): Promise<T> }` from the same file

- [ ] **Step 1: Write the failing tests**

`tests/ApiClient.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient, ApiError } from '../src/lib/api/client'

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
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({}),
    text: async () => '',
    ...overrides,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiClient', () => {
  it('sends every request with credentials: include', async () => {
    const fetchMock = mockFetch({ json: async () => ({ hello: 'world' }) })

    const result = await apiClient.get<{ hello: string }>('/api/ping')

    expect(result).toEqual({ hello: 'world' })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.credentials).toBe('include')
  })

  it('throws an ApiError with the response status and parsed JSON body on a non-2xx response', async () => {
    mockFetch({ ok: false, status: 404, json: async () => ({ error: 'not_found' }) })

    const failure = apiClient.get('/api/missing')

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({
      status: 404,
      body: { error: 'not_found' },
    })
  })

  it('throws ApiError(0, ...) when fetch itself rejects (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(apiClient.get('/api/ping')).rejects.toMatchObject({ status: 0 })
  })

  it('serializes the body and sets POST as the method', async () => {
    const fetchMock = mockFetch({ json: async () => ({}) })

    await apiClient.post('/api/things', { name: 'thrall' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ name: 'thrall' }))
  })

  it('sets DELETE as the method with no body', async () => {
    const fetchMock = mockFetch({ json: async () => ({}) })

    await apiClient.delete('/api/things/1')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('DELETE')
    expect(init.body).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run tests/ApiClient.test.ts
```

Expected: FAIL — `Cannot find module '../src/lib/api/client'`.

- [ ] **Step 3: Write the client**

`src/lib/api/client.ts`:

```ts
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, { message: 'Network error' })
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseBody(response))
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
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/ApiClient.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/lib tests/ApiClient.test.ts && git commit -m "$(printf 'Add the API client module\n\nA thin fetch wrapper: base URL from VITE_API_BASE_URL, credentials:\ninclude on every request, and a single ApiError type for both non-2xx\nresponses and network failures so callers only ever handle one error\nshape. No auth-redirect interceptor yet — that needs a real /login route,\nwhich lands in Phase F1.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 7: Pinia store skeletons

**Files:**
- Create: `src/stores/session.store.ts`, `src/stores/trackedCharacters.store.ts`, `src/stores/locale.store.ts`
- Modify: `src/main.ts`, `package.json`
- Test: `tests/SessionStore.test.ts`, `tests/TrackedCharactersStore.test.ts`, `tests/LocaleStore.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `useSessionStore(): { isAuthenticated: Ref<boolean> }` from `src/stores/session.store.ts`
  - `useTrackedCharactersStore(): { characters: Ref<TrackedCharacter[]> }` and `interface TrackedCharacter { id: string; realmSlug: string; characterName: string }` from `src/stores/trackedCharacters.store.ts`
  - `useLocaleStore(): { locale: Ref<string> }` from `src/stores/locale.store.ts`

- [ ] **Step 1: Install Pinia**

```bash
npm install pinia
```

- [ ] **Step 2: Write the failing tests**

`tests/SessionStore.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '../src/stores/session.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useSessionStore', () => {
  it('defaults to not authenticated', () => {
    const store = useSessionStore()
    expect(store.isAuthenticated).toBe(false)
  })
})
```

`tests/TrackedCharactersStore.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTrackedCharactersStore } from '../src/stores/trackedCharacters.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useTrackedCharactersStore', () => {
  it('defaults to an empty character list', () => {
    const store = useTrackedCharactersStore()
    expect(store.characters).toEqual([])
  })
})
```

`tests/LocaleStore.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocaleStore } from '../src/stores/locale.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useLocaleStore', () => {
  it('defaults to en_US, matching the API\'s documented default', () => {
    const store = useLocaleStore()
    expect(store.locale).toBe('en_US')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run tests/SessionStore.test.ts tests/TrackedCharactersStore.test.ts tests/LocaleStore.test.ts
```

Expected: FAIL — none of the three store modules exist yet.

- [ ] **Step 3: Write the stores**

`src/stores/session.store.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

// F1 fills this in with real login/logout state; today it only exists so
// later phases (and the app shell's nav) have a store to import.
export const useSessionStore = defineStore('session', () => {
  const isAuthenticated = ref(false)

  return { isAuthenticated }
})
```

`src/stores/trackedCharacters.store.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrackedCharacter {
  id: string
  realmSlug: string
  characterName: string
}

// F2/F3 add the real fields (latestSnapshot, etc.) and actions (add/remove,
// fetch). This skeleton only fixes the shape's name and default state.
export const useTrackedCharactersStore = defineStore('trackedCharacters', () => {
  const characters = ref<TrackedCharacter[]>([])

  return { characters }
})
```

`src/stores/locale.store.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

// Matches the API's documented default of en_US when no locale is sent.
// F5 adds persistence and the settings UI that changes this.
export const useLocaleStore = defineStore('locale', () => {
  const locale = ref('en_US')

  return { locale }
})
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/SessionStore.test.ts tests/TrackedCharactersStore.test.ts tests/LocaleStore.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Register Pinia in `main.ts`**

Replace `src/main.ts` entirely:

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
```

- [ ] **Step 6: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/stores src/main.ts tests/SessionStore.test.ts tests/TrackedCharactersStore.test.ts tests/LocaleStore.test.ts package.json package-lock.json && git commit -m "$(printf 'Add Pinia store skeletons\n\nThree setup stores (session, trackedCharacters, locale) with only a\ndefault state and no actions yet — later phases (F1/F2/F5) fill in real\nbehavior. Registered globally in main.ts.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 8: Placeholder views and Vue Router

**Files:**
- Create: `src/views/HomeView.vue`, `LoginView.vue`, `AuthCallbackView.vue`, `CharactersAddView.vue`, `CharacterDetailView.vue`, `SettingsView.vue`, `NotFoundView.vue`, `src/router/index.ts`
- Modify: `src/main.ts`
- Test: `tests/Router.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `router: Router` from `src/router/index.ts`, with named routes `home`, `login`, `auth-callback`, `characters-add`, `character-detail`, `settings`, `not-found`.

- [ ] **Step 1: Install Vue Router**

```bash
npm install vue-router
```

- [ ] **Step 2: Write the placeholder views**

`src/views/HomeView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Home</h1>
</template>
```

`src/views/LoginView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Login</h1>
</template>
```

`src/views/AuthCallbackView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Signing you in&hellip;</h1>
</template>
```

`src/views/CharactersAddView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Add a Character</h1>
</template>
```

`src/views/CharacterDetailView.vue`:

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Character Detail</h1>
  <p>{{ route.params.realmSlug }} / {{ route.params.characterName }}</p>
</template>
```

`src/views/SettingsView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Settings</h1>
</template>
```

`src/views/NotFoundView.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <h1>Page not found</h1>
</template>
```

- [ ] **Step 3: Write the failing router test**

`tests/Router.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { router } from '../src/router'

describe('router', () => {
  it('resolves every named route to its expected path', () => {
    expect(router.resolve({ name: 'home' }).path).toBe('/')
    expect(router.resolve({ name: 'login' }).path).toBe('/login')
    expect(router.resolve({ name: 'auth-callback' }).path).toBe('/auth/callback')
    expect(router.resolve({ name: 'characters-add' }).path).toBe('/characters/add')
    expect(
      router.resolve({
        name: 'character-detail',
        params: { realmSlug: 'dun-morogh', characterName: 'sixfootfour' },
      }).path,
    ).toBe('/characters/dun-morogh/sixfootfour')
    expect(router.resolve({ name: 'settings' }).path).toBe('/settings')
  })

  it('falls back to the not-found route for an unmatched path', () => {
    expect(router.resolve('/this/does/not/exist').name).toBe('not-found')
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

```bash
npx vitest run tests/Router.test.ts
```

Expected: FAIL — `Cannot find module '../src/router'`.

- [ ] **Step 5: Write the router**

`src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import CharactersAddView from '../views/CharactersAddView.vue'
import CharacterDetailView from '../views/CharacterDetailView.vue'
import SettingsView from '../views/SettingsView.vue'
import NotFoundView from '../views/NotFoundView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/auth/callback', name: 'auth-callback', component: AuthCallbackView },
    { path: '/characters/add', name: 'characters-add', component: CharactersAddView },
    {
      path: '/characters/:realmSlug/:characterName',
      name: 'character-detail',
      component: CharacterDetailView,
    },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})
```

- [ ] **Step 6: Run it to verify it passes**

```bash
npx vitest run tests/Router.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 7: Register the router in `main.ts`**

Replace `src/main.ts` entirely:

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
```

- [ ] **Step 8: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 9: Commit**

```bash
git add src/views src/router src/main.ts tests/Router.test.ts package.json package-lock.json && git commit -m "$(printf 'Add Vue Router with every phase route stubbed\n\nOne named route per page the umbrella PRD plans across F1–F5, each\npointing at a placeholder view. Structure now, behavior later — no view\ndoes anything beyond rendering a heading.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 9: Responsive app shell

**Files:**
- Create: `src/layouts/AppShell.vue`
- Modify: `src/App.vue`
- Delete: `tests/AppMount.test.ts` (superseded — `App.vue` no longer has interesting content of its own)
- Test: `tests/AppShell.test.ts`

**Interfaces:**
- Consumes: `router` named routes (Task 8) for the nav's `RouterLink` targets.
- Produces: `AppShell.vue`, a default-exported SFC with no props, rendered by `App.vue`.

- [ ] **Step 1: Write the failing test**

`tests/AppShell.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppShell from '../src/layouts/AppShell.vue'

describe('AppShell', () => {
  it('hides the mobile nav until the toggle is clicked', async () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll('nav')).toHaveLength(1)

    await wrapper.find('button').trigger('click')

    expect(wrapper.findAll('nav')).toHaveLength(2)
  })

  it('renders a link for every nav destination', () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll('router-link-stub')).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/AppShell.test.ts
```

Expected: FAIL — `Cannot find module '../src/layouts/AppShell.vue'`.

- [ ] **Step 3: Write the app shell**

`src/layouts/AppShell.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isMobileNavOpen = ref(false)

const navLinks = [
  { to: { name: 'home' }, label: 'Dashboard' },
  { to: { name: 'characters-add' }, label: 'Add character' },
  { to: { name: 'settings' }, label: 'Settings' },
  { to: { name: 'login' }, label: 'Login' },
]

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
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
        <nav class="hidden sm:flex sm:gap-4">
          <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
      <nav v-if="isMobileNavOpen" class="mt-2 flex flex-col gap-2 sm:hidden">
        <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
          {{ link.label }}
        </RouterLink>
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

Expected: PASS (2 tests).

- [ ] **Step 5: Wire `AppShell` into `App.vue` and retire the old mount test**

Replace `src/App.vue` entirely:

```vue
<script setup lang="ts">
import AppShell from './layouts/AppShell.vue'
</script>

<template>
  <AppShell />
</template>
```

```bash
git rm tests/AppMount.test.ts
```

- [ ] **Step 6: Build, type-check, lint, full suite**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

- [ ] **Step 7: Manual responsive check**

```bash
npm run dev
```

Open the printed local URL. At a desktop width, confirm the four nav links render inline in the header. Resize (or use browser dev tools' device toolbar) below Tailwind's `sm` breakpoint (640px) and confirm the inline nav disappears, replaced by the &#9776; toggle button; clicking it reveals the same four links stacked vertically. Click each link and confirm it navigates to its placeholder view inside the shell.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "$(printf 'Add the responsive app shell\n\nHeader with a mobile hamburger toggle (hidden nav below the sm breakpoint,\ninline above it) wrapping RouterView. App.vue is now a thin wrapper around\nit, so tests/AppMount.test.ts (which tested App.vue directly) is retired in\nfavor of tests/AppShell.test.ts.\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Task 10: Env config, docs, and final verification

**Files:**
- Create: `.env.example`
- Modify: `README.md`, `PRD.md` (repo root), `docs/plans/prds/phase-f0-foundation.md`

**Interfaces:** None — documentation and configuration only.

- [ ] **Step 1: Add `.env.example`**

```
VITE_API_BASE_URL=http://localhost:3000
```

- [ ] **Step 2: Rewrite `README.md`**

Replace its entire contents:

```md
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
```

- [ ] **Step 3: Update the umbrella `PRD.md`**

In `PRD.md`, change the Phase F0 heading:

```md
### Phase F0 — Foundation
```

to:

```md
### Phase F0 — Foundation (Done)
```

- [ ] **Step 4: Update this phase's own PRD status**

In `docs/plans/prds/phase-f0-foundation.md`, change:

```md
## Status

Draft
```

to:

```md
## Status

Implemented
```

- [ ] **Step 5: Final full verification**

```bash
npm run build && npm run type-check && npm run lint && npm test
```

Expected: all four succeed with zero errors — this is the same gate every task has run, now confirmed once more across the whole tree.

- [ ] **Step 6: Commit**

```bash
git add .env.example README.md PRD.md docs/plans/prds/phase-f0-foundation.md && git commit -m "$(printf 'Document Phase F0 setup and mark it complete\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>')"
```

---

## Self-Review Notes

- **Spec coverage:** every PRD goal maps to a task — TypeScript (Task 2), stubbed router (Task 8), Pinia skeletons (Task 7), Tailwind v4 (Task 5), responsive shell (Task 9), API client (Task 6), Vitest (Task 3), ESLint/Prettier (Task 4), git baseline (Task 1). Acceptance criteria are covered by Task 10's final verification plus each task's own manual/automated checks.
- **Type consistency:** `TrackedCharacter` is defined once (Task 7, `trackedCharacters.store.ts`) and not redefined elsewhere. Router route names used in `AppShell.vue` (Task 9) match exactly what `router/index.ts` (Task 8) defines. `ApiError`'s constructor signature (`status`, `body`) is used consistently across all `tests/ApiClient.test.ts` assertions.
- **No placeholders:** every step ships real, complete code — no `TODO`/`TBD`, no "add appropriate tests" without the test body.
