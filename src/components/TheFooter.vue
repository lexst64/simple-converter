<script setup lang="ts">
import { computed } from 'vue';
import InlineLink from './common/InlineLink.vue'

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="flex justify-between bg-gray-200 p-1 text-sm">
    <p>
      &copy; {{ year }} Oleksii Stoliarchuk. Distributed under the
      <InlineLink
        href="https://github.com/lexst64/simple-converter/blob/530d1201c31b5856107b0520959653e8537648a7/LICENSE"
      >
        MIT License </InlineLink
      >.
    </p>
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
