<script setup lang="ts">
import { formatBytes } from '../../utils'
import IconButton from '../common/IconButton.vue'
import ArrowLongRight from '../icons/ArrowLongRight.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import type { HistoryEntityProps } from './types'

const props = defineProps<HistoryEntityProps>()
</script>

<template>
  <div
    class="flex items-center justify-between w-full md:w-200 h-20 bg-[#f6fafe] rounded-[20px] px-5 py-3"
  >
    <div class="w-50">
      <p class="font-medium truncate">{{ props.fileName }}</p>
      <p class="text-gray-500">{{ formatBytes(props.fileSize) }}</p>
    </div>
    <div>
      <div class="flex gap-2 ">
        <span class="hidden md:inline bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.initialFormat }}
        </span>
        <ArrowLongRight class="hidden md:block" />
        <span class="bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.targetFormat }}
        </span>
      </div>
    </div>
    <IconButton><DownloadIcon /></IconButton>
  </div>
</template>
