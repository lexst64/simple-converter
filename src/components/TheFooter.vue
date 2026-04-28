<script setup lang="ts">
import InlineLink from './common/InlineLink.vue'
</script>

<template>
  <footer class="flex justify-between bg-gray-200 p-1 text-sm">
    <p>
      &copy; 2026 Oleksii Stoliarchuk. Distributed under the
      <InlineLink href="https://en.wikipedia.org/wiki/MIT_License">MIT License</InlineLink>.
    </p>
    <nav class="hidden md:block">
      <ul class="flex list-none gap-3.5">
        <li><InlineLink href="#">Source code</InlineLink></li>
        <li><InlineLink href="#">FAQ</InlineLink></li>
        <li><InlineLink href="#">Contact</InlineLink></li>
      </ul>
    </nav>
  </footer>
</template>
