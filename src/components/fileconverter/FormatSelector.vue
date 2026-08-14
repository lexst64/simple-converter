<script setup lang="ts">
import { useFormatStore } from '@/stores/useFormatStore'
import SpinnerIcon from '@/components/icons/SpinnerIcon.vue'
import RefreshIcon from '@/components/icons/RefreshIcon.vue'

withDefaults(
  defineProps<{
    formats: string[]
    isLoading?: boolean
    isError?: boolean
  }>(),
  {
    isLoading: false,
    isError: false,
  },
)

const targetFormat = defineModel('targetFormat')
const formatStore = useFormatStore()

function handleRetry() {
  formatStore.fetchFormats()
}
</script>

<template>
  <div
    v-if="isLoading"
    class="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-md border border-slate-300 dark:border-slate-700 animate-pulse select-none"
  >
    <SpinnerIcon class="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
    <span>Loading...</span>
  </div>

  <div v-else-if="isError" class="inline-flex items-center gap-1.5">
    <select
      disabled
      class="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-2 py-1 text-sm text-red-600 dark:text-red-400 cursor-not-allowed opacity-75"
    >
      <option>Error loading formats</option>
    </select>
    <button
      type="button"
      @click="handleRetry"
      title="Retry fetching formats"
      class="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
    >
      <RefreshIcon class="w-4 h-4" />
    </button>
  </div>

  <select
    v-else
    v-model="targetFormat"
    class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
  >
    <option v-for="format in formats" :key="format" :value="format">
      {{ format.toUpperCase() }}
    </option>
  </select>
</template>
