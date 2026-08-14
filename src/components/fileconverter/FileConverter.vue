<script setup lang="ts">
import { useFileStore } from '@/stores/useFileStore'
import BaseButton from '@/components/common/BaseButton.vue'
import { computed, ref, watch } from 'vue'
import FileItem from '@/components/fileconverter/FileItem.vue'
import { ConverterService } from '@/services/converter.service'
import { useAuth } from '@/composables/useAuth.ts'
import { API_URL } from '@/main.ts'
import type { JobStatus } from '@/types/api.ts'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { useToastStore } from '@/stores/useToastStore'
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import FileUploader from '../FileUploader.vue'
import { allSupportedFormats } from '@/constants/formats'

const handleFilesDropped = (files: File[]) => {
  fileStore.addFiles(files)
}

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

const toastStore = useToastStore()

const convert = async () => {
  if (isConvertDisabled()) return

  isConverting.value = true

  const selectedFiles = fileStore.files.filter((f) => f.selected)
  const isBatch = selectedFiles.length > 1
  let succeededCount = 0
  let failedCount = 0

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

            // TODO: handle file status better
            fileStore.setStatus(
              fileHolder.id,
              statusData.status === 'pending' ? 'processing' : statusData.status,
            )
            fileStore.setProgress(fileHolder.id, statusData.progress)

            if (statusData.status === 'completed') {
              socket.close()
              fileStore.setSelected(fileHolder.id, false)
              ConverterService.getJob(jobId).then((job) => {
                if (job.outputFileId) {
                  fileStore.setOutputFileId(fileHolder.id, job.outputFileId)
                  succeededCount++
                  if (!isBatch) {
                    toastStore.success(
                      `"${fileHolder.file.name}" was converted successfully!`,
                      'Conversion Completed',
                    )
                  }
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
      } catch {
        failedCount++
        fileStore.setSelected(fileHolder.id, true)
        fileStore.setStatus(fileHolder.id, 'failed')
        if (!isBatch) {
          toastStore.error(`Failed to convert "${fileHolder.file.name}".`, 'Conversion Failed')
        }
      }
    })

    await Promise.allSettled(conversionPromises)

    if (isBatch) {
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
  } finally {
    isConverting.value = false
  }
}
</script>
<template>
  <FullScreenDropZone @files-dropped="handleFilesDropped">
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 items-center text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          :checked="allFilesSelected"
          @change="toggleSelectAll"
          class="h-4 w-4 accent-indigo-600 dark:accent-indigo-500 rounded cursor-pointer"
        />
        <p v-if="numSelectedFiles === 0">Total: {{ fileStore.files.length }}</p>
        <p v-else>Selected: {{ numSelectedFiles }}</p>
        <FormatSelector :formats="allSupportedFormats" v-model:target-format="targetFormat" />
      </div>

      <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
      <FileUploader v-if="fileStore.files.length === 0" />
      <div
        v-else
        class="flex flex-col border-2 rounded-md overflow-y-scroll scrollbar-hide border-indigo-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 transition-colors"
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
      <BaseButton :disabled="isConvertDisabled()" @click="convert" class="w-full"
        >Convert</BaseButton
      >
    </div>
  </FullScreenDropZone>
</template>
