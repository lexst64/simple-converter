import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { API_URL } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { ConverterService } from '@/services/converter.service'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { useToastStore } from '@/stores/useToastStore'
import type { JobStatus } from '@/types/api'

/** How many files are uploaded/converted at the same time; the rest wait as `queued`. */
export const MAX_CONCURRENT_CONVERSIONS = 3

type Outcome = 'succeeded' | 'failed' | 'cancelled' | 'skipped'

class CancelledError extends Error {
  constructor() {
    super('Conversion cancelled')
  }
}

// Lives in a store rather than a component so conversions keep running (and their state stays
// visible) when the user navigates away from the converter and back.
export const useConversionStore = defineStore('conversionStore', () => {
  const fileStore = useFileStore()
  const toastStore = useToastStore()

  const controllers = new Map<string, AbortController>()
  const activeCount = ref(0)
  const isConverting = computed(() => activeCount.value > 0)

  let runningCount = 0
  const waiting: (() => void)[] = []

  const acquireSlot = (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new CancelledError())
      if (runningCount < MAX_CONCURRENT_CONVERSIONS) {
        runningCount++
        return resolve()
      }
      const onAbort = () => {
        waiting.splice(waiting.indexOf(start), 1)
        reject(new CancelledError())
      }
      const start = () => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }
      waiting.push(start)
      signal.addEventListener('abort', onAbort, { once: true })
    })

  // hands the slot straight to the next queued file, if any
  const releaseSlot = () => {
    const next = waiting.shift()
    if (next) next()
    else runningCount--
  }

  const throwIfAborted = (signal: AbortSignal) => {
    if (signal.aborted) throw new CancelledError()
  }

  const followJobStatus = (holder: FileHolder, jobId: string, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const wsUrl = `${API_URL}/conversions/job/${jobId}/status`.replace(/^http/, 'ws')
      const socket = new WebSocket(wsUrl, ['Bearer', useAuth().token.value || ''])
      // guards against settling more than once and against reacting to our own close()
      let settled = false
      let finished = false

      const settle = (err?: Error) => {
        if (settled) return
        settled = true
        signal.removeEventListener('abort', onAbort)
        if (err) reject(err)
        else resolve()
      }

      const onAbort = () => {
        if (finished) return
        finished = true
        socket.close()
        settle(new CancelledError())
      }
      signal.addEventListener('abort', onAbort, { once: true })

      // messages can still arrive after close(), e.g. once the file was cancelled
      socket.onmessage = (event) => {
        if (finished) return
        let statusData: { status: JobStatus; progress: number }
        try {
          statusData = JSON.parse(event.data)
        } catch {
          finished = true
          socket.close()
          settle(new Error('Invalid status message'))
          return
        }

        fileStore.updateFile(holder.id, {
          status: statusData.status === 'pending' ? 'processing' : statusData.status,
          progress: statusData.progress,
        })

        if (statusData.status === 'completed') {
          finished = true
          socket.close()
          fileStore.updateFile(holder.id, { selected: false })
          ConverterService.getJob(jobId)
            .then((job) => {
              if (job.outputFileId) {
                fileStore.updateFile(holder.id, { outputFileId: job.outputFileId })
                settle()
              } else {
                settle(new Error('Conversion failed'))
              }
            })
            .catch(() => settle(new Error('Failed to fetch conversion job')))
        } else if (statusData.status === 'failed') {
          finished = true
          socket.close()
          settle(new Error('Conversion failed'))
        } else if (statusData.status === 'cancelled') {
          finished = true
          socket.close()
          settle(new CancelledError())
        }
      }

      socket.onerror = () => {
        if (finished) return
        fileStore.updateFile(holder.id, { status: 'failed' })
        socket.close()
        settle(new Error('WebSocket connection failed'))
      }

      socket.onclose = () => {
        if (!finished) settle(new Error('WebSocket closed unexpectedly'))
      }
    })

  const convertFile = async (holder: FileHolder, signal: AbortSignal) => {
    await acquireSlot(signal)
    try {
      throwIfAborted(signal)
      let uploadFileId: string
      // if a previous conversion failed or was cancelled, skip uploading the same file again
      if (!holder.uploadFileId) {
        fileStore.updateFile(holder.id, { status: 'uploading', progress: 0 })
        uploadFileId = await ConverterService.uploadFile(holder.file, {
          signal,
          onProgress: (progress) => fileStore.updateFile(holder.id, { progress }),
        })
        fileStore.updateFile(holder.id, { uploadFileId })
      } else {
        uploadFileId = holder.uploadFileId
      }
      throwIfAborted(signal)

      const jobId = (await ConverterService.createConversionJob(uploadFileId, holder.targetFormat!))
        ._id
      throwIfAborted(signal)
      fileStore.updateFile(holder.id, { status: 'processing', progress: 0 })

      await followJobStatus(holder, jobId, signal)
    } finally {
      releaseSlot()
    }
  }

  const runFile = async (holder: FileHolder, isBatch: boolean): Promise<Outcome> => {
    if (holder.status === 'completed') return 'skipped'

    const controller = new AbortController()
    controllers.set(holder.id, controller)
    activeCount.value++
    fileStore.updateFile(holder.id, { selected: false, status: 'queued', progress: 0 })

    try {
      await convertFile(holder, controller.signal)
      if (!isBatch) {
        toastStore.success(
          `"${holder.file.name}" was converted successfully!`,
          'Conversion Completed',
        )
      }
      return 'succeeded'
    } catch (err) {
      if (err instanceof CancelledError || controller.signal.aborted) {
        fileStore.updateFile(holder.id, { status: 'cancelled', progress: 0 })
        return 'cancelled'
      }
      fileStore.updateFile(holder.id, { selected: true, status: 'failed' })
      if (!isBatch) {
        toastStore.error(`Failed to convert "${holder.file.name}".`, 'Conversion Failed')
      }
      return 'failed'
    } finally {
      controllers.delete(holder.id)
      activeCount.value--
    }
  }

  /** Converts the given files, at most MAX_CONCURRENT_CONVERSIONS at a time. */
  const convert = async (holders: FileHolder[]) => {
    const isBatch = holders.length > 1
    const outcomes = await Promise.all(holders.map((h) => runFile(h, isBatch)))
    if (!isBatch) return

    const succeededCount = outcomes.filter((o) => o === 'succeeded').length
    const failedCount = outcomes.filter((o) => o === 'failed').length
    // cancelled files are neither successes nor failures
    if (succeededCount + failedCount === 0) return
    if (failedCount === 0) {
      toastStore.success(
        `${succeededCount} files converted successfully!`,
        'Batch Conversion Completed',
      )
    } else if (succeededCount === 0) {
      toastStore.error(`Failed to convert ${failedCount} files.`, 'Batch Conversion Failed')
    } else {
      toastStore.warning(
        `${succeededCount} files converted, ${failedCount} failed.`,
        'Batch Conversion Finished',
      )
    }
  }

  // The backend has no cancel-job endpoint: cancelling aborts an in-progress upload and stops
  // tracking the job, but a job that was already created keeps running on the server.
  const cancelFile = (id: string) => {
    controllers.get(id)?.abort()
  }

  const cancelAll = () => {
    controllers.forEach((controller) => controller.abort())
  }

  return {
    isConverting,
    convert,
    cancelFile,
    cancelAll,
  }
})
