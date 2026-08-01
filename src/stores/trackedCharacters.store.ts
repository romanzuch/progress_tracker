import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrackedCharacter {
  id: string
  realmSlug: string
  characterName: string
}

// F2/F3 add the real fields (latestSnapshot, etc.) and actions (add/remove,
// fetch). This skeleton only fixes the shape's name and default state.
export const useTrackedCharactersStore = defineStore('trackedCharacters', () => {
  const characters = ref<TrackedCharacter[]>([])

  return { characters }
})