<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Badge from 'primevue/badge'
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
      class="flex justify-center mt-12 text-muted-color"
    >
      No previous convertions found
    </div>
    <Accordion
      v-else
      key="content"
      v-model:value="openCategory"
      class="w-full"
    >
      <AccordionPanel v-for="section in groupedItems" :key="section.category" :value="section.category">
        <AccordionHeader>
          <span class="text-sm font-medium uppercase tracking-wide text-muted-color">
            {{ section.category }}
          </span>
          <Badge :value="section.items.length" severity="secondary" class="ml-auto mr-3" />
        </AccordionHeader>
        <AccordionContent>
          <div class="flex flex-col items-center w-full gap-2">
            <HistoryEntity
              v-for="item in section.items"
              :key="item.id"
              :item="item"
              class="flex flex-col w-full"
              @delete="handleDelete"
            />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
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
