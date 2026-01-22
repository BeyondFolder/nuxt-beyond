<script setup lang="ts">
const nuxtApp = useNuxtApp();
const { activeHeadings, updateHeadings } = useScrollspy();

const items = computed(() => [
  {
    label: 'Features',
    to: '/#features',
    active: activeHeadings.value.includes('features') && !activeHeadings.value.includes('pricing'),
  },
  {
    label: 'Pricing',
    to: '/#pricing',
    active: activeHeadings.value.includes('pricing') && !activeHeadings.value.includes('testimonials'),
  },
  {
    label: 'Testimonials',
    to: '/#testimonials',
    active: activeHeadings.value.includes('testimonials') && !activeHeadings.value.includes('faqs'),
  },
  {
    label: 'FAQs',
    to: '/#faqs',
    active: activeHeadings.value.includes('faqs'),
  },
]);

nuxtApp.hooks.hookOnce('page:finish', () => {
  updateHeadings(
    [
      document.querySelector('#features'),
      document.querySelector('#pricing'),
      document.querySelector('#faqs'),
      document.querySelector('#testimonials'),
    ].filter(Boolean) as Element[]
  );
});

const { loggedIn } = useUserSession();
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/" class="inline-flex items-center gap-2">
        <img src="~/assets/images/logo-without-background.png" alt="NuxtBeyond" class="w-auto h-8 shrink-0">
        <span class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">NuxtBeyond</span>
      </NuxtLink>
    </template>

    <UNavigationMenu :items="items" variant="link" class="hidden lg:block" />

    <template #right>
      <UColorModeButton />

      <template v-if="loggedIn">
        <UButton label="Dashboard" class="inline-flex" to="/dashboard" />
      </template>
      <template v-else>
        <UButton
          label="Try Demo"
          icon="i-lucide-log-in"
          color="neutral"
          variant="outline"
          to="/login"
          class="lg:hidden"
        />

        <UButton
          label="Try Demo"
          icon="i-lucide-user"
          color="neutral"
          variant="outline"
          to="/login"
          class="hidden lg:inline-flex"
        />

        <UButton label="Buy Now" icon="i-lucide-arrow-right" class="hidden lg:inline-flex" to="#pricing" />
      </template>
    </template>

    <!-- For Mobile -->
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
