<script setup lang="ts">
import { useFileStore } from '@/stores/useFileStore'
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useRouter } from 'vue-router'

const fileStore = useFileStore()
const router = useRouter()
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files || files.length === 0) return
  fileStore.clearFiles()
  fileStore.addFiles(files)
  // reset value so selecting the same file again still triggers change
  target.value = ''
  router.push('/converter')
}

const openFileSelector = () => {
  fileInputRef.value?.click()
}

const onDragEnter = () => {
  isDragOver.value = true
}

const onDragOver = () => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (!files || files.length == 0) return
  fileStore.clearFiles()
  fileStore.addFiles(files)
  router.push('/converter')
}
</script>

<template>
  <div
    class="flex h-70 items-center justify-center rounded-[20px] border-2 border-dashed transition-colors md:min-w-[40vw] md:w-auto"
    :class="isDragOver ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
    <div class="flex flex-col items-center gap-2.5">
      <BaseButton @click="openFileSelector">Select files</BaseButton>
      <div class="text-xs text-slate-500 dark:text-slate-400">
        <span class="hidden md:inline">or drag-and-drop here </span>
        <span>(up to 1.0 GB per file)</span>
      </div>
    </div>
  </div>
</template>
