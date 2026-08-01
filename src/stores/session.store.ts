import { defineStore } from 'pinia'
import { ref } from 'vue'

// F1 fills this in with real login/logout state; today it only exists so
// later phases (and the app shell's nav) have a store to import.
export const useSessionStore = defineStore('session', () => {
  const isAuthenticated = ref(false)

  return { isAuthenticated }
})