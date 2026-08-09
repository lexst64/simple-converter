<script setup lang="ts">
defineProps<{ formats: string[] }>()
const targetFormat = defineModel('targetFormat')
</script>

<template>
  <select
    v-model="targetFormat"
    class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
  >
    <option v-for="format in formats" :key="format" :value="format">
      {{ format.toUpperCase() }}
    </option>
  </select>
</template>
