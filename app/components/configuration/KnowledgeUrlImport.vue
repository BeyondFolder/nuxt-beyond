<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const schemaUrl = z.object({
  url: z.url('Please enter a valid URL.').optional(),
});

type Schema = z.output<typeof schemaUrl>;

const { handleError, showSuccess } = useErrorHandling();

const stateUrl = ref<Schema>({
  url: '',
});

const isLoadingUrl = ref(false);

async function uploadUrl(_event: FormSubmitEvent<Schema>) {
  if (!stateUrl.value.url?.trim()) {
    return;
  }

  try {
    isLoadingUrl.value = true;

    await $fetch(`/api/projects/${props.projectId}/knowledge/url`, {
      method: 'PUT',
      body: {
        url: stateUrl.value.url.trim(),
      },
    });

    stateUrl.value.url = '';

    await refreshNuxtData('api/dashboard');
    await refreshNuxtData(`api/projects/${props.projectId}/knowledge`);
    showSuccess('Content imported successfully');
  } catch (error: any) {
    handleError(error, 'Failed to import content from URL');
  } finally {
    isLoadingUrl.value = false;
  }
}
</script>

<template>
  <UPageCard :ui="{ header: 'mb-0' }">
    <template #header>
      <h3 class="font-semibold">Import from Web Page</h3>
    </template>

    <UForm :schema="schemaUrl" :state="stateUrl" class="space-y-4" @submit="uploadUrl">
      <p class="text-sm text-primary">
        Enter a URL from your website to automatically extract content from pages like FAQs, documentation, product
        guides, or support articles.
      </p>

      <UFormField name="url">
        <template #label />

        <UInput v-model="stateUrl.url" type="url" placeholder="https://example.com/help/faq" class="w-full" />
      </UFormField>

      <div v-if="stateUrl.url && stateUrl.url.length > 0" class="flex justify-end">
        <UButton type="submit" :loading="isLoadingUrl" :disabled="!stateUrl.url.trim()" icon="i-lucide-globe">
          Import Content
        </UButton>
      </div>
    </UForm>
  </UPageCard>
</template>
