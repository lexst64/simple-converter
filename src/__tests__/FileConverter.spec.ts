import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import Select from 'primevue/select'
import FileConverter from '@/components/fileconverter/FileConverter.vue'
import { ConverterService } from '@/services/converter.service'
import { useConversionStore } from '@/stores/useConversionStore'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { useFormatStore } from '@/stores/useFormatStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job } from '@/types/api'
import { MAX_FILE_SIZE } from '@/utils'
import { FakeWebSocket, makeFile } from './component-helpers'

// Keep the real axios client (and its interceptors) out of component tests.
vi.mock('@/api/client', () => ({ API_URL: 'http://api.test', api: {} }))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'tok' },
    user: { value: null },
    isAuthenticated: { value: true },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    uploadFile: vi.fn(),
    createConversionJob: vi.fn(),
    getJob: vi.fn(),
    downloadFile: vi.fn(),
    getSupportedFormats: vi.fn(),
  },
}))

const service = vi.mocked(ConverterService)

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  _id: 'job-1',
  userId: 'u1',
  inputFileId: 'up-1',
  inputFormat: 'mp4',
  outputFormat: 'mp3',
  progress: 0,
  status: JobStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

let pinia: Pinia

/** Adds files to the store; `overrides[i]` is merged into the i-th holder. */
const seedFiles = (names: string[], overrides: Partial<Omit<FileHolder, 'id' | 'file'>>[] = []) => {
  const store = useFileStore()
  store.addFiles(names.map((n) => makeFile(n, 100)))
  store.files.forEach((f, i) => store.updateFile(f.id, overrides[i] ?? {}))
  return store
}

const mountConverter = () => mount(FileConverter, { global: { plugins: [pinia] } })

const headerCheckbox = (w: ReturnType<typeof mountConverter>) =>
  w.findAll('input[type="checkbox"]')[0]!
const itemCheckboxes = (w: ReturnType<typeof mountConverter>) =>
  w.findAll('input[type="checkbox"]').slice(1)
const convertButton = (w: ReturnType<typeof mountConverter>) =>
  w.findAll('button').find((b) => b.text() === 'Convert')!

