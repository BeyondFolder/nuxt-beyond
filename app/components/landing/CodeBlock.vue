<script setup lang="ts">
const props = defineProps<{
  code: string
  title?: string
}>()

const lines = computed(() => {
  return props.code.trim().split('\n')
})
</script>

<template>
  <div class="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950">
    <div class="flex items-center gap-2 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
      <div class="flex gap-1.5">
        <div class="w-3 h-3 rounded-full bg-error/80" />
        <div class="w-3 h-3 rounded-full bg-warning/80" />
        <div class="w-3 h-3 rounded-full bg-success/80" />
      </div>
      <span v-if="title" class="text-xs text-neutral-500 ml-2">{{ title }}</span>
    </div>
    <div class="p-4 font-mono text-sm overflow-x-auto">
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="flex"
      >
        <span
          v-if="line.startsWith('#')"
          class="text-neutral-500"
        >{{ line }}</span>
        <template v-else>
          <span class="text-primary mr-2 select-none">$</span>
          <span class="text-neutral-100">{{ line }}</span>
        </template>
      </div>
    </div>
  </div>
</template>
