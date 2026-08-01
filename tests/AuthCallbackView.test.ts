import { flushPromises, mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import AuthCallbackView from "../src/views/AuthCallbackView.vue"
import { useSessionStore } from "../src/stores/session.store"

describe("AuthCallbackView", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("marks the session authenticated and redirects to home on mount", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/auth/callback", name: "auth-callback", component: AuthCallbackView },
        { path: "/", name: "home", component: { template: "<div>home</div>" } },
      ],
    })
    await router.push("/auth/callback")
    await router.isReady()

    const sessionStore = useSessionStore()
    mount(AuthCallbackView, { global: { plugins: [router] } })
    await flushPromises()

    expect(sessionStore.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.name).toBe("home")
  })
})
