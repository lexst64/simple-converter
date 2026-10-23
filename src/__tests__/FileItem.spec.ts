import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FileItem from '@/components/fileconverter/FileItem.vue'
import { ConverterService } from '@/services/converter.service'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { useToastStore } from '@/stores/useToastStore'
import { makeFile, makeHolder } from './component-helpers'

vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    downloadFile: vi.fn(),
    getSupportedFormats: vi.fn(),
  },
}))

const downloadFile = vi.mocked(ConverterService.downloadFile)

let pinia: Pinia

const mountItem = (file: FileHolder) =>
  mount(FileItem, {
    props: { file, allSupportedFormats: ['mp3', 'mp4'] },
    global: { plugins: [pinia] },
  })

describe('FileItem', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    downloadFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the file name, size and upper-cased extension', () => {
    const wrapper = mountItem(makeHolder({ file: makeFile('clip.mov', 1536) }))
    expect(wrapper.text()).toContain('clip.mov')
    expect(wrapper.text()).toContain('1.50 KB')
    expect(wrapper.text()).toContain('MOV')
  })

  it('shows "no extension" for files without one', () => {
    const wrapper = mountItem(makeHolder({ file: makeFile('README', 10) }))
    expect(wrapper.text()).toContain('no extension')
  })

  describe.each(['pending', 'failed'] as const)('status %s', (status) => {
    it('shows the badge, format selector and remove button but no progress or download', () => {
      const wrapper = mountItem(makeHolder({ status }))
      expect(wrapper.text()).toContain(status)
      expect(wrapper.find('select').exists()).toBe(true)
      expect(wrapper.findAll('button')).toHaveLength(1)
      expect(wrapper.find('[style*="width"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('%')
    })
  })

  it('processing: shows the progress bar and percentage, hides selector and buttons', () => {
    const wrapper = mountItem(makeHolder({ status: 'processing', progress: 42 }))
    expect(wrapper.text()).toContain('processing')
    expect(wrapper.text()).toContain('42%')
    expect(wrapper.find('[style*="width: 42%"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('uploading: shows only the badge', () => {
    const wrapper = mountItem(makeHolder({ status: 'uploading' }))
    expect(wrapper.text()).toContain('uploading')
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('%')
  })

  it('completed: shows the target format and download button, no selector or progress', () => {
    const wrapper = mountItem(
      makeHolder({ status: 'completed', progress: 100, targetFormat: 'mp3', outputFileId: 'o1' }),
    )
    expect(wrapper.text()).toContain('completed')
    expect(wrapper.text()).toContain('MP3')
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('[style*="width"]').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('updates the progress bar when the progress prop changes', async () => {
    const file = makeHolder({ status: 'processing', progress: 10 })
    const wrapper = mountItem(file)
    await wrapper.setProps({ file: { ...file, progress: 75 } })
    expect(wrapper.text()).toContain('75%')
  })

  describe('delayed completed transition', () => {
    it('shows 100% for 600ms before switching to completed', async () => {
      vi.useFakeTimers()
      const file = makeHolder({ status: 'processing', progress: 80, targetFormat: 'mp3' })
      const wrapper = mountItem(file)

      await wrapper.setProps({ file: { ...file, status: 'completed', progress: 90 } })
      expect(wrapper.text()).toContain('100%')
      expect(wrapper.text()).toContain('processing')
      expect(wrapper.find('button').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(599)
      expect(wrapper.text()).toContain('processing')

      await vi.advanceTimersByTimeAsync(1)
      expect(wrapper.text()).toContain('completed')
      expect(wrapper.text()).not.toContain('100%')
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('cancels the pending transition if the status changes away from completed', async () => {
      vi.useFakeTimers()
      const file = makeHolder({ status: 'processing', progress: 80 })
      const wrapper = mountItem(file)

      await wrapper.setProps({ file: { ...file, status: 'completed' } })
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.setProps({ file: { ...file, status: 'failed' } })
      await vi.advanceTimersByTimeAsync(1000)

      expect(wrapper.text()).toContain('failed')
      expect(wrapper.text()).not.toContain('completed')
      expect(wrapper.find('select').exists()).toBe(true)
    })
  })

  describe('checkbox', () => {
    it.each(['uploading', 'processing', 'completed'] as const)('is disabled when %s', (status) => {
      const wrapper = mountItem(makeHolder({ status }))
      expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeDefined()
    })

    it.each(['pending', 'failed'] as const)('is enabled when %s', (status) => {
      const wrapper = mountItem(makeHolder({ status }))
      expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeUndefined()
    })

    it('emits update:selected when toggled', async () => {
      const wrapper = mountItem(makeHolder())
      await wrapper.find('input[type="checkbox"]').setValue(true)
      expect(wrapper.emitted('update:selected')).toEqual([[true]])
    })
  })

  it('emits update:targetFormat when a format is chosen', async () => {
    const wrapper = mountItem(makeHolder())
    await wrapper.find('select').setValue('mp4')
    expect(wrapper.emitted('update:targetFormat')).toEqual([['mp4']])
  })

  it('removes the file from the store when the remove button is clicked', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('a.mp4'), makeFile('b.mp4')])
    const [first, second] = store.files
    const wrapper = mountItem(first!)

    await wrapper.find('button').trigger('click')

    expect(store.files.map((f) => f.id)).toEqual([second!.id])
  })

  describe('download', () => {
    const completed = () =>
      makeHolder({ status: 'completed', progress: 100, targetFormat: 'mp3', outputFileId: 'out-1' })

    it('calls the service and then applies a 2s cooldown', async () => {
      vi.useFakeTimers()
      const wrapper = mountItem(completed())
      const button = wrapper.find('button')

      await button.trigger('click')
      await flushPromises()
      expect(downloadFile).toHaveBeenCalledExactlyOnceWith('out-1')
      expect(button.attributes('disabled')).toBeDefined()

      await button.trigger('click')
      expect(downloadFile).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(1999)
      expect(button.attributes('disabled')).toBeDefined()
      await vi.advanceTimersByTimeAsync(1)
      expect(button.attributes('disabled')).toBeUndefined()

      await button.trigger('click')
      expect(downloadFile).toHaveBeenCalledTimes(2)
    })

    it('shows an error toast and skips the service when there is no outputFileId', async () => {
      const wrapper = mountItem({ ...completed(), outputFileId: undefined })
      await wrapper.find('button').trigger('click')
      await flushPromises()

      expect(downloadFile).not.toHaveBeenCalled()
      expect(useToastStore().toasts).toMatchObject([
        { type: 'error', message: 'No outputFileId.', title: 'File Download Failed' },
      ])
    })

    it('re-enables the button after the cooldown even when the download throws', async () => {
      vi.useFakeTimers()
      downloadFile.mockRejectedValue(new Error('network'))
      const wrapper = mountItem(completed())
      const button = wrapper.find('button')

      await button.trigger('click')
      await flushPromises()
      expect(useToastStore().toasts).toMatchObject([
        { type: 'error', title: 'File Download Failed', message: 'Failed to download "video.mp4".' },
      ])

      await vi.advanceTimersByTimeAsync(2000)

      expect(button.attributes('disabled')).toBeUndefined()
    })
  })
})
