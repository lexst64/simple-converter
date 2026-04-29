<script setup lang="ts">
import HistoryEntity from '@/components/history/HistoryEntity.vue'
import type { HistoryEntityProps } from './types'

const entities: HistoryEntityProps[] = [
  {
    id: crypto.randomUUID(),
    fileName: 'music.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music2.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music31111111111111music31111111111111.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
  },
]
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <HistoryEntity
      v-for="e in entities"
      :key="e.id"
      :id="e.id"
      :file-name="e.fileName"
      :file-size="e.fileSize"
      :initial-format="e.initialFormat"
      :target-format="e.targetFormat"
    />
  </div>
</template>
