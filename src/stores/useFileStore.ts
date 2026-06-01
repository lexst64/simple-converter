import { ConversionStatus } from '@/types/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

type FileStatus = 'pending' | 'uploading' | 'processing' | 'failed' | 'cancelled' | 'completed'

export interface FileHolder {
  id: string
  file: File
  status: FileStatus
  selected: boolean
  targetFormat?: string
}

export const useFileStore = defineStore('fileStore', () => {
  const files = ref<FileHolder[]>([])

  const addFiles = (_files: File[]) => {
    const newHolders: FileHolder[] = _files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending',
      selected: false,
    }))
    files.value = [...files.value, ...newHolders]
  }

  const clearFiles = () => {
    files.value = []
  }

  const removeFiles = (ids: string[]) => {
    files.value = files.value.filter((file) => !ids.includes(file.id))
  }

  const setTargetFormat = (id: string, targetFormat: string) => {
    const idx = files.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = files.value[idx]!
    files.value[idx] = {
      ...existing,
      targetFormat,
    }
  }

  const setStatus = (id: string, status: FileStatus) => {
    const idx = files.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = files.value[idx]!
    files.value[idx] = {
      ...existing,
      status,
    }
  }

  const setSelected = (id: string, selected: boolean) => {
    const idx = files.value.findIndex((f) => f.id === id)

    if (idx === -1) return

    const existing = files.value[idx]!
    files.value[idx] = {
      ...existing,
      selected,
    }
  }

  return { files, addFiles, clearFiles, removeFiles, setTargetFormat, setStatus, setSelected }
})
