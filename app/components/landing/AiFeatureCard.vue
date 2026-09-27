<script setup lang="ts">
interface AiFeatureCategory {
  title: string
  description: string
  icon: string
  color?: string
  features: string[]
}

defineProps<{
  category: AiFeatureCategory
}>()

const colorClasses: Record<string, { bg: string; border: string; icon: string }> = {
  primary: {
    bg: 'bg-primary/5 dark:bg-primary/10',
    border: 'border-primary/20 hover:border-primary/40',
    icon: 'text-primary',
  },
  info: {
    bg: 'bg-info/5 dark:bg-info/10',
    border: 'border-info/20 hover:border-info/40',
    icon: 'text-info',
  },
  warning: {
    bg: 'bg-warning/5 dark:bg-warning/10',
    border: 'border-warning/20 hover:border-warning/40',
    icon: 'text-warning',
  },
  error: {
    bg: 'bg-error/5 dark:bg-error/10',
    border: 'border-error/20 hover:border-error/40',
    icon: 'text-error',
  },
  success: {
    bg: 'bg-success/5 dark:bg-success/10',
    border: 'border-success/20 hover:border-success/40',
    icon: 'text-success',
  },
  neutral: {
    bg: 'bg-neutral/5 dark:bg-neutral/10',
    border: 'border-neutral/20 hover:border-neutral/40',
    icon: 'text-neutral',
  },
}

function getColorClasses(color?: string) {
  return colorClasses[color || 'primary'] ?? colorClasses.primary!
}
</script>

<template>
  <div
    class="group relative rounded-xl border p-6 transition-all duration-300"
    :class="[getColorClasses(category.color).bg, getColorClasses(category.color).border]"
  >
    <div class="flex items-start gap-4 mb-4">
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        :class="getColorClasses(category.color).bg"
      >
        <UIcon
          :name="category.icon"
          class="w-6 h-6"
          :class="getColorClasses(category.color).icon"
        />
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-1">
          {{ category.title }}
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          {{ category.description }}
        </p>
      </div>
    </div>

    <ul class="space-y-2">
      <li
        v-for="feature in category.features"
        :key="feature"
        class="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
      >
        <UIcon
          name="i-lucide-check"
          class="w-4 h-4 mt-0.5 shrink-0"
          :class="getColorClasses(category.color).icon"
        />
        <span>{{ feature }}</span>
      </li>
    </ul>
  </div>
</template>
