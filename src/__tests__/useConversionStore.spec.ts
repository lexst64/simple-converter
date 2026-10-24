import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ConverterService, type UploadOptions } from '@/services/converter.service'
import { MAX_CONCURRENT_CONVERSIONS, useConversionStore } from '@/stores/useConversionStore'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { useToastStore } from '@/stores/useToastStore'
import { JobStatus, type Job } from '@/types/api'
import { FakeWebSocket, makeFile } from './component-helpers'

// Keep the real axios client (and its interceptors) out of these tests.
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

vi.mock('@/services/converter.service', () => ({
  ConverterService: {
    uploadFile: vi.fn(),
    createConversionJob: vi.fn(),
    getJob: vi.fn(),
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

/** Adds files to the store; `overrides[i]` is merged into the i-th holder. */
const seedFiles = (names: string[], overrides: Partial<Omit<FileHolder, 'id' | 'file'>>[] = []) => {
  const store = useFileStore()
  store.addFiles(names.map((n) => makeFile(n, 100)))
  store.files.forEach((f, i) =>
    store.updateFile(f.id, { selected: true, targetFormat: 'mp3', ...overrides[i] }),
  )
  return store
}

/** Starts converting every file in the store, like FileConverter does for selected files. */
const startConversion = (files: FileHolder[]) => useConversionStore().convert(files)

/** An upload that only settles when told to, and rejects like axios when its signal aborts. */
const controllableUpload = () => {
  const uploads: {
    file: File
    options: UploadOptions
    resolve: (id: string) => void
  }[] = []
  service.uploadFile.mockImplementation(
    (file: File, options: UploadOptions = {}) =>
      new Promise<string>((resolve, reject) => {
        uploads.push({ file, options, resolve })
        options.signal?.addEventListener('abort', () => reject(new Error('canceled')))
      }),
  )
  return uploads
}

describe('useConversionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)

    service.uploadFile.mockResolvedValue('up-1')
    service.createConversionJob.mockImplementation(async (id: string) =>
      makeJob({ _id: `job-for-${id}`, inputFileId: id }),
    )
    service.getJob.mockImplementation(async (jobId: string) =>
      makeJob({ _id: jobId, status: JobStatus.COMPLETED, outputFileId: `out-${jobId}` }),
    )
  })

  it('uploads, creates a job, follows progress over the socket and reports success', async () => {
    const store = seedFiles(['a.mp4'])
    const conversion = useConversionStore()

    const done = startConversion(store.files)
    expect(conversion.isConverting).toBe(true)
    await flushPromises()

    expect(service.uploadFile).toHaveBeenCalledExactlyOnceWith(
      store.files[0]!.file,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onProgress: expect.any(Function),
      }),
    )
    expect(service.createConversionJob).toHaveBeenCalledExactlyOnceWith('up-1', 'mp3')
    expect(FakeWebSocket.instances).toHaveLength(1)
    const socket = FakeWebSocket.instances[0]!
    expect(socket.url).toBe('ws://api.test/conversions/job/job-for-up-1/status')
    expect(socket.protocols).toEqual(['Bearer', 'tok'])
    expect(store.files[0]!.selected).toBe(false)

    socket.send({ status: 'pending', progress: 0 })
    await flushPromises()
    expect(store.files[0]).toMatchObject({ status: 'processing', progress: 0 })

    socket.send({ status: 'processing', progress: 55 })
    await flushPromises()
    expect(store.files[0]).toMatchObject({ status: 'processing', progress: 55 })

    socket.send({ status: 'completed', progress: 100 })
    await done

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
    expect(conversion.isConverting).toBe(false)
  })

  it('marks the file failed, reselects it and shows an error toast on a failed message', async () => {
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()
    const socket = FakeWebSocket.instances[0]!
    socket.send({ status: 'processing', progress: 30 })
    socket.send({ status: 'failed', progress: 30 })
    await flushPromises()

    expect(socket.close).toHaveBeenCalled()
    expect(service.getJob).not.toHaveBeenCalled()
    expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: 'Conversion Failed', message: 'Failed to convert "a.mp4".' },
    ])
  })

  it('fails the conversion when the socket errors', async () => {
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()
    FakeWebSocket.instances[0]!.fail()
    await flushPromises()

    expect(store.files[0]!.status).toBe('failed')
    expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
  })

  it('fails the conversion when the completed job has no output file', async () => {
    service.getJob.mockResolvedValue(makeJob({ status: JobStatus.COMPLETED }))
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()
    FakeWebSocket.instances[0]!.send({ status: 'completed', progress: 100 })
    await flushPromises()

    expect(store.files[0]!.status).toBe('failed')
    expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
  })

  it('fails the conversion when the upload throws', async () => {
    service.uploadFile.mockRejectedValue(new Error('upload failed'))
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()

    expect(service.createConversionJob).not.toHaveBeenCalled()
    expect(FakeWebSocket.instances).toHaveLength(0)
    expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
    expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
  })

  it('skips the upload when the file already has an uploadFileId', async () => {
    const store = seedFiles(['a.mp4'], [{ status: 'failed', uploadFileId: 'up-existing' }])

    startConversion(store.files)
    await flushPromises()

    expect(service.uploadFile).not.toHaveBeenCalled()
    expect(service.createConversionJob).toHaveBeenCalledExactlyOnceWith('up-existing', 'mp3')
    expect(FakeWebSocket.instances[0]!.url).toContain('/job-for-up-existing/')
  })

  it('fails the conversion when the socket closes without a final status', async () => {
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
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
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()
    FakeWebSocket.instances[0]!.send({ status: 'completed', progress: 100 })
    await flushPromises()

    expect(store.files[0]).toMatchObject({ status: 'failed', selected: true })
    expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
  })

  it('fails the conversion when a status message is not valid JSON', async () => {
    const store = seedFiles(['a.mp4'])

    startConversion(store.files)
    await flushPromises()
    const socket = FakeWebSocket.instances[0]!
    socket.onmessage?.({ data: 'not json' })
    await flushPromises()

    expect(socket.close).toHaveBeenCalled()
    expect(store.files[0]!.status).toBe('failed')
    expect(useToastStore().toasts).toMatchObject([{ type: 'error', title: 'Conversion Failed' }])
  })

  it('does not convert files that are already completed', async () => {
    const store = seedFiles(['a.mp4'], [{ status: 'completed', outputFileId: 'out-old' }])

    await startConversion(store.files)

    expect(service.uploadFile).not.toHaveBeenCalled()
    expect(store.files[0]).toMatchObject({ status: 'completed', outputFileId: 'out-old' })
  })

  describe('concurrency', () => {
    it(`processes at most ${MAX_CONCURRENT_CONVERSIONS} files at a time`, async () => {
      const uploads = controllableUpload()
      const names = Array.from({ length: MAX_CONCURRENT_CONVERSIONS + 2 }, (_, i) => `f${i}.mp4`)
      const store = seedFiles(names)

      startConversion(store.files)
      await flushPromises()

      expect(uploads).toHaveLength(MAX_CONCURRENT_CONVERSIONS)
      expect(store.files.map((f) => f.status)).toEqual([
        ...Array(MAX_CONCURRENT_CONVERSIONS).fill('uploading'),
        'queued',
        'queued',
      ])

      // finishing one file lets exactly one queued file start
      uploads[0]!.resolve('up-f0')
      await flushPromises()
      expect(uploads).toHaveLength(MAX_CONCURRENT_CONVERSIONS)
      FakeWebSocket.instances[0]!.send({ status: 'completed', progress: 100 })
      await flushPromises()

      expect(uploads).toHaveLength(MAX_CONCURRENT_CONVERSIONS + 1)
      expect(uploads.at(-1)!.file.name).toBe(`f${MAX_CONCURRENT_CONVERSIONS}.mp4`)
      expect(store.files.at(-1)!.status).toBe('queued')
    })

    it('frees the slot of a failed file for the next queued one', async () => {
      const uploads = controllableUpload()
      const names = Array.from({ length: MAX_CONCURRENT_CONVERSIONS + 1 }, (_, i) => `f${i}.mp4`)
      const store = seedFiles(names)

      startConversion(store.files)
      await flushPromises()
      uploads[0]!.resolve('up-f0')
      await flushPromises()
      FakeWebSocket.instances[0]!.fail()
      await flushPromises()

      expect(store.files[0]!.status).toBe('failed')
      expect(uploads).toHaveLength(MAX_CONCURRENT_CONVERSIONS + 1)
    })

    it('a cancelled queued file never starts and does not take a slot', async () => {
      const uploads = controllableUpload()
      const names = Array.from({ length: MAX_CONCURRENT_CONVERSIONS + 2 }, (_, i) => `f${i}.mp4`)
      const store = seedFiles(names)

      startConversion(store.files)
      await flushPromises()
      const queued = store.files[MAX_CONCURRENT_CONVERSIONS]!
      useConversionStore().cancelFile(queued.id)
      await flushPromises()
      expect(store.files[MAX_CONCURRENT_CONVERSIONS]!.status).toBe('cancelled')

      useConversionStore().cancelFile(store.files[0]!.id)
      await flushPromises()

      expect(uploads).toHaveLength(MAX_CONCURRENT_CONVERSIONS + 1)
      expect(uploads.at(-1)!.file.name).toBe(`f${MAX_CONCURRENT_CONVERSIONS + 1}.mp4`)
    })
  })

  describe('upload progress', () => {
    it('reports upload progress on the file while uploading', async () => {
      const uploads = controllableUpload()
      const store = seedFiles(['a.mp4'])

      startConversion(store.files)
      await flushPromises()
      expect(store.files[0]).toMatchObject({ status: 'uploading', progress: 0 })

      uploads[0]!.options.onProgress!(25)
      expect(store.files[0]).toMatchObject({ status: 'uploading', progress: 25 })
      uploads[0]!.options.onProgress!(80)
      expect(store.files[0]).toMatchObject({ status: 'uploading', progress: 80 })

      uploads[0]!.resolve('up-1')
      await flushPromises()
      expect(store.files[0]).toMatchObject({ status: 'processing', progress: 0 })
    })
  })

  describe('cancellation', () => {
    it('cancels a file during upload: aborts the request and skips the job', async () => {
      const uploads = controllableUpload()
      const store = seedFiles(['a.mp4'])
      const conversion = useConversionStore()

      const done = startConversion(store.files)
      await flushPromises()
      conversion.cancelFile(store.files[0]!.id)
      await done

      expect(uploads[0]!.options.signal!.aborted).toBe(true)
      expect(service.createConversionJob).not.toHaveBeenCalled()
      expect(FakeWebSocket.instances).toHaveLength(0)
      expect(store.files[0]).toMatchObject({ status: 'cancelled', selected: false })
      expect(store.files[0]!.uploadFileId).toBeUndefined()
      expect(useToastStore().toasts).toEqual([])
      expect(conversion.isConverting).toBe(false)
    })

    it('cancels a file during processing: closes the socket and stops tracking it', async () => {
      const store = seedFiles(['a.mp4'])
      const conversion = useConversionStore()

      const done = startConversion(store.files)
      await flushPromises()
      const socket = FakeWebSocket.instances[0]!
      socket.send({ status: 'processing', progress: 40 })
      conversion.cancelFile(store.files[0]!.id)
      await done

      expect(socket.close).toHaveBeenCalled()
      expect(store.files[0]).toMatchObject({ status: 'cancelled', uploadFileId: 'up-1' })

      // later messages from the closed socket are ignored
      socket.send({ status: 'completed', progress: 100 })
      socket.serverClose()
      await flushPromises()
      expect(service.getJob).not.toHaveBeenCalled()
      expect(store.files[0]!.status).toBe('cancelled')
      expect(useToastStore().toasts).toEqual([])
    })

    it('treats a server cancelled message as a cancellation', async () => {
      const store = seedFiles(['a.mp4'])

      const done = startConversion(store.files)
      await flushPromises()
      const socket = FakeWebSocket.instances[0]!
      socket.send({ status: 'cancelled', progress: 10 })
      await done

      expect(socket.close).toHaveBeenCalled()
      expect(service.getJob).not.toHaveBeenCalled()
      expect(store.files[0]).toMatchObject({ status: 'cancelled', selected: false })
      expect(useToastStore().toasts).toEqual([])
    })

    it('re-uses the uploaded file when a cancelled file is converted again', async () => {
      const store = seedFiles(['a.mp4'])
      const conversion = useConversionStore()

      const first = startConversion(store.files)
      await flushPromises()
      conversion.cancelFile(store.files[0]!.id)
      await first

      startConversion(store.files)
      await flushPromises()

      expect(service.uploadFile).toHaveBeenCalledTimes(1)
      expect(service.createConversionJob).toHaveBeenLastCalledWith('up-1', 'mp3')
      expect(FakeWebSocket.instances).toHaveLength(2)
    })

    it('cancelAll cancels every in-flight and queued file', async () => {
      controllableUpload()
      const names = Array.from({ length: MAX_CONCURRENT_CONVERSIONS + 1 }, (_, i) => `f${i}.mp4`)
      const store = seedFiles(names)
      const conversion = useConversionStore()

      const done = startConversion(store.files)
      await flushPromises()
      conversion.cancelAll()
      await done

      expect(store.files.every((f) => f.status === 'cancelled')).toBe(true)
      expect(service.uploadFile).toHaveBeenCalledTimes(MAX_CONCURRENT_CONVERSIONS)
      expect(useToastStore().toasts).toEqual([])
      expect(conversion.isConverting).toBe(false)
    })
  })

  describe('batch', () => {
    const startBatch = async (count = 2) => {
      service.uploadFile.mockImplementation(async (file: File) => `up-${file.name}`)
      const store = seedFiles(['a.mp4', 'b.mp4', 'c.mp4'].slice(0, count))
      const done = startConversion(store.files)
      await flushPromises()
      expect(FakeWebSocket.instances).toHaveLength(count)
      return { done, store, sockets: FakeWebSocket.instances }
    }

    it('shows a single success toast when every file succeeds', async () => {
      const { done, sockets } = await startBatch()
      sockets[0]!.send({ status: 'completed', progress: 100 })
      sockets[1]!.send({ status: 'completed', progress: 100 })
      await done

      expect(useToastStore().toasts).toMatchObject([
        {
          type: 'success',
          title: 'Batch Conversion Completed',
          message: '2 files converted successfully!',
        },
      ])
    })

    it('shows a single error toast when every file fails', async () => {
      const { done, sockets } = await startBatch()
      sockets[0]!.send({ status: 'failed', progress: 0 })
      sockets[1]!.fail()
      await done

      expect(useToastStore().toasts).toMatchObject([
        {
          type: 'error',
          title: 'Batch Conversion Failed',
          message: 'Failed to convert 2 files.',
        },
      ])
    })

    it('shows a warning toast when some files fail', async () => {
      const { done, sockets } = await startBatch()
      sockets[0]!.send({ status: 'completed', progress: 100 })
      sockets[1]!.send({ status: 'failed', progress: 0 })
      await done

      expect(useToastStore().toasts).toMatchObject([
        {
          type: 'warning',
          title: 'Batch Conversion Finished',
          message: '1 files converted, 1 failed.',
        },
      ])
    })

    it('shows no toast until every file has settled', async () => {
      const { sockets } = await startBatch()
      sockets[0]!.send({ status: 'completed', progress: 100 })
      await flushPromises()
      expect(useToastStore().toasts).toEqual([])
    })

    it('does not count cancelled files as failures', async () => {
      const { done, store, sockets } = await startBatch(3)
      sockets[0]!.send({ status: 'completed', progress: 100 })
      useConversionStore().cancelFile(store.files[1]!.id)
      sockets[2]!.send({ status: 'cancelled', progress: 0 })
      await done

      expect(useToastStore().toasts).toMatchObject([
        {
          type: 'success',
          title: 'Batch Conversion Completed',
          message: '1 files converted successfully!',
        },
      ])
    })

    it('counts only real failures when files are also cancelled', async () => {
      const { done, store, sockets } = await startBatch(3)
      sockets[0]!.send({ status: 'completed', progress: 100 })
      sockets[1]!.send({ status: 'failed', progress: 0 })
      useConversionStore().cancelFile(store.files[2]!.id)
      await done

      expect(useToastStore().toasts).toMatchObject([
        { type: 'warning', message: '1 files converted, 1 failed.' },
      ])
    })

    it('shows no toast when every file is cancelled', async () => {
      const { done } = await startBatch()
      useConversionStore().cancelAll()
      await done

      expect(useToastStore().toasts).toEqual([])
    })
  })
})
