<script setup lang="ts">
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import { useFileStore } from '@/stores/useFileStore'
import { useRouter } from 'vue-router'
import FileUploader from './FileUploader.vue'

const fileStore = useFileStore()
const router = useRouter()

const handleFilesDropped = (files: File[]) => {
  fileStore.clearFiles()
  fileStore.addFiles(files)
  router.push('/converter')
}
</script>

<template>
  <FullScreenDropZone @files-dropped="handleFilesDropped">
    <div class="flex flex-col items-center gap-12.5 md:mt-10">
      <h1 class="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
        Image, Audio & Video Converter
      </h1>
      <FileUploader class="w-90" />
    </div>
  </FullScreenDropZone>
</template>
