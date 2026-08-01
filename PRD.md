# PRD: WoW Character Progress Tracker Frontend

## Status

Draft — reflects scope as of 2026-07-31, revised after reviewing the API project's actual sub-PRDs under `docs/api_plans/prds/`. This document is the umbrella product view for the frontend; individual phases may get their own detailed PRDs as they're built, following the same pattern as the API project.

## Summary

A Vue 3 + Vite single-page frontend that consumes the [WoW Character Progress Tracker API](PRD_API.md). It lets a player log in with Battle.net (session delegated entirely to the API), pick which characters to track — their own or anyone's, since Blizzard's character data is public — and view both a multi-character overview and per-character historical progress graphs. This repository (`wow-tracker`) is the **frontend only** — no data fetching from Blizzard, persistence, or scheduling happens here; all of that is the API's responsibility.

## Problem / Vision

The API project gives a player a durable, queryable record of characters' progress over time. That data is only useful if it's visible and legible. This project is the piece that turns stored snapshots into an actual dashboard: log in, choose what to track, see it at a glance, and see how it's changed over time — without the player ever touching raw API responses.

## Goals

- Let a player log in with Battle.net (via the API's existing OAuth flow) and manage their own session (login/logout, reauth prompts), with zero token handling in frontend code.
- Let a player track characters by realm + character name — their own account's characters (browsed via the live account profile summary) or any other character, since the API's tracked-characters endpoint accepts any realm/name pair with no ownership check.
- Show a multi-character overview at a glance: one card/row per tracked character with its latest snapshot, including a distinct "pending first poll" state.
- Show per-character historical progress as time-series graphs (level, XP, average item level).
- Be usable on mobile and desktop equally (mobile-first responsive design).
- Support user-selectable Battle.net data locale.

## Non-Goals

- Guild-level or roster-wide views — no aggregate/roster UI; tracking arbitrary characters (see Goals) is still one-at-a-time, not a guild import.
- Sharing or public read-only links to a player's dashboard.
- Live/on-demand data refresh in the dashboard — the account overview and character history read persisted snapshots only, at whatever freshness the API's background job cadence provides. The one exception is the "add a character to track" screen (Phase F2), which calls the live account profile summary and, when adding by realm+name directly, may call the live character-detail endpoint to preview it before tracking.
- Region selection — the API's region (`BNET_REGION`) is a single, app-wide deployment config value with no per-request override; this is not a frontend concern. Only Battle.net data locale is user-selectable (see Phase F5).
- Translating the frontend's own UI text — the locale setting controls which Battle.net data locale is requested (e.g. character/item names), not the UI's display language.
- Server-computed aggregates (total achievement points across characters, highest item level, etc.) — the API deliberately doesn't compute these; if wanted, it's client-side math over the overview response, not a v1 requirement.
- Gold tracking — Battle.net exposes no character gold through any API; permanently unavailable, not just deferred.
- Completed-quest counts — not currently returned by any API endpoint the frontend can call; excluded from v1 graphs.
- Any backend/API work — this project only consumes the existing API's endpoints.

## Architecture / Tech Stack

- **Framework:** Vue 3 + Vite (existing scaffold), Vue Router for navigation between views.
- **State management:** Pinia — stores for session/auth, tracked characters, and locale setting.
- **Styling:** Tailwind CSS — utility-first, fits the mobile-first responsive requirement without pulling in a heavy component library.
- **Charts:** Chart.js via `vue-chartjs` for the time-series history graphs — lightweight, well-documented, sufficient for line/area charts.
- **Animation:** anime.js for micro-interactions (e.g. chart reveal, list transitions) and Motion's Vue bindings (`motion-v`) for page/component enter-exit transitions. Scoped to visual polish, not core functionality.
- **Auth/session:** No token handling in frontend code. The API issues a stateless JWT as an httpOnly session cookie after the Battle.net OAuth flow completes (confirmed in `battlenet-oauth-integration.md`) — there is no server-side session store; all API calls go out with `credentials: 'include'`.
  - **Required API-side change this frontend depends on:** the API's cookie is currently `sameSite=lax`, documented in its own PRD as assuming a same-site frontend ("revisit if cross-origin"). Since this frontend and the API are on separate domains (confirmed), the cookie must become `SameSite=None; Secure`, and the API must add an explicit CORS allow-list for the frontend's origin with credentials enabled. This is a blocking prerequisite for Phase F1, not yet implemented on the API side.
  - **Required API-side decision:** the OAuth callback's post-login redirect target is an open question in the API's own PRD ("is there a frontend URL to redirect to yet, or should the callback just return JSON?"). This frontend needs the API to redirect the browser to a concrete frontend URL (e.g. `${FRONTEND_BASE_URL}/auth/callback`) after `GET /api/auth/battlenet/callback` succeeds, rather than returning JSON.
- **Data fetching:** Plain `fetch` wrapped in a small API client module (base URL + credentials + error normalization). No dedicated data-fetching/caching library — the app's current data needs (a handful of endpoints, no pagination or complex caching) don't justify one yet.

## Roadmap

Each phase maps to one core view/capability, consuming a corresponding phase of the API.

### Phase F0 — Foundation

Vue Router setup, Pinia stores skeleton, Tailwind config, responsive app shell/layout, API client module.

### Phase F1 — Auth & session

- Login page/button that navigates the browser to `GET /api/auth/battlenet` (full redirect, not an XHR — this is a Battle.net consent-screen flow).
- After Battle.net redirects back through the API's callback, the API redirects to a frontend route (see Architecture note above); that route just lands the user in the app — the session cookie is already set by then.
- Logout calls `POST /api/auth/logout`.
- **No dedicated session-check endpoint exists, and this PRD doesn't request one.** General "am I logged in" state is inferred app-wide from any API call's response: a plain `401` (no session cookie / invalid session) means not authenticated — a global API-client interceptor redirects to the login page on this. This works because every endpoint the frontend calls is behind the API's `requireAuth` middleware.
- **`needs_reauth` is surfaced opportunistically, not proactively.** It's only detectable via a live Battle.net-backed call (`GET /api/profile/wow` and the character-detail/achievements/equipment endpoints), which per this PRD's scope only happens on Phase F2's "add a character to track" screen. If that screen's call comes back `401` with `{ error: "needs_reauth" }`, show a global banner prompting re-login (navigate to `GET /api/auth/battlenet` again), while leaving the rest of the app (which reads persisted snapshots only) usable. **Accepted limitation:** a user who never visits Phase F2 won't see this banner even if their Battle.net access has gone stale (Battle.net access tokens last ~24h with no refresh token, per the API's OAuth PRD) — this is a deliberate simplicity trade-off, not an oversight.

