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
