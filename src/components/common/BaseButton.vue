<script setup lang="ts">
const props = defineProps<{ secondary?: boolean; }>()
</script>

<template>
  <button
    v-if="props.secondary"
    type="button"
    class="rounded-lg px-[1.2rem] py-[0.6rem] border-indigo-500 dark:border-indigo-400 border text-base text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    <slot />
  </button>
  <button
    v-else
    type="button"
    class="rounded-lg bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-[1.2rem] py-[0.6rem] text-base text-white hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    <slot />  
  </button>
</template>
