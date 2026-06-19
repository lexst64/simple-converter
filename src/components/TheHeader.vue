<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)

const links = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Converter',
    href: '/converter',
  },
  {
    name: 'History',
    href: '/history',
  },
  {
    name: 'My profile',
    href: '/profile',
  },
]
</script>

<template>
  <header
    class="sticky top-0 z-50 relative flex items-center justify-between bg-white/75 backdrop-blur-md px-6 py-4 border-b border-gray-100"
  >
    <a href="/" class="text-indigo-600 font-bold text-xl tracking-tight no-underline"
      >Simple Converter</a
    >
    <nav class="hidden md:block">
      <ul class="flex list-none gap-1 items-center m-0 p-0">
        <li v-for="link in links" :key="link.href">
          <RouterLink
            :to="link.href"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline hover:bg-indigo-50 hover:text-indigo-600 transition-colors [&.nav-link-active]:text-indigo-600 [&.nav-link-active]:bg-indigo-50"
            >{{ link.name }}</RouterLink
          >
        </li>
      </ul>
    </nav>
    <div class="relative md:hidden">
      <button
        @click="isMobileMenuOpen = !isMobileMenuOpen"
        class="cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all px-3 py-2 text-slate-600 flex items-center justify-center focus:outline-none"
      >
        <span class="sr-only">Open menu</span>
        <svg
          class="h-5 w-5 transition-transform"
          :class="isMobileMenuOpen ? 'rotate-90' : 'rotate-0'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-if="!isMobileMenuOpen" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <Teleport to="body">
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 z-[40] bg-slate-900/20 backdrop-blur-sm"
            @click="isMobileMenuOpen = false"
          ></div>
        </transition>
      </Teleport>

      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform scale-95 opacity-0 -translate-y-2"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 -translate-y-2"
      >
        <nav
          v-if="isMobileMenuOpen"
          class="absolute right-0 top-[calc(100%+12px)] z-20 w-56 origin-top-right rounded-xl bg-white/95 backdrop-blur-md p-2 shadow-2xl ring-1 ring-black/5"
        >
          <ul class="flex list-none flex-col gap-1">
            <li v-for="link in links" :key="link.href">
              <RouterLink
                :to="link.href"
                class="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 no-underline hover:bg-indigo-50 hover:text-indigo-600 transition-colors [&.nav-link-active]:text-indigo-600 [&.nav-link-active]:bg-indigo-50"
                @click="isMobileMenuOpen = false"
              >
                {{ link.name }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </transition>
    </div>
  </header>
</template>
