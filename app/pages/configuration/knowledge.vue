<script setup lang="ts">
import type { ProjectConfiguration } from '#shared/types';
import { PLANS_CONSTANTS } from '#shared/constants';

defineRouteRules({
  prerender: false,
});

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });
const { data: knowledgeFiles, refresh: refreshKnowledgeFiles } = await useFetch(
  () => `/api/projects/${dashboardData.value.currentProject.id}/knowledge`,
  { key: `api/projects/${dashboardData.value.currentProject.id}/knowledge` }
);

const { handleError, showSuccess } = useErrorHandling();

const maxTextLength = computed(() => PLANS_CONSTANTS[(dashboardData.value?.currentProject?.planName as keyof typeof PLANS_CONSTANTS) || 'free'].MAX_TEXT_LENGTH);
const maxFileSize = computed(() => PLANS_CONSTANTS[(dashboardData.value?.currentProject?.planName as keyof typeof PLANS_CONSTANTS) || 'free'].MAX_FILE_SIZE);
const maxNbOfFiles = computed(() => PLANS_CONSTANTS[(dashboardData.value?.currentProject?.planName as keyof typeof PLANS_CONSTANTS) || 'free'].MAX_NB_OF_FILES);

const canRequestProcessing = computed(() => {
  const configuration = (dashboardData.value.currentProject?.configuration as ProjectConfiguration) || {};

  return (
    configuration?.filesUpdatedAt &&
    (!configuration?.finishedProcessingAt ||
      new Date(configuration?.finishedProcessingAt) <= new Date(configuration?.filesUpdatedAt)) &&
        (!configuration?.requestProcessingAt || new Date(configuration?.requestProcessingAt) <= new Date(configuration?.filesUpdatedAt))
  );
});

const isFileLimitReached = computed(() => {
  const currentCount = knowledgeFiles.value?.totalCount || 0;
  const maxFiles = maxNbOfFiles.value;
  return currentCount >= maxFiles;
});

const isLoadingProcessing = ref(false);

watch(dashboardData, async () => {
  await refreshKnowledgeFiles();
});

async function requestProcessing() {
  if (!canRequestProcessing.value) {
    return;
  }

  try {
    isLoadingProcessing.value = true;

    await $fetch(`/api/projects/${dashboardData.value.currentProject.id}/knowledge/sync`, {
      method: 'POST',
    });

    await refreshNuxtData('api/dashboard');
    showSuccess('Processing requested successfully');
  } catch (error) {
    handleError(error, 'Failed to request processing. Please try again later.', null);
  } finally {
    isLoadingProcessing.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Knowledge Base</h2>
      <p class="text-primary">
        Add information that your project can reference when answering questions. You can paste text directly or upload
        documents.
      </p>
    </div>

    <div class="space-y-6">
      <div v-if="!canRequestProcessing" class="flex justify-between items-center">
        <UButton variant="ghost" color="neutral" to="/configuration/basic">
          <UIcon name="i-lucide-arrow-left" />
          Back to Basic Setup
        </UButton>

        <UButton
          to="/configuration/customization"
          :disabled="!knowledgeFiles?.totalCount || knowledgeFiles.totalCount === 0"
          trailing-icon="i-lucide-arrow-right"
        >
          Continue to Project Customization
        </UButton>
      </div>

      <ConfigurationKnowledgeFiles
        v-if="(knowledgeFiles?.files?.length || 0) > 0"
        :knowledge-files="knowledgeFiles"
        :max-nb-of-files="maxNbOfFiles"
        :project-id="dashboardData.currentProject.id"
        :can-request-processing="canRequestProcessing"
        :is-loading-processing="isLoadingProcessing"
        @request-processing="requestProcessing"
      />

      <UAlert v-if="isFileLimitReached" color="error" variant="subtle" title="File Upload Limit Reached" class="mt-4">
        <template #description>
          You've reached the maximum limit of {{ maxNbOfFiles }} file(s) for your current plan.
          <ULink to="/dashboard/billing" class="font-semibold underline"> Upgrade your plan </ULink> to upload more
          files.
        </template>
      </UAlert>
      <template v-else>
        <ConfigurationKnowledgeUrlImport :project-id="dashboardData.currentProject.id" />

        <div class="relative">
          <USeparator />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="px-4 text-sm font-medium text-neutral bg-background"> OR </span>
          </div>
        </div>

        <ConfigurationKnowledgeFileUpload
          :project-id="dashboardData.currentProject.id"
          :max-file-size="maxFileSize"
          :max-nb-of-files="maxNbOfFiles"
        />

        <div class="relative">
          <USeparator />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="px-4 text-sm font-medium text-neutral bg-background"> OR </span>
          </div>
        </div>

        <ConfigurationKnowledgeTextUpload :project-id="dashboardData.currentProject.id" :max-text-length="maxTextLength" />
      </template>

      <UPageCard variant="naked">
        <div class="flex justify-between items-center">
          <UButton variant="ghost" color="neutral" to="/configuration/basic">
            <UIcon name="i-lucide-arrow-left" />
            Back to Basic Setup
          </UButton>

          <UButton
            to="/configuration/customization"
            :disabled="!knowledgeFiles?.totalCount || knowledgeFiles.totalCount === 0"
            trailing-icon="i-lucide-arrow-right"
            @click="requestProcessing"
          >
            Continue to Project Customization
          </UButton>
        </div>
      </UPageCard>
    </div>

    <UAlert
      color="primary"
      variant="subtle"
      title="💡 Knowledge Base Tips"
      description="The more relevant information you provide, the better your project can assist users. Include FAQs, documentation, policies, and any other information users commonly ask about."
      class="mt-6"
    />
  </div>
</template>
