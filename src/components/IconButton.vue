<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center gap-2 rounded-md p-1 transition-colors duration-200 ease-out hover:cursor-pointer hover:bg-blue-100 focus-visible:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <slot />
  </button>
</template>
