import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '../src/stores/session.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useSessionStore', () => {
  it('defaults to not authenticated', () => {
    const store = useSessionStore()
    expect(store.isAuthenticated).toBe(false)
  })
})