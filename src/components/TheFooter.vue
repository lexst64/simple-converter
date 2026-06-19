<script setup lang="ts">
import { computed } from 'vue';
import InlineLink from './common/InlineLink.vue'
import pkg from '../../package.json';

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="flex justify-between bg-gray-200 p-1 text-sm">
    <p>v{{ pkg.version }} &copy; {{ year }} Oleksii Stoliarchuk</p>
    <nav class="hidden md:block">
      <ul class="flex list-none gap-3.5">
        <li>
          <InlineLink href="https://github.com/lexst64/simple-converter">Source code</InlineLink>
        </li>
        <li><InlineLink href="https://github.com/lexst64/simple-converter#faq">FAQ</InlineLink></li>
        <li><InlineLink href="https://github.com/lexst64/simple-converter#contacts">Contact</InlineLink></li>
      </ul>
    </nav>
  </footer>
</template>
