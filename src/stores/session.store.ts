import { defineStore } from "pinia"
import { ref } from "vue"

export const useSessionStore = defineStore("session", () => {
  const isAuthenticated = ref(false)
  const needsReauth = ref(false)

  function markAuthenticated() {
    isAuthenticated.value = true
    needsReauth.value = false
  }

  function markLoggedOut() {
    isAuthenticated.value = false
    needsReauth.value = false
  }

  function flagNeedsReauth() {
    needsReauth.value = true
  }

  return {
    isAuthenticated,
    needsReauth,
    markAuthenticated,
    markLoggedOut,
    flagNeedsReauth,
  }
})
