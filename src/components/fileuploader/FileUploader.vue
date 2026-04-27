<script setup lang="ts">
import { ref } from 'vue'
import RemoveIcon from '../icons/RemoveIcon.vue'
import { formatBytes } from '@/utils'
import IconButton from '../IconButton.vue'

interface FileHolder {
  id: string
  file: File
  targetFormat?: string
}

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const fileHolders = ref<FileHolder[]>([])

const outputFormats = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'gif', label: 'GIF' },
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
]
const defaultOutputFormat = outputFormats[0]?.value

const addFiles = (files: FileList) => {
  fileHolders.value.push(
    ...Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file: file,
      targetFormat: defaultOutputFormat,
    })),
  )
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
  const files = event.dataTransfer?.files
  if (!files || files.length == 0) return
  addFiles(files)
}

const openFileSelector = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  addFiles(files)
  // Reset value so selecting the same file again still triggers change
  target.value = ''
}

const removeFile = (id: string) => {
  fileHolders.value = fileHolders.value.filter((fh) => fh.id !== id)
}
</script>

<template>
  <section aria-label="File Uploader">
    <input ref="fileInputRef" type="file" class="hidden" multiple @change="onFileChange" />
    <div
      class="flex h-[50vh] w-[92vw] items-center justify-center rounded-[20px] border-2 border-dashed transition-colors md:min-w-[50vw] md:w-auto overflow-y-scroll scrollbar-hide"
      :class="isDragOver ? 'border-[#5aa8f3] bg-[#e8f3ff]' : 'border-[#bfdaf4] bg-[#f6fafe]'"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="fileHolders.length === 0" class="flex flex-col items-center gap-2.5">
        <button
          type="button"
          @click="openFileSelector"
          class="rounded-lg bg-indigo-500 px-[1.2rem] py-[0.6rem] text-base text-white hover:cursor-pointer"
        >
          Select files
        </button>
        <div class="text-xs">
          <span class="hidden md:inline">or drag-and-drop here </span>
          <span>(up to 1.0 GB per file)</span>
        </div>
      </div>
      <div v-else class="flex w-full flex-col self-start">
        <div
          class="w-full py-2 px-3 flex justify-between border-b-gray-200 border-b"
          v-for="fh in fileHolders"
          :key="fh.id"
        >
          <div>
            <p>{{ fh.file.name }}</p>
            <p class="text-gray-500">{{ formatBytes(fh.file.size) }}</p>
          </div>

          <div class="flex items-center gap-3">
            <select
              v-model="fh.targetFormat"
              class="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option v-for="format in outputFormats" :key="format.value" :value="format.value">
                {{ format.label }}
              </option>
            </select>
            <IconButton @click="() => removeFile(fh.id)"><RemoveIcon /></IconButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
