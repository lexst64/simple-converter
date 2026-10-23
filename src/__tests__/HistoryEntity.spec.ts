import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import HistoryEntity from '@/components/history/HistoryEntity.vue'
import { ConverterService } from '@/services/converter.service'
import type { HistoryItem } from '@/stores/useHistoryStore'

vi.mock('@/services/converter.service', () => ({
  ConverterService: { downloadFile: vi.fn() },
}))

const downloadFile = vi.mocked(ConverterService.downloadFile)

const NOW = new Date('2026-10-21T12:00:00Z')

const makeItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
  id: 'job-1',
  fileName: 'song.mp3',
  fileSize: 2048,
  initialFormat: 'wav',
  targetFormat: 'mp3',
  timestamp: NOW.toISOString(),
  outputFileId: 'out-1',
  ...overrides,
})

const secondsAgo = (s: number) => new Date(NOW.getTime() - s * 1000).toISOString()

const downloadButton = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="Download converted file"]')
const deleteButton = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="Delete history item"]')

describe('HistoryEntity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
    downloadFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the name, size and upper-cased formats', () => {
    const wrapper = mount(HistoryEntity, { props: { item: makeItem() } })
    expect(wrapper.text()).toContain('song.mp3')
    expect(wrapper.text()).toContain('2.00 KB')
    expect(wrapper.text()).toContain('WAV')
    expect(wrapper.text()).toContain('MP3')
  })

  it('shows "unknown" when the initial format is empty', () => {
    const wrapper = mount(HistoryEntity, { props: { item: makeItem({ initialFormat: '' }) } })
    expect(wrapper.text()).toContain('unknown')
  })

  it.each([
    [10, 'just now'],
    [5 * 60, '5 min ago'],
    [60 * 60, '1 hour ago'],
    [3 * 3600, '3 hours ago'],
    [24 * 3600, '1 day ago'],
    [2 * 86400, '2 days ago'],
    [30 * 86400, '1 month ago'],
    [90 * 86400, '3 months ago'],
    [365 * 86400, '1 year ago'],
    [800 * 86400, '2 years ago'],
  ])('formats %is ago as "%s"', (seconds, expected) => {
    const wrapper = mount(HistoryEntity, {
      props: { item: makeItem({ timestamp: secondsAgo(seconds) }) },
    })
    expect(wrapper.text()).toContain(`▪ ${expected}`)
  })

  it('shows no relative time when the timestamp is empty', () => {
    const wrapper = mount(HistoryEntity, { props: { item: makeItem({ timestamp: '' }) } })
    expect(wrapper.find('.font-mono p').text()).toBe('2.00 KB ▪')
  })

  it('downloads the output file and applies a 2s cooldown', async () => {
    const wrapper = mount(HistoryEntity, { props: { item: makeItem() } })

    await downloadButton(wrapper).trigger('click')
    await flushPromises()
    expect(downloadFile).toHaveBeenCalledExactlyOnceWith('out-1')
    expect(downloadButton(wrapper).attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(2000)
    expect(downloadButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('emits delete once and disables both buttons', async () => {
    const wrapper = mount(HistoryEntity, { props: { item: makeItem() } })

    await deleteButton(wrapper).trigger('click')
    await deleteButton(wrapper).trigger('click')

    expect(wrapper.emitted('delete')).toEqual([['job-1']])
    expect(deleteButton(wrapper).attributes('disabled')).toBeDefined()
    expect(downloadButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
  })

  // Same pattern as known bug #4 in FileItem (.claude/ANALYSIS.md), but not listed for
  // HistoryEntity: if downloadFile throws, the cooldown is never started and the
  // download button stays disabled for good.
  it.fails(
    're-enables the download button after the cooldown even when download throws',
    async () => {
      downloadFile.mockRejectedValue(new Error('network'))
      const wrapper = mount(HistoryEntity, {
        props: { item: makeItem() },
        global: { config: { errorHandler: () => {} } },
      })

      await downloadButton(wrapper).trigger('click')
      await flushPromises()
      await vi.advanceTimersByTimeAsync(2000)

      expect(downloadButton(wrapper).attributes('disabled')).toBeUndefined()
    },
  )
})
