import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import TheHistory from '@/components/history/TheHistory.vue'
import { ConverterService } from '@/services/converter.service'
import { HISTORY_PAGE_SIZE, useHistoryStore, type HistoryItem } from '@/stores/useHistoryStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job, type JobsPage, type UserFile } from '@/types/api'

vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    getJobs: vi.fn(),
    getFileDetails: vi.fn(),
    deleteJob: vi.fn(),
    downloadFile: vi.fn(),
  },
}))

const service = vi.mocked(ConverterService)

// Wednesday 21 Oct 2026, 12:00 local time. The week starts on Monday 19 Oct.
const NOW = new Date(2026, 9, 21, 12, 0)
const at = (month: number, day: number, hour = 9) => new Date(2026, month, day, hour)

const makeJob = (id: string, completedAt: Date, status = JobStatus.COMPLETED): Job => ({
  _id: id,
  userId: 'u1',
  inputFileId: `in-${id}`,
  inputFormat: 'mp4',
  outputFormat: 'mp3',
  progress: 100,
  status,
  createdAt: completedAt,
  updatedAt: completedAt,
  completedAt,
  outputFileId: `out-${id}`,
})

const jobs: Job[] = [
  makeJob('older', at(8, 15)), // 15 Sep: earlier
  makeJob('today', at(9, 21, 8)),
  makeJob('month', at(9, 5)), // 5 Oct: this month
  makeJob('yesterday', at(9, 20)),
  makeJob('week', at(9, 19)), // Monday: this week
  makeJob('today2', at(9, 21, 11)),
  makeJob('running', at(9, 21), JobStatus.PROCESSING),
]

const page = (list: Job[], total = list.length, offset = 0): JobsPage => ({
  jobs: list,
  total,
  offset,
  limit: HISTORY_PAGE_SIZE,
})

// 25 jobs: a full first page from today, then 5 from September
const manyJobs = Array.from({ length: 25 }, (_, i) =>
  i < HISTORY_PAGE_SIZE ? makeJob(`t${i}`, at(9, 21, 8)) : makeJob(`e${i}`, at(8, 1)),
)

const serveMany = () =>
  service.getJobs.mockImplementation(async ({ limit, offset }) =>
    page(manyJobs.slice(offset, offset + limit), manyJobs.length, offset),
  )

let pinia: Pinia

const mountHistory = () => mount(TheHistory, { global: { plugins: [pinia] } })

const panels = (w: ReturnType<typeof mountHistory>) =>
  w.findAll('[data-pc-name="accordionpanel"]')

const sections = (w: ReturnType<typeof mountHistory>) =>
  panels(w).map((s) => {
    const header = s.find('button[aria-expanded]')
    return {
      title: header.find('span').text(),
      count: header.find('[data-pc-name="badge"]').text(),
      open: header.attributes('aria-expanded') === 'true',
      visible: (s.find('[role="region"]').element as HTMLElement).style.display !== 'none',
      files: s.findAll('.font-medium.truncate').map((p) => p.text()),
    }
  })

