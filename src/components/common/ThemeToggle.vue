<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/useThemeStore'

const themeStore = useThemeStore()
const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const options: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'auto', label: 'System' },
]

function selectTheme(mode: ThemeMode) {
  themeStore.setThemeMode(mode)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  themeStore.initTheme()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-block text-left">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="cursor-pointer flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="Toggle color theme"
      :aria-expanded="isOpen"
    >
      <!-- Sun Icon (Light Mode active) -->
      <svg
        v-if="themeStore.themeMode === 'light'"
        class="h-4 w-4 text-amber-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>

      <!-- Moon Icon (Dark Mode active) -->
      <svg
        v-else-if="themeStore.themeMode === 'dark'"
        class="h-4 w-4 text-indigo-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>

      <!-- Monitor Icon (Auto Mode active) -->
      <svg
        v-else
        class="h-4 w-4 text-slate-500 dark:text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <path d="M12 17v4M8 21h8" />
      </svg>

      <span class="capitalize text-xs font-semibold">{{ themeStore.themeMode }}</span>

      <svg
        class="h-3.5 w-3.5 text-slate-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white dark:bg-slate-800 p-1.5 shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-50"
      >
        <button
          v-for="opt in options"
          :key="opt.mode"
          @click="selectTheme(opt.mode)"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          :class="[
            themeStore.themeMode === opt.mode
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <div class="flex items-center gap-2">
            <!-- Light Icon -->
            <svg
              v-if="opt.mode === 'light'"
              class="h-3.5 w-3.5 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            <!-- Dark Icon -->
            <svg
              v-else-if="opt.mode === 'dark'"
              class="h-3.5 w-3.5 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <!-- Auto Icon -->
            <svg
              v-else
              class="h-3.5 w-3.5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <path d="M12 17v4M8 21h8" />
            </svg>
            <span>{{ opt.label }}</span>
          </div>

          <!-- Checkmark for selected mode -->
          <svg
            v-if="themeStore.themeMode === opt.mode"
            class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>
