<script setup lang="ts">
const props = defineProps<{ secondary?: boolean; }>()
</script>

<template>
  <button
    v-if="props.secondary"
    type="button"
    class="rounded-lg px-[1.2rem] py-[0.6rem] border-indigo-500 border text-base text-indigo-500 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <slot />
  </button>
  <button
    v-else
    type="button"
    class="rounded-lg bg-indigo-500 px-[1.2rem] py-[0.6rem] text-base text-white hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <slot />  
  </button>
</template>
