<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="relative flex items-center justify-between bg-indigo-500 px-6.25 py-3.75">
    <a href="/" class="text-white no-underline">Simple Converter</a>
    <nav class="hidden md:block">
      <ul class="flex list-none gap-3.75">
        <li>
          <RouterLink to="/" class="nav-link text-white no-underline">Home</RouterLink>
        </li>
        <li>
          <RouterLink to="/history" class="nav-link text-white no-underline">History</RouterLink>
        </li>
        <li>
          <RouterLink to="/auth" class="nav-link text-white no-underline">Sign in</RouterLink>
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
              class="nav-link block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
            >
              Home
            </RouterLink>
          </li>
          <li>
            <RouterLink
              to="/history"
              class="nav-link block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
            >
              History
            </RouterLink>
          </li>
          <li>
            <RouterLink
              to="/auth"
              class="nav-link block rounded px-2 py-1 text-slate-800 no-underline hover:bg-slate-100"
            >
              Sign in
            </RouterLink>
          </li>
        </ul>
      </nav>
    </details>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.2rem;
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background: currentColor;
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform 220ms ease;
  opacity: 0.9;
}

.nav-link-active::after,
.nav-link-exact-active::after {
  transform: translateX(-50%) scaleX(1);
}
</style>
