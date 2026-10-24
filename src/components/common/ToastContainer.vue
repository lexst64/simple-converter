<script setup lang="ts">
import Toast, { type ToastMessageOptions } from 'primevue/toast'
import { useToastStore } from '@/stores/useToastStore'

const toastStore = useToastStore()

// keep the store in sync when PrimeVue closes a toast (close button, swipe or timeout)
const onClosed = ({ message }: { message: ToastMessageOptions & { id?: string } }) => {
  if (message.id) toastStore.removeToast(message.id)
}
</script>

<template>
  <Toast position="top-right" style="top: 5rem" @close="onClosed" @life-end="onClosed" />
</template>
