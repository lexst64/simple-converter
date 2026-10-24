<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { formatBytes, getExtFromFileName } from '@/utils'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'
import Tag, { type TagProps } from 'primevue/tag'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { ConverterService } from '@/services/converter.service.ts'
import { useToastStore } from '@/stores/useToastStore.ts'

const statusSeverities: Record<FileHolder['status'], TagProps['severity']> = {
  pending: 'secondary',
  uploading: 'info',
  processing: 'warn',
  failed: 'danger',
  cancelled: 'secondary',
  completed: 'success',
}

const props = withDefaults(
  defineProps<{
    file: FileHolder
    allSupportedFormats: string[]
    isLoading?: boolean
    isError?: boolean
  }>(),
  {
    isLoading: false,
    isError: false,
  },
)

const targetFormat = defineModel('targetFormat')
const selected = defineModel('selected')
const fileStore = useFileStore()
const toastStore = useToastStore()

const isDownloadDisabled = ref(false)
let downloadCooldownTimerId: number | null = null
let statusDelayTimerId: number | null = null

const displayStatus = ref<FileHolder['status']>(props.file.status)
const displayProgress = ref<number>(props.file.progress)

// show the 100% progress state briefly before transitioning to completed to enhance UX
watch(
  () => [props.file.status, props.file.progress] as const,
  ([newStatus, newProgress]) => {
    if (newStatus === 'completed' && displayStatus.value !== 'completed') {
      displayProgress.value = 100
      if (!statusDelayTimerId) {
        statusDelayTimerId = setTimeout(() => {
          displayStatus.value = 'completed'
          statusDelayTimerId = null
        }, 600)
      }
    } else if (newStatus !== 'completed') {
      if (statusDelayTimerId) {
        clearTimeout(statusDelayTimerId)
        statusDelayTimerId = null
      }
      displayStatus.value = newStatus
      displayProgress.value = newProgress
    }
  },
  { immediate: true },
)

const getStatusSeverity = (status: FileHolder['status']) => statusSeverities[status]

const download = async () => {
  if (isDownloadDisabled.value) return
  isDownloadDisabled.value = true

  try {
    if (props.file.outputFileId) {
      await ConverterService.downloadFile(props.file.outputFileId)
    } else {
      toastStore.error('No outputFileId.', 'File Download Failed')
    }
  } catch {
    toastStore.error(`Failed to download "${props.file.file.name}".`, 'File Download Failed')
  } finally {
    downloadCooldownTimerId = setTimeout(() => {
      isDownloadDisabled.value = false
      downloadCooldownTimerId = null
    }, 2000)
  }
}

onUnmounted(() => {
  if (downloadCooldownTimerId) {
    clearTimeout(downloadCooldownTimerId)
  }
  if (statusDelayTimerId) {
    clearTimeout(statusDelayTimerId)
  }
})
</script>

<template>
  <div
    class="w-full py-2 px-3 flex flex-col gap-3 md:flex-row md:justify-between border-b border-surface text-color transition-colors"
  >
    <div class="flex w-full gap-4 items-center">
      <Checkbox
        v-model="selected"
        binary
        :disabled="
          displayStatus === 'uploading' ||
          displayStatus === 'processing' ||
          displayStatus === 'completed'
        "
        :aria-label="`Select ${file.file.name}`"
      />
      <div class="md:max-w-[50%] max-w-[90%]">
        <p class="truncate font-medium">{{ file.file.name }}</p>
        <p class="font-mono text-muted-color text-xs">
          {{ formatBytes(file.file.size) }} ▪
          {{ getExtFromFileName(file.file.name).toUpperCase() || 'no extension' }}
        </p>
      </div>
    </div>

    <div class="md:hidden w-full h-px bg-surface-200 dark:bg-surface-700"></div>

    <div
      v-if="displayStatus === 'pending' || displayStatus === 'failed'"
      class="flex items-center gap-3 justify-end"
    >
      <Tag rounded :severity="getStatusSeverity(displayStatus)" :value="displayStatus" />
      <FormatSelector
        :formats="allSupportedFormats"
        :is-loading="isLoading"
        :is-error="isError"
        v-model:target-format="targetFormat"
      />
      <Button
        icon="pi pi-times"
        text
        rounded
        severity="secondary"
        size="small"
        aria-label="Remove file"
        @click="() => fileStore.removeFiles([file.id])"
      />
    </div>
    <div v-else class="flex items-center gap-3 justify-end w-full md:w-auto">
      <div v-if="displayStatus === 'processing'" class="flex items-center gap-3 w-full md:w-48">
        <ProgressBar :value="displayProgress" :show-value="false" class="flex-1 h-2.5!" />
        <span class="text-sm text-muted-color font-semibold w-11 text-right"
          >{{ displayProgress }}%</span
        >
      </div>
      <Tag
        rounded
        :severity="getStatusSeverity(displayStatus)"
        :value="displayStatus"
        class="capitalize"
      />
      <div v-if="displayStatus === 'completed'" class="flex items-center gap-3">
        <Tag rounded :value="file.targetFormat?.toUpperCase()" />
        <Button
          icon="pi pi-download"
          text
          rounded
          severity="secondary"
          size="small"
          aria-label="Download converted file"
          :disabled="isDownloadDisabled"
          @click="download"
        />
      </div>
    </div>
  </div>
</template>
