<script setup lang="ts">
import { useToastStore } from '@/stores/useToastStore'
import ToastItem from '@/components/common/ToastItem.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'

const toastStore = useToastStore()

const dismiss = (id: string) => {
  toastStore.removeToast(id)
}
</script>

<template>
  <div
    class="fixed top-20 left-4 right-4 sm:left-auto sm:right-5 z-50 flex flex-col items-end gap-3 pointer-events-none"
    aria-live="polite"
  >

    <TransitionGroup name="toast">
      <ToastItem
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :toast="toast"
        @dismiss="dismiss"
      />
    </TransitionGroup>
    <BaseButton
      v-if="toastStore.toasts.length >= 2"
      secondary
      @click="toastStore.clearAll()"
      class="pointer-events-auto shadow-md px-3! py-1! text-xs flex items-center gap-1.5 font-medium"
    >
      <span>Clear all ({{ toastStore.toasts.length }})</span>
      <CloseIcon class="w-3.5 h-3.5 opacity-70" />
    </BaseButton>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-move {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
