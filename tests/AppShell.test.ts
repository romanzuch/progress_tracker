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
      global: {
        stubs: { RouterLink: true, RouterView: true },
        renderStubDefaultSlot: true,
      },
    })

    expect(wrapper.findAll("nav")).toHaveLength(1)

    await wrapper.find("button").trigger("click")

    expect(wrapper.findAll("nav")).toHaveLength(2)
  })

  it("renders a link for every nav destination when unauthenticated, including Login", () => {
    const wrapper = mount(AppShell, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
        renderStubDefaultSlot: true,
      },
    })

    expect(wrapper.findAll("router-link-stub")).toHaveLength(4)
    expect(wrapper.text()).toContain("Login")
    expect(wrapper.text()).not.toContain("Logout")
  })

  it("swaps Login for a Logout button when authenticated", () => {
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    const wrapper = mount(AppShell, {
      global: {
        stubs: { RouterLink: true, RouterView: true },
        renderStubDefaultSlot: true,
      },
    })

    expect(wrapper.findAll("router-link-stub")).toHaveLength(3)
    expect(wrapper.text()).toContain("Logout")
    expect(wrapper.text()).not.toContain("Login")
  })
})
