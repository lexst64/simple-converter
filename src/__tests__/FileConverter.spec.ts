import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FileConverter from '@/components/fileconverter/FileConverter.vue'
import { ConverterService } from '@/services/converter.service'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { useFormatStore } from '@/stores/useFormatStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job } from '@/types/api'
import { FakeWebSocket, makeFile } from './component-helpers'

// FileConverter imports API_URL from @/main, which would mount the whole app.
vi.mock('@/main', () => ({ API_URL: 'http://api.test', api: {} }))

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
const seedFiles = (names: string[], overrides: Partial<FileHolder>[] = []) => {
  const store = useFileStore()
  store.addFiles(names.map((n) => makeFile(n, 100)))
  store.files.forEach((f, i) => Object.assign(f, overrides[i] ?? {}))
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

    // Known bug #7 (.claude/ANALYSIS.md): allFilesSelected uses every() over all files,
    // but completed files can never be selected, so the header checkbox stays unchecked
    // even though every selectable file is selected.
    it.fails('header checkbox is checked when all selectable files are selected', async () => {
      seedFiles(['a.mp4', 'b.mp4'], [{}, { status: 'completed' }])
      const wrapper = mountConverter()
      await itemCheckboxes(wrapper)[0]!.setValue(true)
      expect((headerCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true)
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

      await wrapper.find('select').setValue('mp3')

      expect(useFileStore().files.map((f) => f.targetFormat)).toEqual(['mp3', undefined])
      expect(convertButton(wrapper).attributes('disabled')).toBeUndefined()
    })
  })

  describe('convert flow', () => {
    it('uploads, creates a job, follows progress over the socket and reports success', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()

      expect(service.uploadFile).toHaveBeenCalledExactlyOnceWith(store.files[0]!.file)
      expect(service.createConversionJob).toHaveBeenCalledExactlyOnceWith('up-1', 'mp3')
      expect(FakeWebSocket.instances).toHaveLength(1)
      const socket = FakeWebSocket.instances[0]!
      expect(socket.url).toBe('ws://api.test/conversions/job/job-for-up-1/status')
      expect(socket.protocols).toEqual(['Bearer', 'tok'])
      expect(wrapper.text()).toContain('Total: 1')

      socket.send({ status: 'pending', progress: 0 })
      await flushPromises()
      expect(wrapper.text()).toContain('processing')
      expect(wrapper.text()).toContain('0%')

      socket.send({ status: 'processing', progress: 55 })
      await flushPromises()
      expect(wrapper.text()).toContain('55%')

      socket.send({ status: 'completed', progress: 100 })
      await flushPromises()

      expect(socket.close).toHaveBeenCalled()
      expect(service.getJob).toHaveBeenCalledExactlyOnceWith('job-for-up-1')
      expect(store.files[0]).toMatchObject({
        status: 'completed',
        outputFileId: 'out-job-for-up-1',
        uploadFileId: 'up-1',
        selected: false,
      })
      expect(useToastStore().toasts).toMatchObject([
        {
          type: 'success',
          title: 'Conversion Completed',
          message: '"a.mp4" was converted successfully!',
        },
      ])
    })

    it('marks the file failed, reselects it and shows an error toast on a failed message', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      const socket = FakeWebSocket.instances[0]!
      socket.send({ status: 'processing', progress: 30 })
      socket.send({ status: 'failed', progress: 30 })
      await flushPromises()

      expect(socket.close).toHaveBeenCalled()
      expect(service.getJob).not.toHaveBeenCalled()
      expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
      expect(wrapper.text()).toContain('failed')
      expect(wrapper.text()).toContain('Selected: 1')
      expect(useToastStore().toasts).toMatchObject([
        { type: 'error', title: 'Conversion Failed', message: 'Failed to convert "a.mp4".' },
      ])
    })

    it('fails the conversion when the socket errors', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      FakeWebSocket.instances[0]!.fail()
      await flushPromises()

      expect(store.files[0]!.status).toBe('failed')
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
    })

    it('fails the conversion when the completed job has no output file', async () => {
      service.getJob.mockResolvedValue(makeJob({ status: JobStatus.COMPLETED }))
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      FakeWebSocket.instances[0]!.send({ status: 'completed', progress: 100 })
      await flushPromises()

      expect(store.files[0]!.status).toBe('failed')
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
    })

    it('fails the conversion when the upload throws', async () => {
      service.uploadFile.mockRejectedValue(new Error('upload failed'))
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()

      expect(service.createConversionJob).not.toHaveBeenCalled()
      expect(FakeWebSocket.instances).toHaveLength(0)
      expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
    })

    it('skips the upload when the file already has an uploadFileId', async () => {
      seedFiles(
        ['a.mp4'],
        [{ selected: true, targetFormat: 'mp3', status: 'failed', uploadFileId: 'up-existing' }],
      )
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()

      expect(service.uploadFile).not.toHaveBeenCalled()
      expect(service.createConversionJob).toHaveBeenCalledExactlyOnceWith('up-existing', 'mp3')
      expect(FakeWebSocket.instances[0]!.url).toContain('/job-for-up-existing/')
    })

    it('only converts selected files', async () => {
      seedFiles(
        ['a.mp4', 'b.mp4'],
        [{ selected: true, targetFormat: 'mp3' }, { targetFormat: 'mp3' }],
      )
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()

      expect(service.uploadFile).toHaveBeenCalledTimes(1)
      expect(FakeWebSocket.instances).toHaveLength(1)
    })

    describe('batch', () => {
      const startBatch = async () => {
        service.uploadFile.mockImplementation(async (file: File) => `up-${file.name}`)
        seedFiles(
          ['a.mp4', 'b.mp4'],
          [
            { selected: true, targetFormat: 'mp3' },
            { selected: true, targetFormat: 'mp3' },
          ],
        )
        const wrapper = mountConverter()
        await convertButton(wrapper).trigger('click')
        await flushPromises()
        expect(FakeWebSocket.instances).toHaveLength(2)
        return FakeWebSocket.instances as [FakeWebSocket, FakeWebSocket]
      }

      it('shows a single success toast when every file succeeds', async () => {
        const [a, b] = await startBatch()
        a.send({ status: 'completed', progress: 100 })
        b.send({ status: 'completed', progress: 100 })
        await flushPromises()

        expect(useToastStore().toasts).toMatchObject([
          {
            type: 'success',
            title: 'Batch Conversion Completed',
            message: '2 files converted successfully!',
          },
        ])
      })

      it('shows a single error toast when every file fails', async () => {
        const [a, b] = await startBatch()
        a.send({ status: 'failed', progress: 0 })
        b.fail()
        await flushPromises()

        expect(useToastStore().toasts).toMatchObject([
          {
            type: 'error',
            title: 'Batch Conversion Failed',
            message: 'Failed to convert 2 files.',
          },
        ])
      })

      it('shows a warning toast when some files fail', async () => {
        const [a, b] = await startBatch()
        a.send({ status: 'completed', progress: 100 })
        b.send({ status: 'failed', progress: 0 })
        await flushPromises()

        expect(useToastStore().toasts).toMatchObject([
          {
            type: 'warning',
            title: 'Batch Conversion Finished',
            message: '1 files converted, 1 failed.',
          },
        ])
      })

      it('shows no toast until every file has settled', async () => {
        const [a] = await startBatch()
        a.send({ status: 'completed', progress: 100 })
        await flushPromises()
        expect(useToastStore().toasts).toEqual([])
      })
    })

    it('fails the conversion when the socket closes without a final status', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      const socket = FakeWebSocket.instances[0]!
      socket.send({ status: 'processing', progress: 40 })
      socket.serverClose(1006)
      await flushPromises()

      expect(store.files[0]!.status).toBe('failed')
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
    })

    it('fails the conversion when fetching the completed job throws', async () => {
      service.getJob.mockRejectedValue(new Error('network'))
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      FakeWebSocket.instances[0]!.send({ status: 'completed', progress: 100 })
      await flushPromises()

      expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
    })

    it('fails the conversion when a status message is not valid JSON', async () => {
      const store = seedFiles(['a.mp4'], [{ selected: true, targetFormat: 'mp3' }])
      const wrapper = mountConverter()

      await convertButton(wrapper).trigger('click')
      await flushPromises()
      const socket = FakeWebSocket.instances[0]!
      socket.onmessage?.({ data: 'not json' })
      await flushPromises()

      expect(socket.close).toHaveBeenCalled()
      expect(store.files[0]!.status).toBe('failed')
      expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
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

  it('shows the uploader when there are no files', () => {
    const wrapper = mountConverter()
    expect(wrapper.text()).toContain('Select files')
    expect(wrapper.text()).toContain('Total: 0')
  })
})
