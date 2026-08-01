<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { apiClient } from "../../lib/api/client"
import { useSessionStore } from "../stores/session.store"
import NeedsReauthBanner from "../components/NeedsReauthBanner.vue"

const isMobileNavOpen = ref(false)
const sessionStore = useSessionStore()
const router = useRouter()

const navLinks = computed(() => [
  { to: { name: "home" }, label: "Dashboard" },
  { to: { name: "characters-add" }, label: "Add character" },
  { to: { name: "settings" }, label: "Settings" },
])

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

async function logout() {
  await apiClient.post("/api/auth/logout")
  sessionStore.markLoggedOut()
  router.push({ name: "login" })
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NeedsReauthBanner />
    <header class="border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <span class="font-semibold">WoW Tracker</span>
        <button
          type="button"
          class="sm:hidden"
          aria-label="Toggle navigation"
          @click="toggleMobileNav"
        >
          &#9776;
        </button>
        <nav class="hidden sm:flex sm:gap-4 sm:items-center">
          <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
            {{ link.label }}
          </RouterLink>
          <RouterLink v-if="!sessionStore.isAuthenticated" :to="{ name: 'login' }">
            Login
          </RouterLink>
          <button v-else type="button" @click="logout">Logout</button>
        </nav>
      </div>
      <nav v-if="isMobileNavOpen" class="mt-2 flex flex-col gap-2 sm:hidden">
        <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
          {{ link.label }}
        </RouterLink>
        <RouterLink v-if="!sessionStore.isAuthenticated" :to="{ name: 'login' }">
          Login
        </RouterLink>
        <button v-else type="button" @click="logout">Logout</button>
      </nav>
    </header>
    <main class="flex-1 p-4">
      <RouterView />
    </main>
  </div>
</template>
