<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useAttrs } from 'vue'
import SmallBadge from '@/components/common/SmallBadge.vue'
import UploadIcon from '@/components/icons/UploadIcon.vue'
import { formatBytes } from '@/utils'
import { useToastStore } from '@/stores/useToastStore'
import { useFormatStore } from '@/stores/useFormatStore'

export interface RejectedFile {
  file: File
  reason: string
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    accept?: string | string[]
    multiple?: boolean
    maxSize?: number // Max size in bytes
    customTitle?: string
    customSubtitle?: string
  }>(),
  {
    disabled: false,
    multiple: true,
    maxSize: 1073741824,
    customTitle: 'Drop files anywhere',
  },
)

const emit = defineEmits<{
  (e: 'files-dropped', files: File[]): void
  (e: 'invalid-files', invalidFiles: RejectedFile[]): void
  (e: 'drag-change', isDragging: boolean): void
}>()

const toastStore = useToastStore()
const attrs = useAttrs()

const handleInvalidFiles = (invalidFiles: RejectedFile[]) => {
  toastStore.error(
    `${invalidFiles.map((f) => f.file.name).join(', ')}`,
    `${invalidFiles.length} File(s) Rejected`,
  )
}

const isDragging = ref(false)
const dragCounter = ref(0)

const isFileDrag = (event: DragEvent): boolean => {
  if (!event.dataTransfer) return false
  const types = Array.from(event.dataTransfer.types || [])
  return types.includes('Files')
}

const formatStore = useFormatStore()

const activeAccept = computed<string[]>(() => {
  if (props.accept !== undefined) {
    return Array.isArray(props.accept) ? props.accept : props.accept.split(',').map((s) => s.trim())
  }
  return formatStore.allSupportedFormats
})

const displayAccept = computed(() => {
  if (formatStore.isLoading) return 'Loading...'
  return activeAccept.value.join(', ')
})

const parseAcceptExtensions = (acceptInput?: string | string[]): string[] => {
  if (!acceptInput) return []
  const list = Array.isArray(acceptInput) ? acceptInput : acceptInput.split(',')
  return list
    .flatMap((item) => item.split(','))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

const validateFiles = (fileList: File[]): { valid: File[]; invalid: RejectedFile[] } => {
  const valid: File[] = []
  const invalid: RejectedFile[] = []

  let filesToProcess = fileList
  if (!props.multiple && fileList.length > 1) {
    const firstFile = fileList[0]
    filesToProcess = firstFile ? [firstFile] : []
    for (let i = 1; i < fileList.length; i++) {
      const f = fileList[i]
      if (f) {
        invalid.push({
          file: f,
          reason: 'Multiple files not allowed',
        })
      }
    }
  }

  const acceptRules = parseAcceptExtensions(activeAccept.value)

  for (const file of filesToProcess) {
    let isValid = true
    let reason = ''

    // Size check
    if (props.maxSize && file.size > props.maxSize) {
      isValid = false
      const maxMb = (props.maxSize / (1024 * 1024)).toFixed(1)
      reason = `File size exceeds ${maxMb} MB limit`
    }

    // Format / type check
    if (isValid && acceptRules.length > 0) {
      const fileNameLower = file.name.toLowerCase()
      const mimeTypeLower = file.type.toLowerCase()

      const matches = acceptRules.some((rule) => {
        const cleanExtRule = rule.startsWith('.') ? rule : `.${rule}`
        if (rule.startsWith('.')) {
          return fileNameLower.endsWith(rule)
        } else if (rule.endsWith('/*')) {
          const mainType = rule.slice(0, -2)
          return mimeTypeLower.startsWith(`${mainType}/`)
        } else if (rule.includes('/')) {
          return mimeTypeLower === rule
        } else {
          return fileNameLower.endsWith(cleanExtRule) || mimeTypeLower.endsWith(`/${rule}`)
        }
      })

      if (!matches) {
        isValid = false
        reason = `File type not allowed (accepted: ${displayAccept.value})`
      }
    }

    if (isValid) {
      valid.push(file)
    } else {
      invalid.push({ file, reason })
    }
  }

  return { valid, invalid }
}

const onDragEnter = (event: DragEvent) => {
  if (props.disabled || !isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value++
  if (!isDragging.value) {
    isDragging.value = true
    emit('drag-change', true)
  }
}

const onDragOver = (event: DragEvent) => {
  if (props.disabled || !isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const onDragLeave = (event: DragEvent) => {
  if (props.disabled || !isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  dragCounter.value--
  if (dragCounter.value <= 0) {
    dragCounter.value = 0
    isDragging.value = false
    emit('drag-change', false)
  }
}

let lastDropTime = 0

const onDrop = (event: DragEvent) => {
  if (props.disabled || !isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()

  // Prevent duplicate drop handling if event triggers multiple times in the same frame/tick
  const now = Date.now()
  if (now - lastDropTime < 150) {
    return
  }
  lastDropTime = now

  dragCounter.value = 0
  isDragging.value = false
  emit('drag-change', false)

  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  if (droppedFiles.length === 0) return

  const { valid, invalid } = validateFiles(droppedFiles)

  if (invalid.length > 0) {
    emit('invalid-files', invalid)
    if (!attrs.onInvalidFiles && !attrs['onInvalid-files']) {
      handleInvalidFiles(invalid)
    }
  }
  if (valid.length > 0) {
    emit('files-dropped', valid)
  }
}

onMounted(() => {
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
})

onUnmounted(() => {
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('drop', onDrop)
})
</script>

<template>
  <div ref="wrapperRef" class="relative w-full min-h-full">
    <!-- Main Wrapped Slot Content -->
    <slot />

    <!-- Full Screen Drop Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out transform-gpu"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in transform-gpu"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isDragging && !disabled"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md select-none"
          @dragenter.prevent.stop="onDragEnter"
          @dragover.prevent.stop="onDragOver"
          @dragleave.prevent.stop="onDragLeave"
          @drop.prevent.stop="onDrop"
        >
          <slot name="overlay" :is-dragging="isDragging">
            <div class="relative flex flex-col items-center justify-center">
              <div
                class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-white"
              >
                <UploadIcon class="h-12 w-12" />
              </div>

              <!-- Title & Subtitle -->
              <h2 class="text-2xl text-white tracking-wide text-center">
                {{ customTitle }}
              </h2>
              <p
                v-if="customSubtitle"
                class="mt-2 text-sm md:text-base text-indigo-200 dark:text-indigo-300 text-center max-w-md"
              >
                {{ customSubtitle }}
              </p>

              <!-- Badges for constraints -->
              <div class="mt-6 flex flex-wrap gap-2 justify-center">
                <SmallBadge
                  v-if="displayAccept"
                  class="bg-indigo-500/30 text-indigo-100 ring-indigo-400/30 font-semibold"
                >
                  Formats: {{ displayAccept }}
                </SmallBadge>
                <SmallBadge
                  v-if="maxSize"
                  class="bg-indigo-500/30 text-indigo-100 ring-indigo-400/30 font-semibold"
                >
                  Max size: {{ formatBytes(maxSize) }}
                </SmallBadge>
                <SmallBadge
                  v-if="!multiple"
                  class="bg-amber-500/30 text-amber-100 ring-amber-400/30 font-semibold"
                >
                  Single file mode
                </SmallBadge>
              </div>
            </div>
          </slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
