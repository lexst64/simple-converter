<script setup lang="ts">
import { formatBytes } from '../../utils'
import IconButton from '../common/IconButton.vue'
import ArrowLongRight from '../icons/ArrowLongRight.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import type { HistoryItem } from './TheHistory.vue'

const props = defineProps<{ item: HistoryItem }>()
</script>

<template>
  <div
    class="flex items-center justify-between w-full md:w-200 h-20 bg-[#f6fafe] rounded-[20px] px-5 py-3"
  >
    <div class="w-35">
      <p class="font-medium truncate">{{ props.item.fileName }}</p>
      <p class="text-gray-500">{{ formatBytes(props.item.fileSize) }}</p>
    </div>
    <div>
      <div class="flex gap-2">
        <span class="hidden md:inline bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.item.initialFormat }}
        </span>
        <ArrowLongRight class="hidden md:block" />
        <span class="bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.item.targetFormat }}
        </span>
      </div>
    </div>
    <IconButton><DownloadIcon /></IconButton>
  </div>
</template>
