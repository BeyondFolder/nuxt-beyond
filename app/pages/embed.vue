<script setup lang="ts">
import type { ProjectConfiguration } from '#shared/types';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

definePageMeta({
  layout: false,
});

// Embedded chat widget (iframe), not content: noindex (sitemap exclusion lives in nuxt.config.ts).
useRobotsRule(false);

defineRouteRules({
  prerender: false,
});

const route = useRoute();

const projectId = computed(() => (route.query.projectId as string) || '');

const { data: project, error, pending } = await useFetch(`/api/embed/${projectId.value}` as '/api/embed/:id');

const config = computed(() => (project.value?.configuration as ProjectConfiguration) || {});

const primaryColor = computed(() => config.value?.appearance?.primaryColor || THEME_PRIMARY_COLOR);
const initialQuestions = computed(() => config.value?.chat?.initialQuestions || []);

const headerLogo = ref('');

const headerText = computed(() => project.value?.name || 'Chat with us');

onMounted(() => {
  if (!error.value) {
    const root = document.documentElement;
    root.style.setProperty('--ui-primary', primaryColor.value);

    const origin = window.location.origin;
    if (config.value?.appearance?.logo && project.value?.id) {
      headerLogo.value = `${origin}/projects/${project.value.id}/logo`;
    } else {
      headerLogo.value = `${origin}/images/logo.png`;
    }
  }
});
</script>

<template>
  <div class="w-full h-dvh flex flex-col overflow-hidden">
    <div v-if="!pending && error" class="w-full h-dvh flex items-center justify-center p-4">
      <div class="text-center">
        <UIcon name="i-lucide-shield-alert" class="w-12 h-12 text-error mx-auto mb-4" />
        <h2 class="text-lg font-semibold mb-2">Access Denied</h2>
        <p class="text-sm text-neutral">{{ (error.data as { statusMessage?: string } | undefined)?.statusMessage || error.message || 'Failed to load project' }}</p>
      </div>
    </div>
    <template v-else-if="!pending">
      <UCard
        variant="subtle"
        class="w-full h-full flex flex-col rounded-none overflow-hidden shadow-lg"
        :ui="{
          root: 'ring-0',
          body: 'flex-1 overflow-y-auto overflow-x-hidden p-0 flex flex-col shadow-inner',
          header: 'sm:p-0 p-0',
          footer: 'p-0',
        }"
      >
        <template #header>
          <div
            class="flex items-center justify-between px-4 py-1 rounded-t-xl"
            :style="{ backgroundColor: primaryColor }"
          >
            <div class="flex items-center gap-2 py-2">
              <p class="font-semibold text-sm text-white">{{ headerText }}</p>
            </div>
          </div>
        </template>

        <EmbedInitialChat
          v-if="project"
          :initial-questions="initialQuestions"
          :logo-url="headerLogo"
          :project-name="headerText"
          :project-id="projectId"
          :project="project"
        />

        <div class="text-center mb-4">
          <ULink
            to="https://nuxtbeyond.com"
            target="_blank"
            class="text-sm italic text-black/50 hover:text-black/70 no-underline"
          >
            Powered by
            <p class="font-semibold inline">NuxtBeyond</p>
          </ULink>
        </div>
      </UCard>
    </template>
  </div>
</template>
