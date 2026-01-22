<script setup lang="ts">
const props = defineProps<{
  currentPrice: number
  originalPrice: number
  salesCount: number
  priceIncrement: number
  salesPerIncrement: number
}>();

const progress = computed(() => {
  return (props.salesCount % props.salesPerIncrement) / props.salesPerIncrement * 100;
});

const salesInCurrentTier = computed(() => {
  return props.salesCount % props.salesPerIncrement;
});

const nextPrice = computed(() => {
  return props.currentPrice + props.priceIncrement;
});
</script>

<template>
  <div class="w-full max-w-3xl mx-auto mb-12">
    <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
      <div class="text-center mb-4">
        <div class="flex items-center justify-center gap-2 mb-2">
          <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
            Limited Time Pricing
          </span>
        </div>
        <p class="text-2xl font-bold text-primary-900 dark:text-primary-100">
          ${{ currentPrice }}
          <span class="text-sm font-normal text-primary-600 dark:text-primary-400 line-through ml-2">
            ${{ originalPrice }}
          </span>
        </p>
        <p class="text-sm text-primary-600 dark:text-primary-400 mt-1">
          Price increases by ${{ priceIncrement }} every {{ salesPerIncrement }} sales
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between text-sm text-primary-700 dark:text-primary-300">
          <span>{{ salesInCurrentTier }} / {{ salesPerIncrement }} sold at this price</span>
          <span>Next price: ${{ nextPrice }}</span>
        </div>
        <div class="w-full bg-primary-200 dark:bg-primary-800 rounded-full h-3 overflow-hidden">
          <div
            class="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-500 ease-out rounded-full"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
