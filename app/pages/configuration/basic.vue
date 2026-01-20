<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

defineRouteRules({
  prerender: false,
});

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(50, 'Project name must be 50 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

type Schema = z.output<typeof schema>;

const route = useRoute();
const { createProject, updateProject } = useProjectOperations();

const state = ref({
  name: '',
  description: '',
});
const isLoading = ref(false);

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

const isCreateMode = computed(() => {
  return !dashboardData.value?.currentProject || route.query.create === 'true';
});

const currentProject = computed(() => dashboardData.value?.currentProject);

if (!isAdmin.value && !isCreateMode.value) {
  navigateTo('/configuration/knowledge');
}

watch(
  [currentProject, isCreateMode],
  ([project, createMode]) => {
    if (!createMode && project) {
      state.value.name = project.name || '';
      state.value.description = project.description || '';
    } else if (createMode) {
      state.value.name = '';
      state.value.description = '';
    }
  },
  { immediate: true }
);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isLoading.value = true;

    const isCreateModeValue = isCreateMode.value;

    if (isCreateModeValue) {
      await createProject(event.data);
    } else {
      await updateProject(currentProject.value.id, event.data);
    }

    await refreshNuxtData('api/dashboard');
    await refreshNuxtData('api/projects');

    if (isCreateModeValue) {
      await navigateTo('/dashboard/billing');
    } else {
      await navigateTo('/configuration/knowledge');
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">
        {{ isCreateMode ? 'Basic Setup' : 'Edit Project' }}
      </h2>
      <p class="text-primary">
        {{
          isCreateMode
            ? 'Give your project a name and description to help users understand its purpose.'
            : "Update your project's name and description."
        }}
      </p>
    </div>

    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <UPageCard>
        <template #header>
          <h3 class="font-semibold">
            {{ isCreateMode ? 'Project Configuration' : 'Update Configuration' }}
          </h3>
        </template>

        <div class="space-y-6">
          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1 max-sm:w-full">
              <UFormField
                label="Project Name"
                name="name"
                required
                description="Choose a clear, descriptive name for your project"
              >
                <UInput
                  v-model="state.name"
                  placeholder="e.g., Your Business Customer Support Bot, Product Guide, FAQ Chatbot"
                  :maxlength="50"
                  class="w-full"
                />
                <template #hint>
                  <span class="text-sm text-neutral">{{ state.name.length }}/50 characters</span>
                </template>
              </UFormField>
            </div>
          </div>

          <USeparator />

          <div class="flex max-sm:flex-col justify-between items-start gap-4">
            <div class="flex-1 max-sm:w-full">
              <UFormField
                label="Description"
                name="description"
                description="This description helps guide the AI's behavior and responses. Be specific about what your project should help with."
              >
                <UTextarea
                  v-model="state.description"
                  placeholder="e.g., Help customers find answers to common questions about our products, pricing, and shipping policies. Focus on being helpful and directing users to relevant documentation."
                  :rows="5"
                  :maxlength="500"
                  class="w-full"
                />
                <template #hint>
                  <span class="text-sm text-neutral">{{ (state.description || '').length }}/500 characters</span>
                </template>
              </UFormField>
            </div>
          </div>
        </div>
      </UPageCard>
      <UPageCard variant="naked" class="mt-4">
        <div class="flex justify-between items-center">
          <UButton variant="ghost" color="neutral" to="/dashboard">Cancel</UButton>

          <UButton
            type="submit"
            :loading="isLoading"
            :disabled="!state.name.trim()"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ isCreateMode ? 'Create Project & Continue' : 'Update Project' }}
          </UButton>
        </div>
      </UPageCard>
    </UForm>

    <UAlert
      color="primary"
      variant="subtle"
      title="💡 Pro Tip"
      description="A good description helps the AI understand your project's purpose and provide better responses to your users."
      class="mt-6"
    />
  </div>
</template>
