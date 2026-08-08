<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { ToastNotification } from '@/types/toast'
import IconButton from '@/components/common/IconButton.vue'
import SuccessIcon from '@/components/icons/SuccessIcon.vue'
import ErrorIcon from '@/components/icons/ErrorIcon.vue'
import WarningIcon from '@/components/icons/WarningIcon.vue'
import InfoIcon from '@/components/icons/InfoIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'

const props = defineProps<{
  toast: ToastNotification
}>()

const emit = defineEmits<{
  (e: 'dismiss', id: string): void
}>()

const isPaused = ref(false)
const progress = ref(100)
let timer: ReturnType<typeof setInterval> | null = null
const startTime = ref(Date.now())
const duration = props.toast.duration ?? 4000
const remaining = ref(duration)

const startTimer = () => {
  const step = 50
  startTime.value = Date.now()
  timer = setInterval(() => {
    if (isPaused.value) return
    remaining.value -= step
    progress.value = Math.max(0, (remaining.value / duration) * 100)
    if (remaining.value <= 0) {
      clearTimer()
      emit('dismiss', props.toast.id)
    }
  }, step)
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const onMouseEnter = () => {
  isPaused.value = true
}

const onMouseLeave = () => {
  isPaused.value = false
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  clearTimer()
})

const handleClose = () => {
  clearTimer()
  emit('dismiss', props.toast.id)
}

const iconContainerClass = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'bg-emerald-100/80 text-emerald-600'
    case 'error':
      return 'bg-rose-100/80 text-rose-600'
    case 'warning':
      return 'bg-amber-100/80 text-amber-600'
    case 'info':
    default:
      return 'bg-sky-100/80 text-sky-600'
  }
})

const progressBarClass = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'bg-emerald-500'
    case 'error':
      return 'bg-rose-500'
    case 'warning':
      return 'bg-amber-500'
    case 'info':
    default:
      return 'bg-sky-500'
  }
})
</script>

<template>
  <div
    class="relative group flex items-start gap-3 w-full sm:w-96 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl transition-all duration-300 pointer-events-auto overflow-hidden"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    role="alert"
  >
    <div :class="['shrink-0 p-2 rounded-lg', iconContainerClass]">
      <SuccessIcon v-if="toast.type === 'success'" />
      <ErrorIcon v-else-if="toast.type === 'error'" />
      <WarningIcon v-else-if="toast.type === 'warning'" />
      <InfoIcon v-else />
    </div>

    <div class="flex-1 min-w-0 pt-0.5">
      <h4 v-if="toast.title" class="text-sm font-semibold text-slate-800 leading-tight mb-0.5">
        {{ toast.title }}
      </h4>
      <p class="text-sm text-slate-600 leading-snug wrap-break-word">
        {{ toast.message }}
      </p>
    </div>

    <IconButton @click="handleClose" aria-label="Dismiss toast" class="shrink-0 justify-center">
      <CloseIcon />
    </IconButton>

    <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
      <div
        :class="['h-full transition-all duration-75 ease-linear', progressBarClass]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>
