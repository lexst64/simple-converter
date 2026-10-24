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
    class="hover:underline hover:cursor-pointer text-primary"
  >
    <slot />
  </RouterLink>
  <a
    v-else
    :href="href"
    class="hover:underline hover:cursor-pointer text-primary"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot />
  </a>
</template>

