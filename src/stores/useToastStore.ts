import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastNotification, ToastType } from '@/types/toast'

export const useToastStore = defineStore('toastStore', () => {
  const toasts = ref<ToastNotification[]>([])
  const MAX_TOASTS = 3

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const clearAll = () => {
    toasts.value = []
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
    if (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift()
    }

    toasts.value.push(newToast)
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

