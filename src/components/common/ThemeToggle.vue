<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useThemeStore, type ThemeMode } from '@/stores/useThemeStore'

const themeStore = useThemeStore()
const menu = ref<InstanceType<typeof Menu> | null>(null)

const icons: Record<ThemeMode, string> = {
  light: 'pi pi-sun',
  dark: 'pi pi-moon',
  auto: 'pi pi-desktop',
}

const options: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'auto', label: 'System' },
]

const items = computed<MenuItem[]>(() =>
  options.map((opt) => ({
    label: opt.label,
    icon: icons[opt.mode],
    active: themeStore.themeMode === opt.mode,
    command: () => themeStore.setThemeMode(opt.mode),
  })),
)

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <Button
    type="button"
    text
    severity="secondary"
    size="small"
    :icon="icons[themeStore.themeMode]"
    :label="themeStore.themeMode"
    icon-pos="left"
    class="capitalize"
    aria-label="Toggle color theme"
    aria-haspopup="true"
    aria-controls="theme-menu"
    @click="menu?.toggle($event)"
  />
  <Menu id="theme-menu" ref="menu" :model="items" popup>
    <template #item="{ item, props }">
      <a v-bind="props.action" :class="{ 'text-primary! font-semibold': item.active }">
        <span :class="item.icon" />
        <span class="flex-1 text-sm">{{ item.label }}</span>
        <span v-if="item.active" class="pi pi-check text-xs" />
      </a>
    </template>
  </Menu>
</template>