describe('FileConverter', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)

    useFormatStore().formats = { video: ['mp4'], audio: ['mp3'], image: [] }
    service.uploadFile.mockResolvedValue('up-1')
    service.createConversionJob.mockImplementation(async (id: string) =>
      makeJob({ _id: `job-for-${id}`, inputFileId: id }),
    )
    service.getJob.mockImplementation(async (jobId: string) =>
      makeJob({ _id: jobId, status: JobStatus.COMPLETED, outputFileId: `out-${jobId}` }),
    )
  })

  describe('selection', () => {
    it('shows the total when nothing is selected and the selected count otherwise', async () => {
      seedFiles(['a.mp4', 'b.mp4', 'c.mp4'])
      const wrapper = mountConverter()
      expect(wrapper.text()).toContain('Total: 3')

      await itemCheckboxes(wrapper)[1]!.setValue(true)
      expect(wrapper.text()).toContain('Selected: 1')
      expect(wrapper.text()).not.toContain('Total:')
    })

    it('select-all selects and deselects every file', async () => {
      seedFiles(['a.mp4', 'b.mp4', 'c.mp4'])
      const wrapper = mountConverter()

      await headerCheckbox(wrapper).setValue(true)
      expect(wrapper.text()).toContain('Selected: 3')
      expect(itemCheckboxes(wrapper).every((c) => (c.element as HTMLInputElement).checked)).toBe(
        true,
      )
      expect((headerCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true)

      await headerCheckbox(wrapper).setValue(false)
      expect(wrapper.text()).toContain('Total: 3')
      expect(itemCheckboxes(wrapper).some((c) => (c.element as HTMLInputElement).checked)).toBe(
        false,
      )
    })

    it('select-all skips uploading, processing and completed files', async () => {
      seedFiles(
        ['a.mp4', 'b.mp4', 'c.mp4', 'd.mp4', 'e.mp4'],
        [
          {},
          { status: 'failed' },
          { status: 'uploading' },
          { status: 'processing' },
          { status: 'completed' },
        ],
      )
      const wrapper = mountConverter()

      await headerCheckbox(wrapper).setValue(true)

      expect(wrapper.text()).toContain('Selected: 2')
      expect(useFileStore().files.map((f) => f.selected)).toEqual([true, true, false, false, false])
    })

    it('header checkbox reflects that every file is selected', async () => {
      seedFiles(['a.mp4', 'b.mp4'])
      const wrapper = mountConverter()
      const boxes = itemCheckboxes(wrapper)
      await boxes[0]!.setValue(true)
      expect((headerCheckbox(wrapper).element as HTMLInputElement).checked).toBe(false)
      await boxes[1]!.setValue(true)
      expect((headerCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true)
    })

    it('header checkbox is checked when all selectable files are selected', async () => {
      seedFiles(['a.mp4', 'b.mp4'], [{}, { status: 'completed' }])
      const wrapper = mountConverter()
      await itemCheckboxes(wrapper)[0]!.setValue(true)
      expect((headerCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true)
    })

    it('toggling a file replaces its holder in the store instead of mutating it', async () => {
      const store = seedFiles(['a.mp4', 'b.mp4'])
      const [original, other] = store.files
      const wrapper = mountConverter()

      await itemCheckboxes(wrapper)[0]!.setValue(true)

      expect(store.files[0]).not.toBe(original)
      expect(original!.selected).toBe(false)
      expect(store.files.map((f) => f.selected)).toEqual([true, false])
      expect(store.files[1]).toBe(other)
    })
  })

  describe('convert button', () => {
    it('is disabled when no file is selected', () => {
      seedFiles(['a.mp4'], [{ targetFormat: 'mp3' }])
      expect(convertButton(mountConverter()).attributes('disabled')).toBeDefined()
    })

    it('is disabled when a selected file has no target format', () => {
      seedFiles(['a.mp4', 'b.mp4'], [{ selected: true, targetFormat: 'mp3' }, { selected: true }])
      expect(convertButton(mountConverter()).attributes('disabled')).toBeDefined()
    })

    it.each(['uploading', 'processing'] as const)(
      'is disabled when a selected file is %s',
      (status) => {
        seedFiles(
          ['a.mp4', 'b.mp4'],
          [
            { selected: true, targetFormat: 'mp3' },
            { selected: true, targetFormat: 'mp3', status },
          ],
        )
        expect(convertButton(mountConverter()).attributes('disabled')).toBeDefined()
      },
    )

    it('is enabled when every selected file has a target format', () => {
      seedFiles(['a.mp4', 'b.mp4'], [{ selected: true, targetFormat: 'mp3' }, {}])
      expect(convertButton(mountConverter()).attributes('disabled')).toBeUndefined()
    })

    it('the top-level format selector applies its format to selected files only', async () => {
      seedFiles(['a.mp4', 'b.mp4'], [{ selected: true }, {}])
      const wrapper = mountConverter()
      expect(convertButton(wrapper).attributes('disabled')).toBeDefined()

      // the first selector is the top-level one, before the per-file selectors
      await wrapper.findComponent(Select).setValue('mp3')

      expect(useFileStore().files.map((f) => f.targetFormat)).toEqual(['mp3', undefined])
      expect(convertButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it("a per-file format selector sets that file's format through the store", async () => {
      const store = seedFiles(['a.mp4', 'b.mp4'])
      const original = store.files[1]
      const wrapper = mountConverter()

      // index 0 is the top-level selector, then one per file
      await wrapper.findAllComponents(Select)[2]!.setValue('mp3')

      expect(store.files.map((f) => f.targetFormat)).toEqual([undefined, 'mp3'])
      expect(store.files[1]).not.toBe(original)
      expect(original!.targetFormat).toBeUndefined()
    })
  })

  describe('convert flow', () => {
    // the pipeline itself is covered by useConversionStore.spec.ts; these check the UI wiring
    const cancelButton = (w: ReturnType<typeof mountConverter>) =>
      w.findAll('button').find((b) => b.text() === 'Cancel')

    it('converts only the selected files through the conversion store', async () => {
      const store = seedFiles(
        ['a.mp4', 'b.mp4'],
        [{ selected: true, targetFormat: 'mp3' }, { targetFormat: 'mp3' }],
      )
      const convert = vi.spyOn(useConversionStore(), 'convert')
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()

      expect(convert).toHaveBeenCalledExactlyOnceWith([
        expect.objectContaining({ id: store.files[0]!.id }),
      ])
      expect(service.uploadFile).toHaveBeenCalledTimes(1)
      expect(FakeWebSocket.instances).toHaveLength(1)
    })

    it('shows progress, then the completed file, and reports success', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Total: 1')
      const socket = FakeWebSocket.instances[0]!

      socket.send({ status: 'pending', progress: 0 })
      await flushPromises()
      expect(wrapper.text()).toContain('processing')
      expect(wrapper.text()).toContain('0%')

      socket.send({ status: 'processing', progress: 55 })
      await flushPromises()
      expect(wrapper.text()).toContain('55%')

      socket.send({ status: 'completed', progress: 100 })
      await flushPromises()
      expect(store.files[0]).toMatchObject({ status: 'completed', selected: false })
      expect(useToastStore().toasts).toMatchObject([
        { type: 'success', title: 'Conversion Completed' },
      ])
    })

    it('reselects a failed file so it can be retried', async () => {
      seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      FakeWebSocket.instances[0]!.send({ status: 'failed', progress: 30 })
      await flushPromises()

      expect(wrapper.text()).toContain('failed')
      expect(wrapper.text()).toContain('Selected: 1')
      expect(convertButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('shows a Cancel button only while converting and cancels everything with it', async () => {
      seedFiles(
        ['a.mp4', 'b.mp4'],
        [
          { selected: true, targetFormat: 'mp3' },
          { selected: true, targetFormat: 'mp3' },
        ],
      )
      const wrapper = mountConverter()
      expect(cancelButton(wrapper)).toBeUndefined()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      expect(cancelButton(wrapper)).toBeDefined()

      await cancelButton(wrapper)!.trigger('click')
      await flushPromises()

      expect(FakeWebSocket.instances.every((s) => s.close.mock.calls.length > 0)).toBe(true)
      expect(useFileStore().files.map((f) => f.status)).toEqual(['cancelled', 'cancelled'])
      expect(cancelButton(wrapper)).toBeUndefined()
      expect(wrapper.text()).toContain('Total: 2')
      expect(useToastStore().toasts).toEqual([])
    })

    it('makes cancelled files selectable again', async () => {
      seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      expect(itemCheckboxes(wrapper)[0]!.attributes('disabled')).toBeDefined()
      await cancelButton(wrapper)!.trigger('click')
      await flushPromises()

      expect(itemCheckboxes(wrapper)[0]!.attributes('disabled')).toBeUndefined()
      await headerCheckbox(wrapper).setValue(true)
      expect(wrapper.text()).toContain('Selected: 1')
      expect(convertButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('keeps converting after the component unmounts', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      wrapper.unmount()

      const socket = FakeWebSocket.instances[0]!
      expect(socket.close).not.toHaveBeenCalled()
      socket.send({ status: 'completed', progress: 100 })
      await flushPromises()

      expect(store.files[0]).toMatchObject({
        status: 'completed',
        outputFileId: 'out-job-for-up-1',
      })
      expect(useConversionStore().isConverting).toBe(false)
    })
  })

  it('adds files picked through the hidden file input', async () => {
    seedFiles(['a.mp4'])
    const wrapper = mountConverter()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('new.mp4'), makeFile('other.mp4')],
      configurable: true,
    })
    await input.trigger('change')

    expect(wrapper.text()).toContain('Total: 3')
    expect(wrapper.text()).toContain('new.mp4')
  })

  it('skips oversized files picked through the hidden file input and reports them', async () => {
    seedFiles(['a.mp4'])
    const wrapper = mountConverter()
    const input = wrapper.find('input[type="file"]')
    const ok = makeFile('ok.mp4', MAX_FILE_SIZE)
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('huge.mp4', MAX_FILE_SIZE + 1), ok],
      configurable: true,
    })
    await input.trigger('change')

    expect(useFileStore().files.map((f) => f.file)).toEqual([expect.anything(), ok])
    expect(wrapper.text()).toContain('Total: 2')
    expect(wrapper.text()).not.toContain('huge.mp4')
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '1 File(s) Rejected', message: 'huge.mp4' },
    ])
  })

  it('keeps the list unchanged when every picked file is oversized', async () => {
    const store = seedFiles(['a.mp4'])
    const before = [...store.files]
    const wrapper = mountConverter()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('huge.mp4', MAX_FILE_SIZE + 1), makeFile('huger.mp4', MAX_FILE_SIZE * 2)],
      configurable: true,
    })
    await input.trigger('change')

    expect(store.files).toEqual(before)
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '2 File(s) Rejected', message: 'huge.mp4, huger.mp4' },
    ])
  })

  it('shows the uploader when there are no files', () => {
    const wrapper = mountConverter()
    expect(wrapper.text()).toContain('Select files')
    expect(wrapper.text()).toContain('Total: 0')
  })
})
