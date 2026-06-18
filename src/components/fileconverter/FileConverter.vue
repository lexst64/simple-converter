<script setup lang="ts">
import { useFileStore } from '@/stores/useFileStore'
import BaseButton from '../common/BaseButton.vue'
import { computed, ref, watch } from 'vue'
import FileItem from './FileItem.vue'
import { ConverterService } from '@/services/converter.service'
import { useAuth } from '@/composables/useAuth.ts'
import { API_URL } from '@/main.ts'
import type { JobStatus } from '@/types/api.ts'
import FormatSelector from './FormatSelector.vue'
import InitialFileUploader from '../InitialFileUploader.vue'

const auth = useAuth()

const fileStore = useFileStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isConverting = ref(false)
// target format chosen in the top-level selector; applied to all selected files
const targetFormat = ref<string | null>(null)

watch(targetFormat, (val) => {
  if (!val) return
  fileStore.files.forEach((f) => {
    if (f.selected) f.targetFormat = val
  })
})

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
    numSelectedFiles.value === 0 ||
    fileStore.files
      .filter((f) => f.selected)
      .some((f) => f.status === 'processing' || f.status === 'uploading') ||
    fileStore.files.filter((f) => f.selected).some((f) => !f.targetFormat)
  )
}

const numSelectedFiles = computed(() => fileStore.files.filter((f) => f.selected).length)

const allFilesSelected = computed(
  () => fileStore.files.length > 0 && fileStore.files.every((f) => f.selected),
)

const toggleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  fileStore.files.forEach((file) => {
    if (file.status === 'uploading' || file.status === 'processing' || file.status === 'completed')
      return
    file.selected = target.checked
  })
}

const convert = async () => {
  if (isConvertDisabled()) return

  isConverting.value = true

  const selectedFiles = fileStore.files.filter((f) => f.selected)

  try {
    const conversionPromises = selectedFiles.map(async (fileHolder) => {
      if (fileHolder.status === 'completed') return

      fileStore.setSelected(fileHolder.id, false)

      try {
        let uploadFileId: string
        // if previous convertion failed, skip uploading the same file again
        if (!fileHolder.uploadFileId) {
          fileStore.setStatus(fileHolder.id, 'uploading')
          uploadFileId = await ConverterService.uploadFile(fileHolder.file)
          fileStore.setUploadFileId(fileHolder.id, uploadFileId)
        } else {
          uploadFileId = fileHolder.uploadFileId
        }

        const jobId = (
          await ConverterService.createConversionJob(uploadFileId, fileHolder.targetFormat!)
        )._id
        fileStore.setProgress(fileHolder.id, 0)

        await new Promise<void>((resolve, reject) => {
          const wsUrl = `${API_URL}/conversions/job/${jobId}/status`.replace(/^http/, 'ws')
          const socket = new WebSocket(wsUrl, ['Bearer', auth.token || ''])

          socket.onmessage = (event) => {
            const statusData = JSON.parse(event.data) as { status: JobStatus; progress: number }

            fileStore.setStatus(fileHolder.id, statusData.status)
            fileStore.setProgress(fileHolder.id, statusData.progress)

            if (statusData.status === 'completed') {
              socket.close()
              fileStore.setSelected(fileHolder.id, false)
              ConverterService.getJob(jobId).then((job) => {
                if (job.outputFileId) {
                  fileStore.setOutputFileId(fileHolder.id, job.outputFileId)
                  resolve()
                } else {
                  reject(new Error('Conversion failed'))
                }
              })
            } else if (statusData.status === 'failed') {
              socket.close()
              fileStore.setSelected(fileHolder.id, true)
              reject(new Error('Conversion failed'))
            }
          }

          socket.onerror = () => {
            fileStore.setStatus(fileHolder.id, 'failed')
            socket.close()
            reject(new Error('WebSocket connection failed'))
          }
        })
      } catch (error) {
        fileStore.setSelected(fileHolder.id, true)
        console.error(`Failed to convert ${fileHolder.file.name}:`, error)
        fileStore.setStatus(fileHolder.id, 'failed')
      }
    })

    await Promise.allSettled(conversionPromises)
  } finally {
    isConverting.value = false
  }
}
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <input type="checkbox" :checked="allFilesSelected" @change="toggleSelectAll" />
      <p v-if="numSelectedFiles === 0">Total: {{ fileStore.files.length }}</p>
      <p v-else>Selected: {{ numSelectedFiles }}</p>
      <FormatSelector :formats="allSupportedFormats" v-model:target-format="targetFormat" />
    </div>

    <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
    <InitialFileUploader v-if="fileStore.files.length === 0" />
    <div
      v-else
      class="flex flex-col border-2 rounded-md overflow-y-scroll scrollbar-hide border-[#5aa8f3] bg-[#e8f3ff]"
    >
      <FileItem
        v-for="file in fileStore.files"
        :file="file"
        :allSupportedFormats="allSupportedFormats"
        :key="file.id"
        v-model:target-format="file.targetFormat"
        v-model:selected="file.selected"
      />
    </div>
    <BaseButton secondary @click="openFileSelector" class="w-full">Add more files</BaseButton>
    <BaseButton :disabled="isConvertDisabled()" @click="convert" class="w-full">Convert</BaseButton>
  </div>
</template>