describe('TheHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    service.getJobs.mockResolvedValue(page(jobs))
    service.getFileDetails.mockImplementation(
      async (id: string) => ({ originalFileName: `${id.slice(4)}.mp3`, size: 1024 }) as UserFile,
    )
    service.deleteJob.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the skeleton while the first fetch is in flight', async () => {
    let resolve!: (j: JobsPage) => void
    service.getJobs.mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = mountHistory()

    expect(wrapper.find('[aria-label="Loading history items"]').exists()).toBe(true)

    resolve(page([]))
    await flushPromises()
    expect(wrapper.find('[aria-label="Loading history items"]').exists()).toBe(false)
  })

  it('shows the empty state when there is no history', async () => {
    service.getJobs.mockResolvedValue(page([]))
    const wrapper = mountHistory()
    await flushPromises()
    expect(wrapper.text()).toContain('No previous convertions found')
  })

  it('shows the empty state (not the skeleton forever) when the fetch fails', async () => {
    service.getJobs.mockRejectedValue(new Error('500'))
    const wrapper = mountHistory()
    await flushPromises()
    expect(wrapper.find('[aria-label="Loading history items"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('No previous convertions found')
  })

  it('skips the skeleton and shows cached items while refetching', async () => {
    const store = useHistoryStore()
    store.hasLoadedOnce = true
    store.items = [
      {
        id: 'cached',
        fileName: 'cached.mp3',
        fileSize: 10,
        initialFormat: 'wav',
        targetFormat: 'mp3',
        timestamp: at(9, 21).toISOString(),
        outputFileId: 'o',
      } satisfies HistoryItem,
    ]
    service.getJobs.mockReturnValue(new Promise(() => {}))

    const wrapper = mountHistory()

    expect(wrapper.find('[aria-label="Loading history items"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('cached.mp3')
  })

  it('groups completed jobs into today/yesterday/this week/this month/earlier', async () => {
    const wrapper = mountHistory()
    await flushPromises()

    expect(sections(wrapper)).toEqual([
      { title: 'today', count: '2', open: true, visible: true, files: ['today.mp3', 'today2.mp3'] },
      { title: 'yesterday', count: '1', open: false, visible: false, files: ['yesterday.mp3'] },
      { title: 'this week', count: '1', open: false, visible: false, files: ['week.mp3'] },
      { title: 'this month', count: '1', open: false, visible: false, files: ['month.mp3'] },
      { title: 'earlier', count: '1', open: false, visible: false, files: ['older.mp3'] },
    ])
    expect(wrapper.text()).not.toContain('running.mp3')
  })

  it('omits empty categories and opens the first non-empty one', async () => {
    service.getJobs.mockResolvedValue(
      page([makeJob('week', at(9, 19)), makeJob('older', at(8, 1))]),
    )
    const wrapper = mountHistory()
    await flushPromises()

    expect(sections(wrapper).map(({ title, open }) => ({ title, open }))).toEqual([
      { title: 'this week', open: true },
      { title: 'earlier', open: false },
    ])
  })

  it('opens a category (and closes the others) when its header is clicked', async () => {
    const wrapper = mountHistory()
    await flushPromises()

    await panels(wrapper)[3]!.find('button[aria-expanded]').trigger('click')

    expect(sections(wrapper).map((s) => s.open)).toEqual([false, false, false, true, false])
    expect(sections(wrapper).map((s) => s.visible)).toEqual([false, false, false, true, false])
  })

  it('collapses the open category when its header is clicked again', async () => {
    const wrapper = mountHistory()
    await flushPromises()

    await panels(wrapper)[0]!.find('button[aria-expanded]').trigger('click')

    expect(sections(wrapper).map((s) => s.open)).toEqual([false, false, false, false, false])
  })

  it('deletes an item through the store when its delete button is clicked', async () => {
    const wrapper = mountHistory()
    await flushPromises()

    await wrapper.find('button[aria-label="Delete history item"]').trigger('click')
    await flushPromises()

    expect(service.deleteJob).toHaveBeenCalledExactlyOnceWith('today')
    expect(sections(wrapper)[0]).toMatchObject({ count: '1', files: ['today2.mp3'] })
  })

  describe('load more', () => {
    const loadMoreButton = (w: ReturnType<typeof mountHistory>) =>
      w.findAll('button').find((b) => b.text() === 'Load more')

    it('hides the Load more button when the backend has no more jobs', async () => {
      const wrapper = mountHistory()
      await flushPromises()

      expect(sections(wrapper)).toHaveLength(5)
      expect(loadMoreButton(wrapper)).toBeUndefined()
    })

    it('loads the first page only and appends the next one on Load more', async () => {
      serveMany()
      const wrapper = mountHistory()
      await flushPromises()

      expect(service.getJobs).toHaveBeenCalledExactlyOnceWith({
        limit: HISTORY_PAGE_SIZE,
        offset: 0,
      })
      expect(sections(wrapper).map(({ title, count }) => ({ title, count }))).toEqual([
        { title: 'today', count: '20' },
      ])

      await loadMoreButton(wrapper)!.trigger('click')
      await flushPromises()

      expect(service.getJobs).toHaveBeenLastCalledWith({ limit: HISTORY_PAGE_SIZE, offset: 20 })
      expect(sections(wrapper).map(({ title, count }) => ({ title, count }))).toEqual([
        { title: 'today', count: '20' },
        { title: 'earlier', count: '5' },
      ])
      expect(loadMoreButton(wrapper)).toBeUndefined()
    })

    it('keeps the loaded items and shows a toast when Load more fails', async () => {
      serveMany()
      const wrapper = mountHistory()
      await flushPromises()
      service.getJobs.mockRejectedValueOnce(new Error('500'))

      await loadMoreButton(wrapper)!.trigger('click')
      await flushPromises()

      expect(sections(wrapper).map(({ title, count }) => ({ title, count }))).toEqual([
        { title: 'today', count: '20' },
      ])
      expect(loadMoreButton(wrapper)).toBeDefined()
      expect(useToastStore().toasts).toEqual([
        expect.objectContaining({
          type: 'error',
          message: 'Failed to load more conversion history.',
        }),
      ])
    })

    it('offers Load more instead of the empty state while older pages may hold completed jobs', async () => {
      service.getJobs.mockImplementation(async ({ offset }) =>
        page([makeJob(`r${offset}`, at(9, 21), JobStatus.FAILED)], 1000, offset),
      )
      const wrapper = mountHistory()
      await flushPromises()

      expect(wrapper.text()).not.toContain('No previous convertions found')
      expect(loadMoreButton(wrapper)).toBeDefined()
    })
  })
})
