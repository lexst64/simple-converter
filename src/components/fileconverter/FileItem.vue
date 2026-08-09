<script setup lang="ts">
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import { formatBytes, getExtFromFileName } from '@/utils'
import RemoveIcon from '@/components/icons/RemoveIcon.vue'
import IconButton from '@/components/common/IconButton.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import SmallBadge from '@/components/common/SmallBadge.vue'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { ConverterService } from '@/services/converter.service.ts'
import { useToastStore } from '@/stores/useToastStore.ts'

const statusClasses = {
  pending:
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  uploading:
    'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:ring-sky-800',
  processing:
    'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:ring-amber-800',
  failed:
    'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:ring-rose-800',
  cancelled:
    'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  completed:
    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:ring-emerald-800',
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
    class="w-full py-2 px-3 flex flex-col gap-3 md:flex-row md:justify-between border-b-gray-200 dark:border-b-slate-700/60 border-b text-slate-800 dark:text-slate-200 transition-colors"
  >
    <div class="flex w-full gap-4 items-center">
      <input
        :disabled="
          file.status === 'uploading' || file.status === 'processing' || file.status === 'completed'
        "
        v-model="selected"
        type="checkbox"
        :value="file.id"
        class="h-4 w-4 accent-indigo-600 dark:accent-indigo-500 rounded cursor-pointer disabled:cursor-not-allowed"
      />
      <div class="md:max-w-[50%] max-w-[90%]">
        <p class="truncate font-medium">{{ file.file.name }}</p>
        <p class="text-gray-500 dark:text-slate-400 text-xs">
          {{ formatBytes(file.file.size) }} • {{ getExtFromFileName(file.file.name).toUpperCase() }}
        </p>
      </div>
    </div>

    <div class="md:hidden w-full h-px bg-gray-300 dark:bg-slate-700"></div>

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
        <div
          class="flex-1 h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner"
        >
          <div
            class="h-full transition-all duration-300 ease-out bg-amber-500"
            :style="{ width: `${file.progress}%` }"
          ></div>
        </div>
        <span class="text-sm text-gray-600 dark:text-slate-300 font-semibold w-11 text-right"
          >{{ file.progress }}%</span
        >
      </div>
      <SmallBadge :class="getStatusClasses(file.status)" class="capitalize">{{
        file.status
      }}</SmallBadge>
      <div v-if="file.status === 'completed'" class="flex items-center gap-3">
        <SmallBadge
          class="bg-blue-100 text-blue-800 ring-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:ring-blue-800"
          >{{ file.targetFormat?.toUpperCase() }}</SmallBadge
        >
        <IconButton @click="download"><DownloadIcon></DownloadIcon></IconButton>
      </div>
    </div>
  </div>
</template>
