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
