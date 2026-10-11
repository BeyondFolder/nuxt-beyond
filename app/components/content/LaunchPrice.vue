<script setup lang="ts">
const { data: launchPrice } = await useAsyncData('launch-price', () => queryCollection('index').first(), {
  transform: (page) => {
    const highlightedPlan = page?.pricing.plans.find((plan) => plan.highlight);
    return highlightedPlan?.discount || highlightedPlan?.price;
  },
});
</script>

<template>
  <span>{{ launchPrice }}</span>
</template>
