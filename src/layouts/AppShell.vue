<script setup lang="ts">
import { ref } from "vue"

const isMobileNavOpen = ref(false)

const navLinks = [
  { to: { name: "home" }, label: "Dashboard" },
  { to: { name: "characters-add" }, label: "Add character" },
  { to: { name: "settings" }, label: "Settings" },
  { to: { name: "login" }, label: "Login" },
]

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
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
        <nav class="hidden sm:flex sm:gap-4">
          <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
      <nav v-if="isMobileNavOpen" class="mt-2 flex flex-col gap-2 sm:hidden">
        <RouterLink v-for="link in navLinks" :key="link.label" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </nav>
    </header>
    <main class="flex-1 p-4">
      <RouterView />
    </main>
  </div>
</template>