import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ConverterService } from '@/services/converter.service'
import {
  HISTORY_PAGE_SIZE,
  MAX_REQUESTS_PER_LOAD,
  useHistoryStore,
  type HistoryItem,
} from '@/stores/useHistoryStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job, type JobsPage, type UserFile } from '@/types/api'

// Never import the real service: it would make real HTTP calls via `api` from `@/api/client`.
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

function page(jobs: Job[], total = jobs.length, offset = 0): JobsPage {
  return { jobs, total, offset, limit: HISTORY_PAGE_SIZE }
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
      getJobs.mockResolvedValue(
        page([
          makeJob({ _id: 'a', outputFileId: 'out-a', completedAt }),
          makeJob({ _id: 'b', status: JobStatus.FAILED, outputFileId: 'out-b' }),
          makeJob({ _id: 'c', status: JobStatus.PROCESSING }),
          makeJob({ _id: 'd', status: JobStatus.PENDING }),
          makeJob({ _id: 'e', status: JobStatus.CANCELLED }),
        ]),
      )
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
      getJobs.mockResolvedValue(page([makeJob({ _id: 'a' })]))
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
      getJobs.mockResolvedValue(
        page([
          makeJob({ _id: 'a', outputFileId: 'out-a' }),
          makeJob({ _id: 'b', outputFileId: 'out-b' }),
        ]),
      )
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
      getJobs.mockResolvedValue(page([]))
      const store = useHistoryStore()

      expect(await store.fetchHistory()).toBe(true)
      expect(await store.fetchHistory()).toBe(false)
    })

    it('returns true when forceSkeleton is set, even after a load', async () => {
      getJobs.mockResolvedValue(page([]))
      const store = useHistoryStore()
      await store.fetchHistory()

      expect(await store.fetchHistory(true)).toBe(true)
    })

    it('sets isFetching while the request is in flight', async () => {
      let resolve!: (jobs: JobsPage) => void
      getJobs.mockReturnValue(new Promise((r) => (resolve = r)))
      const store = useHistoryStore()

      const pending = store.fetchHistory()
      expect(store.isFetching).toBe(true)

      resolve(page([]))
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

  describe('pagination', () => {
    // A fake backend: newest first, honours limit/offset and reports the real total
    function serve(all: Job[]) {
      getJobs.mockImplementation(async ({ limit, offset }) =>
        page(all.slice(offset, offset + limit), all.length, offset),
      )
      deleteJob.mockImplementation(async (id) => {
        all.splice(
          all.findIndex((j) => j._id === id),
          1,
        )
      })
      return all
    }

    const completedJobs = (count: number, prefix = 'j') =>
      Array.from({ length: count }, (_, i) =>
        makeJob({ _id: `${prefix}${i}`, outputFileId: `out-${prefix}${i}` }),
      )

    const failedJobs = (count: number) =>
      Array.from({ length: count }, (_, i) => makeJob({ _id: `f${i}`, status: JobStatus.FAILED }))

    const ids = (store: ReturnType<typeof useHistoryStore>) => store.items.map((i) => i.id)
    const range = (from: number, to: number) =>
      Array.from({ length: to - from }, (_, i) => `j${from + i}`)

    beforeEach(() => {
      getFileDetails.mockImplementation(async (id) => makeUserFile({ id }))
    })

    it('loads only the first page and looks up file details for that page only', async () => {
      serve(completedJobs(45))
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(getJobs).toHaveBeenCalledExactlyOnceWith({ limit: HISTORY_PAGE_SIZE, offset: 0 })
      expect(ids(store)).toEqual(range(0, 20))
      expect(getFileDetails).toHaveBeenCalledTimes(20)
      expect(store.offset).toBe(20)
      expect(store.hasMore).toBe(true)
    })

    it('appends the next pages on loadMore until the total is reached', async () => {
      serve(completedJobs(45))
      const store = useHistoryStore()
      await store.fetchHistory()
      getFileDetails.mockClear()

      await store.loadMore()

      expect(getJobs).toHaveBeenLastCalledWith({ limit: HISTORY_PAGE_SIZE, offset: 20 })
      expect(ids(store)).toEqual(range(0, 40))
      expect(getFileDetails).toHaveBeenCalledTimes(20)
      expect(store.hasMore).toBe(true)

      await store.loadMore()

      expect(ids(store)).toEqual(range(0, 45))
      expect(store.offset).toBe(45)
      expect(store.hasMore).toBe(false)
    })

    it('does not request anything when there are no more pages', async () => {
      serve(completedJobs(20))
      const store = useHistoryStore()
      await store.fetchHistory()
      expect(store.hasMore).toBe(false)

      await store.loadMore()

      expect(getJobs).toHaveBeenCalledTimes(1)
      expect(ids(store)).toEqual(range(0, 20))
    })

    it('treats a full page as having more when the total is missing', async () => {
      const all = completedJobs(25)
      getJobs.mockImplementation(
        async ({ limit, offset }) =>
          ({ jobs: all.slice(offset, offset + limit), limit, offset }) as unknown as JobsPage,
      )
      const store = useHistoryStore()

      await store.fetchHistory()
      expect(store.hasMore).toBe(true)

      await store.loadMore()
      expect(ids(store)).toEqual(range(0, 25))
      expect(store.hasMore).toBe(false)
    })

    it('ignores loadMore while one is already in flight', async () => {
      serve(completedJobs(60))
      const store = useHistoryStore()
      await store.fetchHistory()

      const first = store.loadMore()
      expect(store.isLoadingMore).toBe(true)
      await store.loadMore()
      await first

      expect(getJobs).toHaveBeenCalledTimes(2)
      expect(store.isLoadingMore).toBe(false)
      expect(ids(store)).toEqual(range(0, 40))
    })

    it('dedupes by id when new jobs shift the list between loads', async () => {
      const all = serve(completedJobs(45))
      const store = useHistoryStore()
      await store.fetchHistory()

      all.unshift(...completedJobs(3, 'new'))
      await store.loadMore()

      // j17-j19 come back at offset 20; they are dropped and the page is topped up
      expect(ids(store)).toEqual(range(0, 45))
      expect(getJobs).toHaveBeenCalledTimes(3)
    })

    it('refreshes the first page on fetchHistory without duplicating items', async () => {
      const all = serve(completedJobs(45))
      const store = useHistoryStore()
      await store.fetchHistory()
      await store.loadMore()

      all.unshift(makeJob({ _id: 'fresh', outputFileId: 'out-fresh' }))
      await store.fetchHistory()

      expect(ids(store)).toEqual(['fresh', ...range(0, 19)])
      expect(store.offset).toBe(20)
      expect(store.hasMore).toBe(true)
    })

    it('discards a loadMore result that a refresh overtook', async () => {
      serve(completedJobs(45))
      const store = useHistoryStore()
      await store.fetchHistory()

      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      const real = getJobs.getMockImplementation()!
      getJobs.mockImplementationOnce(async (params) => {
        await gate
        return real(params)
      })

      const more = store.loadMore()
      await store.fetchHistory()
      release()
      await more

      expect(ids(store)).toEqual(range(0, 20))
      expect(store.offset).toBe(20)
      expect(store.isLoadingMore).toBe(false)
    })

    it('keeps fetching raw pages until it has a page of completed jobs', async () => {
      serve([...failedJobs(25), ...completedJobs(30)])
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(getJobs.mock.calls.map(([p]) => p.offset)).toEqual([0, 20, 40])
      expect(ids(store)).toEqual(range(0, 30))
      expect(store.offset).toBe(55)
      expect(store.hasMore).toBe(false)
    })

    it('stops after a bounded number of requests but keeps Load more available', async () => {
      serve([...failedJobs(200), ...completedJobs(5)])
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(getJobs).toHaveBeenCalledTimes(MAX_REQUESTS_PER_LOAD)
      expect(store.items).toEqual([])
      expect(store.offset).toBe(MAX_REQUESTS_PER_LOAD * HISTORY_PAGE_SIZE)
      expect(store.hasMore).toBe(true)
    })

    it('does not skip an item when loading more after a delete', async () => {
      serve(completedJobs(45))
      const store = useHistoryStore()
      await store.fetchHistory()

      await store.deleteItem('j3')
      expect(store.offset).toBe(19)
      await store.loadMore()

      expect(ids(store)).toEqual([...range(0, 3), ...range(4, 40)])
    })

    it('keeps the offset when a delete is rolled back', async () => {
      serve(completedJobs(45))
      deleteJob.mockRejectedValue(new Error('500'))
      const store = useHistoryStore()
      await store.fetchHistory()

      await store.deleteItem('j3')
      expect(store.offset).toBe(20)
      await store.loadMore()

      expect(ids(store)).toEqual(range(0, 40))
    })

    it('keeps existing items and shows a toast when loadMore fails, then retries', async () => {
      serve(completedJobs(45))
      const store = useHistoryStore()
      const toast = useToastStore()
      await store.fetchHistory()
      getJobs.mockRejectedValueOnce(new Error('network'))

      await store.loadMore()

      expect(ids(store)).toEqual(range(0, 20))
      expect(store.offset).toBe(20)
      expect(store.hasMore).toBe(true)
      expect(store.isLoadingMore).toBe(false)
      expect(toast.toasts).toHaveLength(1)
      expect(toast.toasts[0]).toMatchObject({
        type: 'error',
        title: 'Error',
        message: 'Failed to load more conversion history.',
      })

      await store.loadMore()
      expect(ids(store)).toEqual(range(0, 40))
    })
  })
})
