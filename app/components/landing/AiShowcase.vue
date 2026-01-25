<script setup lang="ts">
interface ShowcaseItem {
  id: string
  title: string
  description: string
  icon: string
  color?: string
}

const props = defineProps<{
  items: ShowcaseItem[]
}>()

const activeIndex = ref(0)
const isAnimating = ref(false)

const activeItem = computed(() => props.items[activeIndex.value])

let interval: ReturnType<typeof setInterval> | null = null

function startAutoplay() {
  interval = setInterval(() => {
    nextItem()
  }, 4000)
}

function stopAutoplay() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function nextItem() {
  isAnimating.value = true
  setTimeout(() => {
    activeIndex.value = (activeIndex.value + 1) % props.items.length
    isAnimating.value = false
  }, 150)
}

function selectItem(index: number) {
  if (index === activeIndex.value) {
    return
  }
  stopAutoplay()
  isAnimating.value = true
  setTimeout(() => {
    activeIndex.value = index
    isAnimating.value = false
    startAutoplay()
  }, 150)
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<template>
  <div class="relative w-full max-w-4xl mx-auto">
    <div class="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5 dark:from-primary/10 dark:to-info/10" />

      <div class="relative p-8 md:p-12">
        <div
          class="flex flex-col items-center text-center transition-all duration-300"
          :class="{ 'opacity-0 scale-95': isAnimating, 'opacity-100 scale-100': !isAnimating }"
        >
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300"
            :class="[
              activeItem?.color === 'text-primary' ? 'bg-primary/10 dark:bg-primary/20' : '',
              activeItem?.color === 'text-info' ? 'bg-info/10 dark:bg-info/20' : '',
              activeItem?.color === 'text-warning' ? 'bg-warning/10 dark:bg-warning/20' : '',
              activeItem?.color === 'text-error' ? 'bg-error/10 dark:bg-error/20' : '',
              activeItem?.color === 'text-success' ? 'bg-success/10 dark:bg-success/20' : '',
            ]"
          >
            <UIcon
              :name="activeItem?.icon || 'i-lucide-sparkles'"
              class="w-10 h-10 transition-colors duration-300"
              :class="activeItem?.color || 'text-primary'"
            />
          </div>

          <h3 class="text-2xl md:text-3xl font-bold mb-3">
            {{ activeItem?.title }}
          </h3>

          <p class="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg">
            {{ activeItem?.description }}
          </p>
        </div>
      </div>

      <div class="relative px-4 pb-16 max-w-2xl mx-auto">
        <div class="flex justify-center gap-2 flex-wrap">
          <button
            v-for="(item, index) in items"
            :key="item.id"
            class="group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              index === activeIndex
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            ]"
            @click="selectItem(index)"
          >
            <span class="flex items-center gap-2">
              <UIcon :name="item.icon" class="w-4 h-4" />
              <span class="hidden sm:inline">{{ item.title }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="absolute -inset-4 -z-10 blur-3xl opacity-20">
      <div
        class="absolute inset-0 rounded-full transition-all duration-1000"
        :class="[
          activeItem?.color === 'text-primary' ? 'bg-primary' : '',
          activeItem?.color === 'text-info' ? 'bg-info' : '',
          activeItem?.color === 'text-warning' ? 'bg-warning' : '',
          activeItem?.color === 'text-error' ? 'bg-error' : '',
          activeItem?.color === 'text-success' ? 'bg-success' : '',
        ]"
      />
    </div>
  </div>
</template>
