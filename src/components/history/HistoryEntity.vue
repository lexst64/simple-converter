<script setup lang="ts">
import { ConverterService } from '@/services/converter.service.ts'
import { formatBytes } from '../../utils'
import IconButton from '../common/IconButton.vue'
import SmallBadge from '../common/SmallBadge.vue'
import ArrowLongRight from '../icons/ArrowLongRight.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import type { HistoryItem } from './TheHistory.vue'
import TrashIcon from '../icons/TrashIcon.vue'

const props = defineProps<{ item: HistoryItem }>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()
</script>

<template>
  <div
    class="flex flex-col w-full md:flex-row md:items-center gap-3 rounded-2xl border border-blue-100 bg-[#f6fafe] px-4 py-3 md:w-200 md:gap-4 md:px-5"
  >
    <div class="min-w-0 flex-1">
      <p class="font-medium truncate">{{ props.item.fileName }}</p>
      <p class="text-sm text-gray-500">{{ formatBytes(props.item.fileSize) }}</p>
    </div>

    <div class="md:hidden w-full h-px bg-gray-300"></div>

    <div class="flex gap-2 justify-end">
      <div class="flex shrink-0 items-center gap-2 text-sm">
        <SmallBadge class="hidden bg-blue-100 text-blue-800 ring-blue-200 md:inline-flex">
          {{ props.item.initialFormat.toUpperCase() || 'unknown' }}
        </SmallBadge>
        <ArrowLongRight class="text-blue-500" />
        <SmallBadge class="bg-blue-100 text-blue-800 ring-blue-200">
          {{ props.item.targetFormat.toUpperCase() }}
        </SmallBadge>
      </div>
      <IconButton
        @click="() => ConverterService.downloadFile(item.outputFileId, item.fileName)"
        aria-label="Download converted file"
      >
        <DownloadIcon />
      </IconButton>
      <IconButton @click="emit('delete', item.id)" aria-label="Delete history item" class="hover:bg-red-100">
        <TrashIcon />
      </IconButton>
    </div>
  </div>
</template>
