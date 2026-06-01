<script setup lang="ts">
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { formatBytes } from '@/utils'
import RemoveIcon from '../icons/RemoveIcon.vue'
import IconButton from '../common/IconButton.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import SmallBadge from '../common/SmallBadge.vue'

const statusClasses = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  uploading: 'bg-sky-100 text-sky-700 ring-sky-200',
  processing: 'bg-amber-100 text-amber-800 ring-amber-200',
  failed: 'bg-rose-100 text-rose-700 ring-rose-200',
  cancelled: 'bg-gray-100 text-gray-700 ring-gray-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
} as const

defineProps<{
  file: FileHolder
  allSupportedFormats: string[]
}>()

const targetFormat = defineModel('targetFormat')

const fileStore = useFileStore()

const getStatusClasses = (status: FileHolder['status']) => statusClasses[status]
</script>

<template>
  <div class="w-full py-2 px-3 flex justify-between border-b-gray-200 border-b">
    <div class="max-w-[50%]">
      <p class="truncate">{{ file.file.name }}</p>
      <p class="text-gray-500">{{ formatBytes(file.file.size) }}</p>
    </div>

    <div
      v-if="file.status === 'pending' || file.status === 'failed'"
      class="flex items-center gap-3"
    >
      <SmallBadge :class="getStatusClasses(file.status)">{{ file.status }}</SmallBadge>
      <select
        v-model="targetFormat"
        class="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
      >
        <option v-for="format in allSupportedFormats" :key="format" :value="format">
          {{ format.toUpperCase() }}
        </option>
      </select>
      <IconButton @click="() => fileStore.removeFile(file.id)"><RemoveIcon /></IconButton>
    </div>
    <div v-else class="flex items-center gap-3">
      <SmallBadge :class="getStatusClasses(file.status)">{{ file.status }}</SmallBadge>
      <div v-if="file.status === 'completed'" class="flex items-center gap-3">
        <SmallBadge class="bg-blue-100 text-blue-800 ring-blue-300">{{
          file.targetFormat?.toUpperCase()
        }}</SmallBadge>
        <IconButton><DownloadIcon></DownloadIcon></IconButton>
      </div>
    </div>
  </div>
</template>
