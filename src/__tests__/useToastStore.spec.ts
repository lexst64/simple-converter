import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '@/stores/useToastStore'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addToast adds a toast and returns its id', () => {
    const store = useToastStore()
    const id = store.addToast({ type: 'info', message: 'Hello', title: 'Hi' })

    expect(id).toEqual(expect.any(String))
    expect(store.toasts).toEqual([
      { id, type: 'info', message: 'Hello', title: 'Hi', duration: 4000 },
    ])
  })

  it('uses 6000ms by default for errors and 4000ms for other types', () => {
    const store = useToastStore()
    store.addToast({ type: 'error', message: 'e' })
    store.addToast({ type: 'success', message: 's' })
    store.addToast({ type: 'warning', message: 'w' })
    expect(store.toasts.map((t) => t.duration)).toEqual([6000, 4000, 4000])

    store.clearAll()
    store.addToast({ type: 'info', message: 'i' })
    expect(store.toasts[0]!.duration).toBe(4000)
  })

  it('keeps an explicit duration, including 0', () => {
    const store = useToastStore()
    store.addToast({ type: 'error', message: 'e', duration: 1000 })
    store.addToast({ type: 'info', message: 'i', duration: 0 })

    expect(store.toasts.map((t) => t.duration)).toEqual([1000, 0])
  })

  it('evicts the oldest toast once MAX_TOASTS (3) is reached', () => {
    const store = useToastStore()
    store.info('1')
    store.info('2')
    store.info('3')
    expect(store.toasts).toHaveLength(3)

    store.info('4')
    expect(store.toasts.map((t) => t.message)).toEqual(['2', '3', '4'])

    store.info('5')
    expect(store.toasts.map((t) => t.message)).toEqual(['3', '4', '5'])
  })

  it('generates a unique id per toast', () => {
    const store = useToastStore()
    const a = store.info('a')
    const b = store.info('b')
    expect(a).not.toBe(b)
  })

  it('removeToast removes only the matching toast', () => {
    const store = useToastStore()
    const a = store.info('a')
    store.info('b')

    store.removeToast(a)
    expect(store.toasts.map((t) => t.message)).toEqual(['b'])

    store.removeToast('unknown')
    expect(store.toasts).toHaveLength(1)
  })

  it('clearAll removes every toast', () => {
    const store = useToastStore()
    store.info('a')
    store.error('b')

    store.clearAll()

    expect(store.toasts).toEqual([])
  })

  it.each(['success', 'error', 'info', 'warning'] as const)(
    '%s() adds a toast of that type with message, title and duration',
    (type) => {
      const store = useToastStore()
      const id = store[type]('msg', 'Title', 123)

      expect(store.toasts).toEqual([{ id, type, message: 'msg', title: 'Title', duration: 123 }])
    },
  )

  it('helper methods fall back to the default duration and no title', () => {
    const store = useToastStore()
    store.success('s')
    store.error('e')
    store.info('i')

    expect(store.toasts[0]).toMatchObject({ type: 'success', title: undefined, duration: 4000 })
    expect(store.toasts[1]).toMatchObject({ type: 'error', title: undefined, duration: 6000 })
    expect(store.toasts[2]).toMatchObject({ type: 'info', title: undefined, duration: 4000 })
  })
})
