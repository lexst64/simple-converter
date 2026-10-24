<script setup lang="ts">
import { useFileStore, type FileHolder } from '@/stores/useFileStore'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { computed, ref, watch } from 'vue'
import FileItem from '@/components/fileconverter/FileItem.vue'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { useConversionStore } from '@/stores/useConversionStore'
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import FileUploader from '../FileUploader.vue'
import { useFormatStore } from '@/stores/useFormatStore'

const handleFilesDropped = (files: File[]) => {
  fileStore.addFiles(files)
}

const fileStore = useFileStore()
const formatStore = useFormatStore()
// conversions are owned by the store, so they keep running when this component unmounts
const conversionStore = useConversionStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
// target format chosen in the top-level selector; applied to all selected files
const targetFormat = ref<string | null>(null)

watch(targetFormat, (val) => {
  if (!val) return
  fileStore.files.forEach((f) => {
    if (f.selected) fileStore.updateFile(f.id, { targetFormat: val })
  })
})

const openFileSelector = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files || files.length === 0) return
  fileStore.addFiles(files)
  // reset value so selecting the same file again still triggers change
  target.value = ''
}

const isInFlight = (file: FileHolder) =>
  file.status === 'queued' || file.status === 'uploading' || file.status === 'processing'

const isConvertDisabled = () => {
  return (
    numSelectedFiles.value === 0 ||
    fileStore.files.filter((f) => f.selected).some(isInFlight) ||
    fileStore.files.filter((f) => f.selected).some((f) => !f.targetFormat)
  )
}

const numSelectedFiles = computed(() => fileStore.files.filter((f) => f.selected).length)

const isSelectable = (file: FileHolder) => !isInFlight(file) && file.status !== 'completed'

// only files that can be selected count towards "all selected"
const allFilesSelected = computed(() => {
  const selectable = fileStore.files.filter(isSelectable)
  return selectable.length > 0 && selectable.every((f) => f.selected)
})

const toggleSelectAll = (checked: boolean) => {
  fileStore.files.forEach((file) => {
    if (!isSelectable(file)) return
    fileStore.updateFile(file.id, { selected: checked })
  })
}

const convert = () => {
  if (isConvertDisabled()) return
  conversionStore.convert(fileStore.files.filter((f) => f.selected))
}
</script>
<template>
  <FullScreenDropZone @files-dropped="handleFilesDropped">
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 items-center text-muted-color">
        <Checkbox
          :model-value="allFilesSelected"
          binary
          aria-label="Select all files"
          @update:model-value="toggleSelectAll"
        />
        <p v-if="numSelectedFiles === 0">Total: {{ fileStore.files.length }}</p>
        <p v-else>Selected: {{ numSelectedFiles }}</p>
        <FormatSelector
          :formats="formatStore.allSupportedFormats"
          :is-loading="formatStore.allSupportedFormats.length === 0 ? formatStore.isLoading : false"
          :is-error="formatStore.isError"
          v-model:target-format="targetFormat"
        />
      </div>

      <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
      <FileUploader v-if="fileStore.files.length === 0" />
      <div
        v-else
        class="flex flex-col border rounded-border overflow-y-scroll scrollbar-hide border-surface bg-surface-0 dark:bg-surface-800 transition-colors"
      >
        <FileItem
          v-for="file in fileStore.files"
          :file="file"
          :allSupportedFormats="formatStore.allSupportedFormats"
          :is-loading="formatStore.isLoading"
          :is-error="formatStore.isError"
          :key="file.id"
          :target-format="file.targetFormat"
          :selected="file.selected"
          @update:target-format="(val) => fileStore.updateFile(file.id, { targetFormat: val })"
          @update:selected="(val) => fileStore.updateFile(file.id, { selected: val })"
        />
      </div>
      <Button
        label="Add more files"
        icon="pi pi-plus"
        outlined
        class="w-full"
        @click="openFileSelector"
      />
      <div class="flex gap-2">
        <Button label="Convert" :disabled="isConvertDisabled()" class="flex-1" @click="convert" />
        <Button
          v-if="conversionStore.isConverting"
          label="Cancel"
          icon="pi pi-times"
          severity="danger"
          outlined
          @click="conversionStore.cancelAll"
        />
      </div>
    </div>
  </FullScreenDropZone>
</template>
