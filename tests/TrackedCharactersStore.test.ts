import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTrackedCharactersStore } from '../src/stores/trackedCharacters.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useTrackedCharactersStore', () => {
  it('defaults to an empty character list', () => {
    const store = useTrackedCharactersStore()
    expect(store.characters).toEqual([])
  })
})