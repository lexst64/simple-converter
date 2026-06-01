import { ConversionStatus } from '@/types/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type FileStatus = 'pending' | 'uploading' | 'processing' | 'failed' | 'cancelled' | 'completed'

export interface FileHolder {
  id: string
  file: File
  status: FileStatus
  targetFormat?: string
}

export const useFileStore = defineStore('fileStore', () => {
  const selectedFiles = ref<FileHolder[]>([])

  const addFiles = (files: File[]) => {
    const newHolders: FileHolder[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending',
    }))
    selectedFiles.value = [...selectedFiles.value, ...newHolders]
  }

  const clearFiles = () => {
    selectedFiles.value = []
  }

  const removeFile = (id: string) => {
    selectedFiles.value = selectedFiles.value.filter((file) => file.id !== id)
  }

  const setTargetFormat = (id: string, targetFormat: string) => {
    const idx = selectedFiles.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = selectedFiles.value[idx]!
    selectedFiles.value[idx] = {
      ...existing,
      targetFormat,
    }
  }

  const setStatus = (id: string, status: FileStatus) => {
    const idx = selectedFiles.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = selectedFiles.value[idx]!
    selectedFiles.value[idx] = {
      ...existing,
      status,
    }
  }

  return { selectedFiles, addFiles, clearFiles, removeFile, setTargetFormat, setStatus }
})
