<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="relative flex items-center justify-between bg-indigo-500 px-[25px] py-[15px]">
    <a href="/" class="text-white no-underline">Simple Converter</a>
    <nav class="hidden md:block">
      <ul class="flex list-none gap-[15px]">
        <li>
          <RouterLink to="/" class="text-white no-underline">Home</RouterLink>
        </li>
        <li>
          <RouterLink to="/history" class="text-white no-underline">History</RouterLink>
        </li>
        <li>
          <RouterLink to="/auth" class="text-white no-underline">Sign in</RouterLink>
        </li>
      </ul>
    </nav>
    <details class="relative md:hidden">
      <summary
        class="list-none cursor-pointer rounded-md border border-white/50 px-3 py-2 text-white [&::-webkit-details-marker]:hidden"
      >
        <span class="sr-only">Open menu</span>
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </summary>
      <nav
        class="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-lg bg-white p-2 shadow-lg"
      >
        <ul class="flex list-none flex-col gap-1">
          <li>
            <RouterLink
              to="/"
              class="block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
              >Home</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/history"
              class="block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
              >History</RouterLink
            >
          </li>
          <li>
            <RouterLink
              to="/auth"
              class="block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
              >Sign in</RouterLink
            >
          </li>
        </ul>
      </nav>
    </details>
  </header>
</template>
