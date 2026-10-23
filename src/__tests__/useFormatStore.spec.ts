import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ConverterService } from '@/services/converter.service'
import { useFormatStore } from '@/stores/useFormatStore'
import { useToastStore } from '@/stores/useToastStore'
import type { SupportedFormats } from '@/types/api'

// Never import the real service: it imports `api` from `@/main`, which mounts the app.
vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    getSupportedFormats: vi.fn(),
  },
}))

const getSupportedFormats = vi.mocked(ConverterService.getSupportedFormats)

const sampleFormats: SupportedFormats = {
  video: ['mp4', 'webm'],
  image: ['png', 'jpg'],
  audio: ['mp3'],
}

describe('useFormatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getSupportedFormats.mockReset()
  })

  it('has empty initial state', () => {
    const store = useFormatStore()
    expect(store.formats).toEqual({ video: [], image: [], audio: [] })
    expect(store.isLoading).toBe(false)
    expect(store.isError).toBe(false)
    expect(store.hasLoadedOnce).toBe(false)
    expect(store.allSupportedFormats).toEqual([])
  })

  describe('fetchFormats', () => {
    it('stores the fetched formats on success', async () => {
      getSupportedFormats.mockResolvedValue(sampleFormats)
      const store = useFormatStore()
      const toast = useToastStore()

      await store.fetchFormats()

      expect(getSupportedFormats).toHaveBeenCalledOnce()
      expect(store.formats).toEqual(sampleFormats)
      expect(store.hasLoadedOnce).toBe(true)
      expect(store.isError).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(toast.toasts).toEqual([])
    })

    it('sets isLoading while the request is in flight', async () => {
      let resolve!: (f: SupportedFormats) => void
      getSupportedFormats.mockReturnValue(new Promise((r) => (resolve = r)))
      const store = useFormatStore()

      const pending = store.fetchFormats()
      expect(store.isLoading).toBe(true)

      resolve(sampleFormats)
      await pending
      expect(store.isLoading).toBe(false)
    })

    it('sets isError and shows an error toast on failure', async () => {
      getSupportedFormats.mockRejectedValue(new Error('network'))
      const store = useFormatStore()
      const toast = useToastStore()

      await store.fetchFormats()

      expect(store.isError).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.hasLoadedOnce).toBe(false)
      expect(store.formats).toEqual({ video: [], image: [], audio: [] })
      expect(toast.toasts).toHaveLength(1)
      expect(toast.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Error',
        message: 'Failed to load supported formats.',
      })
    })

    it('keeps previously loaded formats on failure and resets isError on retry', async () => {
      const store = useFormatStore()
      getSupportedFormats.mockResolvedValueOnce(sampleFormats)
      await store.fetchFormats()

      getSupportedFormats.mockRejectedValueOnce(new Error('network'))
      await store.fetchFormats()
      expect(store.isError).toBe(true)
      expect(store.formats).toEqual(sampleFormats)
      expect(store.hasLoadedOnce).toBe(true)

      getSupportedFormats.mockResolvedValueOnce(sampleFormats)
      await store.fetchFormats()
      expect(store.isError).toBe(false)
    })
  })

  describe('allSupportedFormats', () => {
    it('concatenates audio, video and image formats in that order', () => {
      const store = useFormatStore()
      store.formats = sampleFormats

      expect(store.allSupportedFormats).toEqual(['mp3', 'mp4', 'webm', 'png', 'jpg'])
    })

    it('tolerates missing categories', () => {
      const store = useFormatStore()
      store.formats = { video: ['mp4'] } as unknown as SupportedFormats

      expect(store.allSupportedFormats).toEqual(['mp4'])
    })
  })
})
