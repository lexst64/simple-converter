<script setup lang="ts">
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import { useFileStore } from '@/stores/useFileStore'
import { useRouter } from 'vue-router'
import FileUploader from './FileUploader.vue'

const fileStore = useFileStore()
const router = useRouter()

const handleFilesDropped = (files: File[]) => {
  // the drop zone already filtered out rejected files; keep the list if none are left
  if (files.length === 0) return
  fileStore.clearFiles()
  fileStore.addFiles(files)
  router.push('/converter')
}
</script>

<template>
  <FullScreenDropZone @files-dropped="handleFilesDropped">
    <div class="flex flex-col items-center gap-12.5 md:mt-10">
      <h1 class="text-2xl md:text-4xl font-bold tracking-tight text-color">
        Image, Audio & Video Converter
      </h1>
      <FileUploader class="w-90" />
    </div>
  </FullScreenDropZone>
</template>
