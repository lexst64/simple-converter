import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ConverterService } from '@/services/converter.service'
import { useHistoryStore, type HistoryItem } from '@/stores/useHistoryStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job, type UserFile } from '@/types/api'

// Never import the real service: it imports `api` from `@/main`, which mounts the app.
vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    getJobs: vi.fn(),
    getFileDetails: vi.fn(),
    deleteJob: vi.fn(),
  },
}))

const getJobs = vi.mocked(ConverterService.getJobs)
const getFileDetails = vi.mocked(ConverterService.getFileDetails)
const deleteJob = vi.mocked(ConverterService.deleteJob)

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    _id: 'job-1',
    userId: 'user-1',
    inputFileId: 'in-1',
    inputFormat: 'mp4',
    outputFormat: 'mp3',
    progress: 100,
    status: JobStatus.COMPLETED,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeUserFile(overrides: Partial<UserFile> = {}): UserFile {
  return {
    id: 'out-1',
    userId: 'user-1',
    fileName: 'stored-name',
    originalFileName: 'song.mp3',
    type: 'output',
    size: 2048,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeItem(id: string): HistoryItem {
  return {
    id,
    fileName: `${id}.mp3`,
    fileSize: 1,
    initialFormat: 'mp4',
    targetFormat: 'mp3',
    timestamp: '',
    outputFileId: `out-${id}`,
  }
}

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getJobs.mockReset()
    getFileDetails.mockReset()
    deleteJob.mockReset()
  })

  describe('fetchHistory', () => {
    it('keeps only completed jobs and maps their fields', async () => {
      // The backend sends ISO strings over JSON even though the type says Date.
      const completedAt = '2026-02-03T04:05:06.000Z' as unknown as Date
      getJobs.mockResolvedValue([
        makeJob({ _id: 'a', outputFileId: 'out-a', completedAt }),
        makeJob({ _id: 'b', status: JobStatus.FAILED, outputFileId: 'out-b' }),
        makeJob({ _id: 'c', status: JobStatus.PROCESSING }),
        makeJob({ _id: 'd', status: JobStatus.PENDING }),
        makeJob({ _id: 'e', status: JobStatus.CANCELLED }),
      ])
      getFileDetails.mockResolvedValue(makeUserFile({ originalFileName: 'a.mp3', size: 1234 }))
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(getFileDetails).toHaveBeenCalledTimes(1)
      expect(getFileDetails).toHaveBeenCalledWith('out-a')
      expect(store.items).toEqual([
        {
          id: 'a',
          fileName: 'a.mp3',
          fileSize: 1234,
          initialFormat: 'mp4',
          targetFormat: 'mp3',
          timestamp: '2026-02-03T04:05:06.000Z',
          outputFileId: 'out-a',
        },
      ])
      expect(store.hasLoadedOnce).toBe(true)
      expect(store.isFetching).toBe(false)
    })

    it('uses defaults when a job has no output file or completion date', async () => {
      getJobs.mockResolvedValue([makeJob({ _id: 'a' })])
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(getFileDetails).not.toHaveBeenCalled()
      expect(store.items).toEqual([
        {
          id: 'a',
          fileName: '',
          fileSize: 0,
          initialFormat: 'mp4',
          targetFormat: 'mp3',
          timestamp: '',
          outputFileId: '',
        },
      ])
    })

    it('tolerates getFileDetails failures for individual jobs', async () => {
      getJobs.mockResolvedValue([
        makeJob({ _id: 'a', outputFileId: 'out-a' }),
        makeJob({ _id: 'b', outputFileId: 'out-b' }),
      ])
      getFileDetails.mockImplementation(async (id) => {
        if (id === 'out-a') throw new Error('404')
        return makeUserFile({ id, originalFileName: 'b.mp3', size: 99 })
      })
      const store = useHistoryStore()
      const toast = useToastStore()

      await store.fetchHistory()

      expect(store.items).toHaveLength(2)
      expect(store.items[0]).toMatchObject({
        id: 'a',
        fileName: '',
        fileSize: 0,
        outputFileId: 'out-a',
      })
      expect(store.items[1]).toMatchObject({ id: 'b', fileName: 'b.mp3', fileSize: 99 })
      expect(toast.toasts).toEqual([])
    })

    it('returns true (show skeleton) on the first load and false afterwards', async () => {
      getJobs.mockResolvedValue([])
      const store = useHistoryStore()

      expect(await store.fetchHistory()).toBe(true)
      expect(await store.fetchHistory()).toBe(false)
    })

    it('returns true when forceSkeleton is set, even after a load', async () => {
      getJobs.mockResolvedValue([])
      const store = useHistoryStore()
      await store.fetchHistory()

      expect(await store.fetchHistory(true)).toBe(true)
    })

    it('sets isFetching while the request is in flight', async () => {
      let resolve!: (jobs: Job[]) => void
      getJobs.mockReturnValue(new Promise((r) => (resolve = r)))
      const store = useHistoryStore()

      const pending = store.fetchHistory()
      expect(store.isFetching).toBe(true)

      resolve([])
      await pending
      expect(store.isFetching).toBe(false)
    })

    it('shows a toast and keeps existing items when getJobs fails', async () => {
      getJobs.mockRejectedValue(new Error('network'))
      const store = useHistoryStore()
      const toast = useToastStore()
      store.items = [makeItem('x')]

      const showSkeleton = await store.fetchHistory()

      expect(showSkeleton).toBe(true)
      expect(store.items).toEqual([makeItem('x')])
      expect(store.hasLoadedOnce).toBe(false)
      expect(store.isFetching).toBe(false)
      expect(toast.toasts).toHaveLength(1)
      expect(toast.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Error',
        message: 'Failed to load conversion history.',
      })
    })
  })

  describe('deleteItem', () => {
    it('removes the item optimistically before the request resolves', async () => {
      const d = deferred()
      deleteJob.mockReturnValue(d.promise)
      const store = useHistoryStore()
      store.items = [makeItem('a'), makeItem('b'), makeItem('c')]

      const pending = store.deleteItem('b')

      expect(store.items.map((i) => i.id)).toEqual(['a', 'c'])
      expect(deleteJob).toHaveBeenCalledWith('b')

      d.resolve()
      await pending
      expect(store.items.map((i) => i.id)).toEqual(['a', 'c'])
    })

    it('rolls back to the original position and shows a toast when deletion fails', async () => {
      deleteJob.mockRejectedValue(new Error('500'))
      const store = useHistoryStore()
      const toast = useToastStore()
      store.items = [makeItem('a'), makeItem('b'), makeItem('c')]

      await store.deleteItem('b')

      expect(store.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
      expect(toast.toasts).toHaveLength(1)
      expect(toast.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete "b.mp3".',
      })
    })

    it('rolls back to the end when the following item was removed meanwhile', async () => {
      const deleteB = deferred()
      deleteJob.mockImplementation((id) => (id === 'b' ? deleteB.promise : Promise.resolve()))
      const store = useHistoryStore()
      store.items = [makeItem('a'), makeItem('b'), makeItem('c')]

      const pendingB = store.deleteItem('b')
      await store.deleteItem('c')
      deleteB.reject(new Error('500'))
      await pendingB

      expect(store.items.map((i) => i.id)).toEqual(['a', 'b'])
    })

    it('does nothing for an unknown id', async () => {
      const store = useHistoryStore()
      store.items = [makeItem('a')]

      await store.deleteItem('missing')

      expect(deleteJob).not.toHaveBeenCalled()
      expect(store.items.map((i) => i.id)).toEqual(['a'])
    })

    it('rolls back to the correct position when another delete finished first', async () => {
      const deleteB = deferred()
      deleteJob.mockImplementation((id) => (id === 'b' ? deleteB.promise : Promise.resolve()))
      const store = useHistoryStore()
      store.items = [makeItem('a'), makeItem('b'), makeItem('c')]

      const pendingB = store.deleteItem('b') // captured index 1
      await store.deleteItem('a') // succeeds -> ['c']
      deleteB.reject(new Error('500'))
      await pendingB

      expect(store.items.map((i) => i.id)).toEqual(['b', 'c'])
    })
  })
})
