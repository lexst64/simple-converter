<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  to?: string
  href?: string
}>()
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    class="hover:underline hover:cursor-pointer text-blue-800 dark:text-blue-300"
  >
    <slot />
  </RouterLink>
  <a
    v-else
    :href="href"
    class="hover:underline hover:cursor-pointer text-blue-800 dark:text-blue-300"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot />
  </a>
</template>

