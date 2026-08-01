import { describe, expect, it } from 'vitest'
import { router } from '../src/router'

describe("router", () => {
    it("resolves every named route to its expected path", () => {
        expect(router.resolve({ name: "home" }).path).toBe("/")
        expect(router.resolve({ name: "login" }).path).toBe("/login")
        expect(router.resolve({ name: "auth-callback" }).path).toBe("/auth/callback")
        expect(router.resolve({ name: "characters-add" }).path).toBe("/characters/add")
        expect(router.resolve({
            name: "character-detail",
            params: { realmSlug: "dun-morogh", characterName: "sixfootfour" },
        }).path).toBe(("/characters/dun-morogh/sixfootfour"))
        expect(router.resolve({ name: "settings" }).path).toBe("/settings")
    })

    it("falls back to the not-found route for an unexpected path", () => {
        expect(router.resolve("/this/does/not/exist").name).toBe("not-found")
    })
})