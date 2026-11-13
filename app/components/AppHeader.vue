<script setup lang="ts">
import { GITHUB_REPO_URL } from '#shared/constants';

const nuxtApp = useNuxtApp();
const { activeHeadings, updateHeadings } = useScrollspy();

const items = computed(() => [
  {
    label: 'Features',
    to: '/#ai-features',
    active: activeHeadings.value.includes('ai-features') && !activeHeadings.value.includes('pricing'),
  },
  {
    label: 'Open Source',
    to: '/#pricing',
    active: activeHeadings.value.includes('pricing') && !activeHeadings.value.includes('faqs'),
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
      document.querySelector('#ai-features'),
      document.querySelector('#pricing'),
      document.querySelector('#faqs'),
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

      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        :to="GITHUB_REPO_URL"
        target="_blank"
        aria-label="NuxtBeyond on GitHub"
        :class="{ 'lg:hidden': !loggedIn }"
      />

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

        <UButton
          label="Star on GitHub"
          icon="i-simple-icons-github"
          :to="GITHUB_REPO_URL"
          target="_blank"
          class="hidden lg:inline-flex"
        />
      </template>
    </template>

    <!-- For Mobile -->
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
