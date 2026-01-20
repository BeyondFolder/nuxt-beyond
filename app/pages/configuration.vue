<script setup lang="ts">
import type { ProjectConfiguration } from '#shared/types';

definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const route = useRoute();

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const isCreateMode = computed(() => {
  return !dashboardData.value?.currentProject || route.query.create === 'true';
});

const hasFiles = computed(() => {
  const config = dashboardData.value?.currentProject?.configuration as ProjectConfiguration;

  return (config?.fileCount || 0) > 0 && !!config?.requestProcessingAt;
});

const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

const steps = [
  {
    id: 1,
    label: 'Basic Setup',
    description: 'Project name and description',
    icon: 'i-lucide-settings',
    path: '/configuration/basic',
    adminOnly: true,
  },
  {
    id: 2,
    label: 'Knowledge Base',
    description: 'Upload documents or add text',
    icon: 'i-lucide-book-open',
    path: '/configuration/knowledge',
    adminOnly: false,
  },
  {
    id: 3,
    label: 'Project Customization',
    description: 'Customize & test your project',
    icon: 'i-lucide-shield-check',
    path: '/configuration/customization',
    adminOnly: true,
  },
];

const stepsWithEnabled = computed(() => {
  const hasCurrentProject = !!dashboardData.value?.currentProject;

  return steps.map((step) => {
    const baseEnabled =
      step.id === 1 ||
      (step.id === 2 && hasCurrentProject && !isCreateMode.value) ||
      (step.id === 3 && hasCurrentProject && !isCreateMode.value && hasFiles.value);

    const enabled = step.adminOnly ? baseEnabled && isAdmin.value : baseEnabled;

    return {
      ...step,
      enabled,
    };
  });
});

const currentStep = computed(() => {
  return stepsWithEnabled.value.find((step) => route.path === step.path) || stepsWithEnabled.value[0];
});
</script>

<template>
  <UDashboardPanel id="configuration" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Configuration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold">Project Setup</h1>
          <p class="text-primary mt-1">Let's get your project configured in just a few steps.</p>
        </div>

        <div class="grid gap-2 md:gap-4 grid-cols-3 mb-6">
          <UCard
            v-for="(step, index) in stepsWithEnabled"
            :key="step.id"
            as="div"
            :class="['relative transition-all', !step.enabled && 'opacity-50']"
            :ui="{
              body: 'p-4',
              ...(currentStep?.id === step.id
                ? {
                    ring: 'ring-2 ring-primary',
                    background: 'bg-primary-50 dark:bg-primary-950',
                  }
                : {}),
            }"
          >
            <NuxtLink
              :to="!isCreateMode && step.enabled ? step.path : undefined"
              class="flex flex-col items-center text-center"
              :class="{
                'pointer-events-none cursor-not-allowed': !step.enabled,
              }"
            >
              <UBadge
                :label="(index + 1).toString()"
                :color="currentStep?.id === step.id ? 'primary' : step.enabled ? 'neutral' : 'neutral'"
                variant="solid"
                :class="'mb-3 rounded-full' + (currentStep?.id !== step.id ? ' opacity-50' : '')"
              />

              <UIcon
                :name="step.icon"
                :class="[
                  'text-xl mb-3',
                  currentStep?.id === step.id ? 'text-primary' : step.enabled ? 'text-primary' : 'text-neutral',
                ]"
              />

              <div>
                <h3 class="font-semibold text-sm mb-1">
                  {{ step.label }}
                </h3>
                <p class="text-xs text-primary leading-tight">
                  {{ step.description }}
                </p>
              </div>
            </NuxtLink>
          </UCard>
        </div>

        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
