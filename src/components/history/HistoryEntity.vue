<script setup lang="ts">
import { formatBytes } from '../../utils'
import IconButton from '../common/IconButton.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import type { HistoryEntityProps } from './types'

const props = defineProps<HistoryEntityProps>()
</script>

<template>
  <div
    class="flex items-center justify-between w-full md:w-200 h-20 bg-[#f6fafe] rounded-[20px] px-5 py-3"
  >
    <div>
      <p class="font-medium">{{ props.fileName }}</p>
      <p class="text-gray-500">{{ formatBytes(props.fileSize) }}</p>
    </div>
    <div>
      <span>
        <span class="bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.initialFormat }}
        </span>
        ->
        <span class="bg-indigo-200 rounded-[5px] px-[3px] py-[1px]">
          {{ props.targetFormat }}
        </span>
      </span>
    </div>
    <IconButton><DownloadIcon /></IconButton>
  </div>
</template>
