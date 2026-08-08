<script setup lang="ts">
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { formatBytes, getExtFromFileName } from '@/utils'
import RemoveIcon from '../icons/RemoveIcon.vue'
import IconButton from '../common/IconButton.vue'
import DownloadIcon from '../icons/DownloadIcon.vue'
import SmallBadge from '../common/SmallBadge.vue'
import FormatSelector from './FormatSelector.vue'
import { ConverterService } from '@/services/converter.service.ts'
import { useToastStore } from '@/stores/useToastStore.ts'

const statusClasses = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  uploading: 'bg-sky-100 text-sky-700 ring-sky-200',
  processing: 'bg-amber-100 text-amber-800 ring-amber-200',
  failed: 'bg-rose-100 text-rose-700 ring-rose-200',
  cancelled: 'bg-gray-100 text-gray-700 ring-gray-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
} as const

const props = defineProps<{
  file: FileHolder
  allSupportedFormats: string[]
}>()

const targetFormat = defineModel('targetFormat')
const selected = defineModel('selected')
const fileStore = useFileStore()
const toastStore = useToastStore()

const getStatusClasses = (status: FileHolder['status']) => statusClasses[status]

const download = async () => {
  if (props.file.outputFileId) {
    await ConverterService.downloadFile(props.file.outputFileId)
  } else {
    toastStore.error('No outputFileId.', 'File Download Failed')
  }
}
</script>

<template>
  <div
    class="w-full py-2 px-3 flex flex-col gap-3 md:flex-row md:justify-between border-b-gray-200 border-b"
  >
    <div class="flex w-full gap-4">
      <input
        :disabled="
          file.status === 'uploading' || file.status === 'processing' || file.status === 'completed'
        "
        v-model="selected"
        type="checkbox"
        :value="file.id"
      />
      <div class="md:max-w-[50%] max-w-[90%]">
        <p class="truncate">{{ file.file.name }}</p>
        <p class="text-gray-500">
          {{ formatBytes(file.file.size) }} • {{ getExtFromFileName(file.file.name).toUpperCase() }}
        </p>
      </div>
    </div>

    <div class="md:hidden w-full h-px bg-gray-300"></div>

    <div
      v-if="file.status === 'pending' || file.status === 'failed'"
      class="flex items-center gap-3 justify-end"
    >
      <SmallBadge :class="getStatusClasses(file.status)">{{ file.status }}</SmallBadge>
      <FormatSelector :formats="allSupportedFormats" v-model:target-format="targetFormat" />
      <IconButton @click="() => fileStore.removeFiles([file.id])"><RemoveIcon /></IconButton>
    </div>
    <div v-else class="flex items-center gap-3 justify-end w-full md:w-auto">
      <div v-if="file.status === 'processing'" class="flex items-center gap-3 w-full md:w-48">
        <div class="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            class="h-full transition-all duration-300 ease-out bg-amber-500"
            :style="{ width: `${file.progress}%` }"
          ></div>
        </div>
        <span class="text-sm text-gray-600 font-semibold w-11 text-right"
          >{{ file.progress }}%</span
        >
      </div>
      <SmallBadge :class="getStatusClasses(file.status)" class="capitalize">{{
        file.status
      }}</SmallBadge>
      <div v-if="file.status === 'completed'" class="flex items-center gap-3">
        <SmallBadge class="bg-blue-100 text-blue-800 ring-blue-300">{{
          file.targetFormat?.toUpperCase()
        }}</SmallBadge>
        <IconButton @click="download"><DownloadIcon></DownloadIcon></IconButton>
      </div>
    </div>
  </div>
</template>
