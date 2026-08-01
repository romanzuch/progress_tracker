import { defineStore } from 'pinia'
import { ref } from 'vue'

// Matches the API's documented default of en_US when no locale is sent.
// F5 adds persistence and the settings UI that changes this.
export const useLocaleStore = defineStore('locale', () => {
  const locale = ref('en_US')

  return { locale }
})