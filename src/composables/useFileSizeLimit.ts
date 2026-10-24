import { useToastStore } from '@/stores/useToastStore'
import { MAX_FILE_SIZE, splitBySize, type RejectedFile } from '@/utils'

export function useFileSizeLimit() {
  const toastStore = useToastStore()

  const notifyRejected = (rejected: RejectedFile[]) => {
    toastStore.error(
      rejected.map((r) => r.file.name).join(', '),
      `${rejected.length} File(s) Rejected`,
    )
  }

  // reports oversized files and returns the ones within the limit
  const filterBySize = (files: File[], maxSize = MAX_FILE_SIZE) => {
    const { valid, rejected } = splitBySize(files, maxSize)
    if (rejected.length > 0) notifyRejected(rejected)
    return valid
  }

  return { notifyRejected, filterBySize }
}
