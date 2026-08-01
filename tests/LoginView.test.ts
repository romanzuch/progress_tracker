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
