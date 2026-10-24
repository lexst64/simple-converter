import { defineStore } from 'pinia'
import { ref } from 'vue'
import ToastEventBus from 'primevue/toasteventbus'
import type { ToastMessageOptions } from 'primevue/toast'
import type { ToastNotification, ToastType } from '@/types/toast'

const severities: Record<ToastType, ToastMessageOptions['severity']> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warn',
}

// PrimeVue's Toast matches messages by id, so the store id doubles as the message id
const toMessage = (toast: ToastNotification): ToastMessageOptions & { id: string } => ({
  id: toast.id,
  severity: severities[toast.type],
  summary: toast.title,
  detail: toast.message,
  life: toast.duration,
})

export const useToastStore = defineStore('toastStore', () => {
  const toasts = ref<ToastNotification[]>([])
  const MAX_TOASTS = 3

  const removeToast = (id: string) => {
    const toast = toasts.value.find((t) => t.id === id)
    if (!toast) return
    toasts.value = toasts.value.filter((t) => t.id !== id)
    ToastEventBus.emit('remove', toMessage(toast))
  }

  const clearAll = () => {
    toasts.value = []
    ToastEventBus.emit('remove-all-groups')
  }

  const addToast = (payload: {
    type: ToastType
    message: string
    title?: string
    duration?: number
  }) => {
    const id = crypto.randomUUID()
    const defaultDuration = payload.type === 'error' ? 6000 : 4000
    const newToast: ToastNotification = {
      id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      duration: payload.duration ?? defaultDuration,
    }

    // Overflow protection: evict oldest toast if cap reached
    const oldest = toasts.value[0]
    if (toasts.value.length >= MAX_TOASTS && oldest) {
      removeToast(oldest.id)
    }

    toasts.value.push(newToast)
    ToastEventBus.emit('add', toMessage(newToast))
    return id
  }

  const success = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'success', message, title, duration })
  }

  const error = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'error', message, title, duration })
  }

  const info = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'info', message, title, duration })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'warning', message, title, duration })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    info,
    warning,
  }
})
