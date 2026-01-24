<script setup lang="ts">
defineProps<{
  step: string
  title: string
  description: string
  code?: string
}>()
</script>

<template>
  <div class="relative">
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <div class="flex items-center gap-4 lg:w-1/3">
        <div class="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
          <span class="text-2xl font-bold text-primary">{{ step }}</span>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-1">{{ title }}</h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ description }}</p>
        </div>
      </div>

      <div v-if="code" class="lg:w-2/3 w-full">
        <LandingCodeBlock :code="code" :title="`Step ${step}`" />
      </div>
    </div>
  </div>
</template>
