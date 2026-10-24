<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { ConverterService } from '@/services/converter.service.ts'
import { formatBytes } from '@/utils'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { HistoryItem } from '@/components/history/TheHistory.vue'
import { useToastStore } from '@/stores/useToastStore'

const props = defineProps<{ item: HistoryItem }>()
const toastStore = useToastStore()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const isDeleting = ref(false)
const isDownloadDisabled = ref(false)
let downloadTimer: ReturnType<typeof setTimeout> | null = null

function handleDelete() {
  if (isDeleting.value) return
  isDeleting.value = true
  emit('delete', props.item.id)
}

const handleDownload = async () => {
  if (isDownloadDisabled.value || isDeleting.value) return
  isDownloadDisabled.value = true

  try {
    await ConverterService.downloadFile(props.item.outputFileId)
  } catch {
    toastStore.error(`Failed to download "${props.item.fileName}".`, 'File Download Failed')
  } finally {
    downloadTimer = setTimeout(() => {
      isDownloadDisabled.value = false
      downloadTimer = null
    }, 2000)
  }
}

onUnmounted(() => {
  if (downloadTimer) {
    clearTimeout(downloadTimer)
  }
})

const timeAgo = computed(() => {
  const timestamp = props.item.timestamp
  if (!timestamp) return ''
  const diffInSeconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
})
</script>

<template>
  <div
    class="w-full py-2 px-3 flex flex-col gap-3 md:flex-row md:justify-between md:items-center border-b border-surface text-color transition-colors"
    :class="{ 'opacity-50 pointer-events-none': isDeleting }"
  >
    <div class="min-w-0 md:max-w-[50%]">
      <p class="truncate font-medium">{{ props.item.fileName }}</p>
      <p class="font-mono text-muted-color text-xs">
        {{ formatBytes(props.item.fileSize) }} ▪ {{ timeAgo }}
      </p>
    </div>

    <div class="md:hidden w-full h-px bg-surface-200 dark:bg-surface-700"></div>

    <div class="flex items-center gap-3 justify-end">
      <div class="flex shrink-0 items-center gap-2 text-sm">
        <Tag
          rounded
          class="inline-flex"
          :value="props.item.initialFormat.toUpperCase() || 'unknown'"
        />
        <i class="pi pi-arrow-right text-primary" aria-hidden="true" />
        <Tag rounded :value="props.item.targetFormat.toUpperCase()" />
      </div>
      <Button
        icon="pi pi-download"
        text
        rounded
        severity="secondary"
        size="small"
        aria-label="Download converted file"
        :disabled="isDeleting || isDownloadDisabled"
        @click="handleDownload"
      />
      <Button
        icon="pi pi-trash"
        text
        rounded
        severity="danger"
        size="small"
        aria-label="Delete history item"
        :disabled="isDeleting"
        @click="handleDelete"
      />
    </div>
  </div>
</template>
