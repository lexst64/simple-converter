<script setup lang="ts">
import { useFormatStore } from '@/stores/useFormatStore'

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
    <svg
      class="animate-spin h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
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
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
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
