import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocaleStore } from '../src/stores/locale.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useLocaleStore', () => {
  it('defaults to en_US, matching the API\'s documented default', () => {
    const store = useLocaleStore()
    expect(store.locale).toBe('en_US')
  })
})