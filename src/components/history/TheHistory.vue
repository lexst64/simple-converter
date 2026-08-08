<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import HistoryEntity from '@/components/history/HistoryEntity.vue'
import HistorySkeleton from '@/components/history/HistorySkeleton.vue'
import { useHistoryStore, type HistoryItem } from '@/stores/useHistoryStore'

export type { HistoryItem }

type HistoryCategory = 'today' | 'yesterday' | 'this week' | 'this month' | 'earlier'

const historyStore = useHistoryStore()

// If we already have cached history from previous visit/session, don't show skeleton
const isLoading = ref(!historyStore.hasLoadedOnce)

const categories: HistoryCategory[] = ['today', 'yesterday', 'this week', 'this month', 'earlier']

const groupedItems = computed(() => {
  const buckets = new Map<HistoryCategory, HistoryItem[]>(
    categories.map((category) => [category, []]),
  )

  for (const item of historyStore.items) {
    buckets.get(getHistoryCategory(item.timestamp))?.push(item)
  }

  return categories
    .map((category) => ({
      category,
      items: buckets.get(category) ?? [],
    }))
    .filter((section) => section.items.length > 0)
})

const openCategory = ref<HistoryCategory | null>(null)

function toggleCategory(category: HistoryCategory) {
  openCategory.value = category
}

watch(
  groupedItems,
  (sections) => {
    if (openCategory.value === null && sections.length > 0) {
      const first = sections[0]
      if (first) {
        openCategory.value = first.category
      }
    }
  },
  { immediate: true },
)

function getHistoryCategory(timestamp: string): HistoryCategory {
  const itemDate = new Date(timestamp)
  const now = new Date()

  if (isSameDay(itemDate, now)) {
    return 'today'
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(itemDate, yesterday)) {
    return 'yesterday'
  }

  const startOfWeek = getStartOfWeek(now)
  if (itemDate >= startOfWeek) {
    return 'this week'
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (itemDate >= startOfMonth) {
    return 'this month'
  }

  return 'earlier'
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day

  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  return start
}

onMounted(async () => {
  try {
    await historyStore.fetchHistory()
  } finally {
    isLoading.value = false
  }
})

function handleDelete(id: string) {
  historyStore.deleteItem(id)
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <HistorySkeleton v-if="isLoading" key="skeleton" />
    <div
      v-else-if="historyStore.items.length === 0"
      key="empty"
      class="flex justify-center mt-12 text-gray-500"
    >
      No previous convertions found
    </div>
    <div v-else key="content" class="flex flex-col items-center gap-4 w-full">
      <section
        v-for="section in groupedItems"
        :key="section.category"
        class="flex w-full flex-col items-center gap-2"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between py-2 px-3 bg-[#f6fafe] rounded-md cursor-pointer"
          @click="toggleCategory(section.category)"
          :aria-expanded="openCategory === section.category"
        >
          <p class="text-sm font-medium uppercase tracking-wide text-gray-500">
            {{ section.category }}
          </p>
          <span class="text-sm text-gray-400">{{ section.items.length }}</span>
        </button>

        <div
          v-show="openCategory === section.category"
          class="flex flex-col items-center w-full mt-2 gap-2"
        >
          <HistoryEntity
            v-for="item in section.items"
            :key="item.id"
            :item="item"
            class="flex flex-col w-full"
            @delete="handleDelete"
          />
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
