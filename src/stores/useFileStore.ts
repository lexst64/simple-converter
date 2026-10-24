import { defineStore } from 'pinia'
import { ref } from 'vue'

type FileStatus =
  | 'pending'
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'failed'
  | 'cancelled'
  | 'completed'

export interface FileHolder {
  id: string
  file: File
  status: FileStatus
  selected: boolean
  progress: number
  targetFormat?: string
  uploadFileId?: string
  outputFileId?: string
}

export const useFileStore = defineStore('fileStore', () => {
  const files = ref<FileHolder[]>([])

  const addFiles = (_files: File[]) => {
    const newHolders: FileHolder[] = _files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending',
      selected: false,
      progress: 0,
    }))
    files.value = [...files.value, ...newHolders]
  }

  const clearFiles = () => {
    files.value = []
  }

  const removeFiles = (ids: string[]) => {
    files.value = files.value.filter((file) => !ids.includes(file.id))
  }

  const updateFile = (id: string, patch: Partial<Omit<FileHolder, 'id' | 'file'>>) => {
    const idx = files.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = files.value[idx]!
    files.value[idx] = {
      ...existing,
      ...patch,
    }
  }

  return {
    files,
    addFiles,
    clearFiles,
    removeFiles,
    updateFile,
  }
})
