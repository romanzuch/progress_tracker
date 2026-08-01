import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import AppShell from "../src/layouts/AppShell.vue"

describe("AppShell", () => {
  it("hides the mobile nav until the toggle is clicked", async () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll("nav")).toHaveLength(1)

    await wrapper.find("button").trigger("click")

    expect(wrapper.findAll("nav")).toHaveLength(2)
  })

  it("renders a link for every nav destination", () => {
    const wrapper = mount(AppShell, {
      global: { stubs: { RouterLink: true, RouterView: true } },
    })

    expect(wrapper.findAll("router-link-stub")).toHaveLength(4)
  })
})