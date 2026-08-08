<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  borderRadius: '0.375rem',
  className: '',
})
</script>

<template>
  <div
    class="animate-pulse bg-blue-100/70"
    :class="className"
    :style="{
      width,
      height,
      borderRadius,
    }"
    aria-hidden="true"
  ></div>
</template>
