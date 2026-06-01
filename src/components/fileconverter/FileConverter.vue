<script setup lang="ts">
import { useFileStore } from '@/stores/useFileStore'
import BaseButton from '../common/BaseButton.vue'
import { ref } from 'vue'
import FileItem from './FileItem.vue'
import { ConverterService } from '@/services/converter.service'
import { useAuth } from '@/composables/useAuth.ts'
import { API_URL } from '@/main.ts'
import type { ConversionStatus } from '@/types/api.ts'

const auth = useAuth()

const fileStore = useFileStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isConverting = ref(false)

const supportedFormats = {
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
  image: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'heic', 'webp'],
  audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
}
const allSupportedFormats = [
  ...supportedFormats.audio,
  ...supportedFormats.video,
  ...supportedFormats.image,
]

const openFileSelector = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files || files.length === 0) return
  fileStore.addFiles(files)
  // reset value so selecting the same file again still triggers change
  target.value = ''
}

const isConvertDisabled = () => {
  return (
    fileStore.selectedFiles.some((f) => !f.targetFormat) ||
    fileStore.selectedFiles.length === 0 ||
    isConverting.value
  )
}

const areAllCompleted = () => fileStore.selectedFiles.every((f) => f.status === 'completed')

const convert = async () => {
  if (isConvertDisabled()) return

  isConverting.value = true

  try {
    for (const fileHolder of fileStore.selectedFiles) {
      if (fileHolder.status === 'completed') continue

      fileStore.setStatus(fileHolder.id, 'uploading')

      try {
        const uploadedFileId = await ConverterService.uploadFile(fileHolder.file)
        const job = await ConverterService.createConversionJob(
          uploadedFileId,
          fileHolder.targetFormat!,
        )

        await new Promise<void>((resolve, reject) => {
          const eventSource = new EventSource(
            `${API_URL}/conversions/job/${job.id}/status?token=${auth.token}`,
          )

          eventSource.onmessage = (event) => {
            const statusData = JSON.parse(event.data)
            const status = statusData.status as ConversionStatus
            
            fileStore.setStatus(fileHolder.id, status)

            if (status === 'completed') {
              eventSource.close()
              resolve()
            } else if (status === 'failed') {
              eventSource.close()
              reject(new Error(statusData.errorMessage || 'Conversion failed'))
            }
          }

          eventSource.onerror = () => {
            fileStore.setStatus(fileHolder.id, 'failed')
            eventSource.close()
            reject(new Error('EventSource connection failed'))
          }
        })
      } catch (error) {
        console.error(`Failed to convert ${fileHolder.file.name}:`, error)
        fileStore.setStatus(fileHolder.id, 'failed')
      }
    }
  } finally {
    isConverting.value = false
  }
}
</script>
<template>
  <div class="flex flex-col gap-2">
    <p>Total: {{ fileStore.selectedFiles.length }}</p>
    <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
    <div
      class="flex flex-col border-2 rounded-md overflow-y-scroll scrollbar-hide border-[#5aa8f3] bg-[#e8f3ff]"
    >
      <FileItem
        v-for="file in fileStore.selectedFiles"
        :file="file"
        :allSupportedFormats="allSupportedFormats"
        :key="file.id"
        v-model:target-format="file.targetFormat"
      />
    </div>
    <BaseButton secondary @click="openFileSelector" class="w-full">Add more files</BaseButton>
    <BaseButton v-if="areAllCompleted()" class="w-full">Download all</BaseButton>
    <BaseButton v-else :disabled="isConvertDisabled()" @click="convert" class="w-full"
      >Convert</BaseButton
    >
  </div>
</template>
