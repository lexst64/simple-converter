import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ConverterService } from '@/services/converter.service'
import { JobStatus, type Job } from '@/types/api'
import { useToastStore } from '@/stores/useToastStore'

export interface HistoryItem {
  id: string
  fileName: string
  fileSize: number
  initialFormat: string
  targetFormat: string
  timestamp: string
  outputFileId: string
}

export const HISTORY_PAGE_SIZE = 20

// The backend can't filter by status, so a load keeps requesting raw pages until it has
// a page worth of completed jobs, up to this many requests (Load more picks up the rest)
export const MAX_REQUESTS_PER_LOAD = 5

interface LoadedPage {
  items: HistoryItem[]
  consumed: number
  hasMore: boolean
}

async function toHistoryItems(jobs: Job[]): Promise<HistoryItem[]> {
  const outputFileDetails = await Promise.all(
    jobs.map(async (j) => {
      if (!j.outputFileId) {
        return undefined
      }
      try {
        return await ConverterService.getFileDetails(j.outputFileId)
      } catch {
        return undefined
      }
    }),
  )

  return jobs.map((j, i) => ({
    id: j._id,
    fileName: outputFileDetails[i]?.originalFileName || '',
    fileSize: outputFileDetails[i]?.size || 0,
    initialFormat: j.inputFormat,
    targetFormat: j.outputFormat,
    timestamp: j.completedAt?.toString() || '',
    outputFileId: j.outputFileId || '',
  }))
}

async function loadPage(startOffset: number, knownIds: Set<string>): Promise<LoadedPage> {
  const jobs: Job[] = []
  const seen = new Set(knownIds)
  let cursor = startOffset
  let hasMore = true

  for (let i = 0; i < MAX_REQUESTS_PER_LOAD && hasMore && jobs.length < HISTORY_PAGE_SIZE; i++) {
    const page = await ConverterService.getJobs({ limit: HISTORY_PAGE_SIZE, offset: cursor })
    cursor += page.jobs.length
    hasMore =
      page.jobs.length > 0 &&
      (typeof page.total === 'number' ? cursor < page.total : page.jobs.length >= HISTORY_PAGE_SIZE)

    for (const job of page.jobs) {
      if (job.status === JobStatus.COMPLETED && !seen.has(job._id)) {
        seen.add(job._id)
        jobs.push(job)
      }
    }
  }

  return { items: await toHistoryItems(jobs), consumed: cursor - startOffset, hasMore }
}

export const useHistoryStore = defineStore(
  'historyStore',
  () => {
    const items = ref<HistoryItem[]>([])
    const hasLoadedOnce = ref<boolean>(false)
    const isFetching = ref<boolean>(false)
    const isLoadingMore = ref<boolean>(false)
    // Number of raw jobs (any status) consumed from the backend list so far
    const offset = ref<number>(0)
    const hasMore = ref<boolean>(false)

    // Bumped by every refresh so an older, slower load can't overwrite newer results
    let generation = 0

    const toastStore = useToastStore()

    async function fetchHistory(forceSkeleton = false) {
      // Only show skeleton if we have no prior data and haven't loaded before
      const shouldShowSkeleton = !hasLoadedOnce.value || forceSkeleton
      const current = ++generation

      isFetching.value = true
      isLoadingMore.value = false

      try {
        const page = await loadPage(0, new Set())
        if (current !== generation) return shouldShowSkeleton

        items.value = page.items
        offset.value = page.consumed
        hasMore.value = page.hasMore
        hasLoadedOnce.value = true
      } catch {
        if (current === generation) {
          toastStore.error('Failed to load conversion history.', 'Error')
        }
      } finally {
        if (current === generation) {
          isFetching.value = false
        }
      }

      return shouldShowSkeleton
    }

    async function loadMore() {
      if (!hasMore.value || isFetching.value || isLoadingMore.value) return

      const current = generation
      isLoadingMore.value = true

      try {
        const page = await loadPage(offset.value, new Set(items.value.map((item) => item.id)))
        if (current !== generation) return

        const known = new Set(items.value.map((item) => item.id))
        items.value.push(...page.items.filter((item) => !known.has(item.id)))
        offset.value += page.consumed
        hasMore.value = page.hasMore
      } catch {
        if (current === generation) {
          toastStore.error('Failed to load more conversion history.', 'Error')
        }
      } finally {
        if (current === generation) {
          isLoadingMore.value = false
        }
      }
    }

    async function deleteItem(id: string) {
      const index = items.value.findIndex((item) => item.id === id)
      if (index === -1) return

      const itemToDelete = items.value[index]
      if (!itemToDelete) return
      const nextId = items.value[index + 1]?.id

      // Optimistically remove from state immediately
      items.value.splice(index, 1)

      try {
        await ConverterService.deleteJob(id)
        // The job sat before the cursor, so every later job moved up by one on the backend.
        // If a refresh already saw the deletion, this only causes a duplicate, which gets deduped
        offset.value = Math.max(0, offset.value - 1)
      } catch {
        // Rollback state if deletion fails; other items may have been removed meanwhile,
        // so re-insert before the item that originally followed instead of at the old index
        const nextIndex = nextId ? items.value.findIndex((item) => item.id === nextId) : -1
        const insertAt = nextIndex === -1 ? Math.min(index, items.value.length) : nextIndex
        items.value.splice(insertAt, 0, itemToDelete)
        toastStore.error(`Failed to delete "${itemToDelete.fileName}".`, 'Deletion Failed')
      }
    }

    return {
      items,
      hasLoadedOnce,
      isFetching,
      isLoadingMore,
      offset,
      hasMore,
      fetchHistory,
      loadMore,
      deleteItem,
    }
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['items', 'hasLoadedOnce', 'offset', 'hasMore'],
    },
  },
)
