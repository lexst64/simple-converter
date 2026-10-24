<script setup lang="ts">
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { computed, ref, watch } from 'vue'
import FileItem from '@/components/fileconverter/FileItem.vue'
import { ConverterService } from '@/services/converter.service'
import { useAuth } from '@/composables/useAuth.ts'
import { API_URL } from '@/api/client'
import type { JobStatus } from '@/types/api.ts'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { useToastStore } from '@/stores/useToastStore'
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import FileUploader from '../FileUploader.vue'
import { useFormatStore } from '@/stores/useFormatStore'

const handleFilesDropped = (files: File[]) => {
  fileStore.addFiles(files)
}

const auth = useAuth()

const fileStore = useFileStore()
const formatStore = useFormatStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isConverting = ref(false)
// target format chosen in the top-level selector; applied to all selected files
const targetFormat = ref<string | null>(null)

watch(targetFormat, (val) => {
  if (!val) return
  fileStore.files.forEach((f) => {
    if (f.selected) fileStore.updateFile(f.id, { targetFormat: val })
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

const isSelectable = (file: FileHolder) =>
  file.status !== 'uploading' && file.status !== 'processing' && file.status !== 'completed'

// only files that can be selected count towards "all selected"
const allFilesSelected = computed(() => {
  const selectable = fileStore.files.filter(isSelectable)
  return selectable.length > 0 && selectable.every((f) => f.selected)
})

const toggleSelectAll = (checked: boolean) => {
  fileStore.files.forEach((file) => {
    if (!isSelectable(file)) return
    fileStore.updateFile(file.id, { selected: checked })
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

      fileStore.updateFile(fileHolder.id, { selected: false })

      try {
        let uploadFileId: string
        // if previous convertion failed, skip uploading the same file again
        if (!fileHolder.uploadFileId) {
          fileStore.updateFile(fileHolder.id, { status: 'uploading' })
          uploadFileId = await ConverterService.uploadFile(fileHolder.file)
          fileStore.updateFile(fileHolder.id, { uploadFileId })
        } else {
          uploadFileId = fileHolder.uploadFileId
        }

        const jobId = (
          await ConverterService.createConversionJob(uploadFileId, fileHolder.targetFormat!)
        )._id
        fileStore.updateFile(fileHolder.id, { progress: 0 })

        await new Promise<void>((resolve, reject) => {
          const wsUrl = `${API_URL}/conversions/job/${jobId}/status`.replace(/^http/, 'ws')
          const socket = new WebSocket(wsUrl, ['Bearer', auth.token.value || ''])
          // guards against settling more than once and against reacting to our own close()
          let settled = false
          let finished = false

          const settle = (err?: Error) => {
            if (settled) return
            settled = true
            if (err) reject(err)
            else resolve()
          }

          socket.onmessage = (event) => {
            let statusData: { status: JobStatus; progress: number }
            try {
              statusData = JSON.parse(event.data)
            } catch {
              finished = true
              socket.close()
              settle(new Error('Invalid status message'))
              return
            }

            // TODO: handle file status better
            fileStore.updateFile(fileHolder.id, {
              status: statusData.status === 'pending' ? 'processing' : statusData.status,
            })
            fileStore.updateFile(fileHolder.id, { progress: statusData.progress })

            if (statusData.status === 'completed') {
              finished = true
              socket.close()
              fileStore.updateFile(fileHolder.id, { selected: false })
              ConverterService.getJob(jobId)
                .then((job) => {
                  if (job.outputFileId) {
                    fileStore.updateFile(fileHolder.id, { outputFileId: job.outputFileId })
                    succeededCount++
                    if (!isBatch) {
                      toastStore.success(
                        `"${fileHolder.file.name}" was converted successfully!`,
                        'Conversion Completed',
                      )
                    }
                    settle()
                  } else {
                    settle(new Error('Conversion failed'))
                  }
                })
                .catch(() => settle(new Error('Failed to fetch conversion job')))
            } else if (statusData.status === 'failed') {
              finished = true
              socket.close()
              fileStore.updateFile(fileHolder.id, { selected: true })
              settle(new Error('Conversion failed'))
            }
          }

          socket.onerror = () => {
            fileStore.updateFile(fileHolder.id, { status: 'failed' })
            socket.close()
            settle(new Error('WebSocket connection failed'))
          }

          socket.onclose = () => {
            if (!finished) settle(new Error('WebSocket closed unexpectedly'))
          }
        })
      } catch {
        failedCount++
        fileStore.updateFile(fileHolder.id, { selected: true })
        fileStore.updateFile(fileHolder.id, { status: 'failed' })
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
      <div class="flex gap-2 items-center text-muted-color">
        <Checkbox
          :model-value="allFilesSelected"
          binary
          aria-label="Select all files"
          @update:model-value="toggleSelectAll"
        />
        <p v-if="numSelectedFiles === 0">Total: {{ fileStore.files.length }}</p>
        <p v-else>Selected: {{ numSelectedFiles }}</p>
        <FormatSelector
          :formats="formatStore.allSupportedFormats"
          :is-loading="formatStore.allSupportedFormats.length === 0 ? formatStore.isLoading : false"
          :is-error="formatStore.isError"
          v-model:target-format="targetFormat"
        />
      </div>

      <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
      <FileUploader v-if="fileStore.files.length === 0" />
      <div
        v-else
        class="flex flex-col border rounded-border overflow-y-scroll scrollbar-hide border-surface bg-surface-0 dark:bg-surface-800 transition-colors"
      >
        <FileItem
          v-for="file in fileStore.files"
          :file="file"
          :allSupportedFormats="formatStore.allSupportedFormats"
          :is-loading="formatStore.isLoading"
          :is-error="formatStore.isError"
          :key="file.id"
          :target-format="file.targetFormat"
          :selected="file.selected"
          @update:target-format="(val) => fileStore.updateFile(file.id, { targetFormat: val })"
          @update:selected="(val) => fileStore.updateFile(file.id, { selected: val })"
        />
      </div>
      <Button
        label="Add more files"
        icon="pi pi-plus"
        outlined
        class="w-full"
        @click="openFileSelector"
      />
      <Button
        label="Convert"
        :disabled="isConvertDisabled()"
        class="w-full"
        @click="convert"
      />
    </div>
  </FullScreenDropZone>
</template>
