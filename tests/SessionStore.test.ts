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
