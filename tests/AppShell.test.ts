import { flushPromises, mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import AppShell from "../src/layouts/AppShell.vue"
import { useSessionStore } from "../src/stores/session.store"
import { apiClient } from "../lib/api/client"

vi.mock("../lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue(undefined),
  },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(apiClient.post).mockClear()
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

  it("logs out, clears the session, and redirects to login when Logout is clicked", async () => {
    const sessionStore = useSessionStore()
    sessionStore.markAuthenticated()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div>home</div>" } },
        { path: "/login", name: "login", component: { template: "<div>login</div>" } },
      ],
    })
    await router.push("/")
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router],
        stubs: { RouterLink: true, RouterView: true },
        renderStubDefaultSlot: true,
      },
    })

    const logoutButton = wrapper.findAll("button").find((button) => button.text() === "Logout")
    expect(logoutButton).toBeTruthy()

    await logoutButton!.trigger("click")
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout")
    expect(sessionStore.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe("login")
  })
})
