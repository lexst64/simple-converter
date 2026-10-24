<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Menubar from 'primevue/menubar'
import type { MenuItem } from 'primevue/menuitem'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const links: MenuItem[] = [
  {
    label: 'Home',
    route: '/',
  },
  {
    label: 'Converter',
    route: '/converter',
  },
  {
    label: 'History',
    route: '/history',
  },
  {
    label: 'My profile',
    route: '/profile',
  },
]
</script>

<template>
  <header class="sticky top-0 z-50">
    <Menubar
      :model="links"
      breakpoint="768px"
      :pt="{ start: 'mr-auto', end: 'ml-0! order-1', button: 'order-2' }"
      class="rounded-none! border-x-0! border-t-0! px-6 py-3 bg-surface-0/80! dark:bg-surface-900/85! backdrop-blur-md"
    >
      <template #start>
        <a
          href="/"
          class="mr-4 text-primary font-bold text-xl tracking-tight no-underline select-none"
          >Simple Converter</a
        >
      </template>
      <template #item="{ item, label, props }">
        <RouterLink v-slot="{ href, navigate, isActive }" :to="item.route" custom>
          <a
            :href="href"
            v-bind="props.action"
            :class="{ 'text-primary! font-semibold': isActive }"
            @click="navigate"
          >
            <span class="text-sm font-medium">{{ label }}</span>
          </a>
        </RouterLink>
      </template>
      <template #end>
        <ThemeToggle />
      </template>
    </Menubar>
  </header>
</template>
