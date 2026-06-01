<script setup lang="ts">
defineProps<{ formats: string[] }>()
const targetFormat = defineModel('targetFormat')
</script>

<template>
  <select
    v-model="targetFormat"
    class="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
  >
    <option v-for="format in formats" :key="format" :value="format">
      {{ format.toUpperCase() }}
    </option>
  </select>
</template>
