import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ConverterService } from '@/services/converter.service'
import { JobStatus, type UserFile } from '@/types/api'
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

export const useHistoryStore = defineStore(
  'historyStore',
  () => {
    const items = ref<HistoryItem[]>([])
    const hasLoadedOnce = ref<boolean>(false)
    const isFetching = ref<boolean>(false)

    const toastStore = useToastStore()

    async function fetchHistory(forceSkeleton = false) {
      // Only show skeleton if we have no prior data and haven't loaded before
      const shouldShowSkeleton = !hasLoadedOnce.value || forceSkeleton

      isFetching.value = true

      try {
        const jobs = (await ConverterService.getJobs()).filter(
          (j) => j.status === JobStatus.COMPLETED,
        )

        const outputFileDetails: (UserFile | undefined)[] = await Promise.all(
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

        const fetchedItems: HistoryItem[] = jobs.map((j, i) => ({
          id: j._id,
          fileName: outputFileDetails[i]?.originalFileName || '',
          fileSize: outputFileDetails[i]?.size || 0,
          initialFormat: j.inputFormat,
          targetFormat: j.outputFormat,
          timestamp: j.completedAt?.toString() || '',
          outputFileId: j.outputFileId || '',
        }))

        items.value = fetchedItems
        hasLoadedOnce.value = true
      } catch {
        toastStore.error('Failed to load conversion history.', 'Error')
      } finally {
        isFetching.value = false
      }

      return shouldShowSkeleton
    }

    async function deleteItem(id: string) {
      const index = items.value.findIndex((item) => item.id === id)
      if (index === -1) return

      const itemToDelete = items.value[index]
      if (!itemToDelete) return

      // Optimistically remove from state immediately
      items.value.splice(index, 1)

      try {
        await ConverterService.deleteJob(id)
      } catch {
        // Rollback state if deletion fails
        items.value.splice(index, 0, itemToDelete)
        toastStore.error(`Failed to delete "${itemToDelete.fileName}".`, 'Deletion Failed')
      }
    }

    return {
      items,
      hasLoadedOnce,
      isFetching,
      fetchHistory,
      deleteItem,
    }
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['items', 'hasLoadedOnce'],
    },
  },
)
