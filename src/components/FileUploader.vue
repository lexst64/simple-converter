<script setup lang="ts">
import { useFileStore } from '@/stores/useFileStore'
import { ref } from 'vue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const fileStore = useFileStore()
const router = useRouter()
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
</script>

<template>
  <div
    class="flex h-70 items-center justify-center rounded-[20px] border-2 border-dashed transition-colors md:min-w-[40vw] md:w-auto border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-800/50"
  >
    <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
    <div class="flex flex-col items-center gap-2.5">
      <Button label="Select files" icon="pi pi-upload" @click="openFileSelector" />
      <div class="text-xs text-muted-color">
        <span class="hidden md:inline">or drag-and-drop anywhere </span>
        <span>(up to 1.0 GB per file)</span>
      </div>
    </div>
  </div>
</template>
