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