### Phase F2 — Character tracking management

Two ways to add a tracked character, since the API's `POST /api/profile/wow/tracked-characters` accepts any `{ realmSlug, characterName }` pair with no ownership check (Blizzard's character endpoints are public, armory-style data):

- **Browse own account:** calls the live `GET /api/profile/wow` (WoW Account Profile Summary) to list the logged-in user's own characters, letting the user pick one to track.
- **Add by realm + name:** a direct-entry form (realm + character name) for tracking any character, including friends'/guildmates' — not restricted to the logged-in user's own account.

Both paths call `POST /api/profile/wow/tracked-characters`; the call is idempotent (re-adding an already-tracked character returns the existing row, not an error). List via `GET /api/profile/wow/tracked-characters`; remove via `DELETE /api/profile/wow/tracked-characters/:id`. Empty state (no tracked characters yet) points here.

### Phase F3 — Account overview

Dashboard reading `GET /api/profile/wow/characters`: one card/row per tracked character (`id`, `realmSlug`, `characterName`, `latestSnapshot`). `latestSnapshot` may be `null` for a character tracked but not yet polled by the API's background job — render this as an explicit "pending first poll" state, not as an error or as absence. Links into per-character detail (Phase F4).

### Phase F4 — Character detail & history graphs

Per-character page, routed by realm slug + character name (the API's natural key — no numeric character id exists). Reads:

- `GET /api/profile/wow/character/:realmSlug/:characterName/history/latest` — current stats.
- `GET /api/profile/wow/character/:realmSlug/:characterName/history?from&to&limit` — time-series data for the graphs (`limit` defaults to 100, max 1000, on the API side; ascending chronological order already provided).

Graphs cover core progression: `level`, `experience`, and `averageItemLevel` over time — the three fields both confirmed available on every snapshot and matching this PRD's earlier "core progression only" scope decision. (`achievementPoints`, `achievementsCompleted`, and `equippedItemLevel` are also returned by the API but out of v1 graph scope; gold and quest-completion data are unavailable entirely — see Non-Goals.)

### Phase F5 — Locale settings

A settings screen where the user picks Battle.net data locale only (region is fixed per API deployment, not user-selectable — see Non-Goals), persisted and passed as `?locale=` on the relevant API calls (character listing, snapshot queries). The API validates against its own supported-locale enum server-side and defaults to `en_US` if omitted or invalid.

## Confirmed API Contracts

Recorded here because they were discovered by reading the API's actual sub-PRDs, not assumed — kept close to the roadmap above so a future implementer doesn't have to re-derive them:

- Auth: `GET /api/auth/battlenet` (redirect to Battle.net), `GET /api/auth/battlenet/callback` (Battle.net → API), `POST /api/auth/logout`.
- Live (per-user token, public armory-style data, no persistence): `GET /api/profile/wow`, `GET /api/profile/wow/character/:realmSlug/:characterName`, `.../achievements`, `.../equipment` — all support `?locale=`, all can return `401 { error: "needs_reauth" }`.
- Tracked characters (persisted, ownership-scoped to the caller): `GET|POST|DELETE /api/profile/wow/tracked-characters[/:id]`.
- Snapshot history (persisted, ownership-scoped, typed metrics only — raw Battle.net payloads are never returned over HTTP): `GET /api/profile/wow/character/:realmSlug/:characterName/history`, `.../history/latest`.
- Account overview (persisted, ownership-scoped): `GET /api/profile/wow/characters`.
- Snapshot summary fields: `capturedAt`, `payloadHash`, `level`, `experience`, `achievementPoints`, `achievementsCompleted`, `averageItemLevel`, `equippedItemLevel`, `lastLoginAt`.
- Realm slugs and character names are normalized lowercase by the API; the frontend doesn't need to lowercase before sending, but should expect lowercase back.

## Open Questions

- **Public/third-party API auth scheme.** Still open on the API's own PRDs — the API currently reuses the same session-cookie auth for all consumers, which is sufficient for this first-party frontend but may change later.
- **Raw payload retention (90-day default pruning).** Doesn't affect this frontend today, since history/latest endpoints never expose raw JSONB payloads — only typed metrics, which are retained forever. Worth re-checking if a future phase ever wants data the API only stores in raw payloads (e.g. per-slot equipment detail).
- **Whether `needs_reauth`'s opportunistic-only surfacing (Phase F1) turns out to be too easy to miss in practice.** Flagged as an accepted limitation for v1; revisit if it causes confusion (the fix would be requesting a dedicated session-check endpoint from the API).
