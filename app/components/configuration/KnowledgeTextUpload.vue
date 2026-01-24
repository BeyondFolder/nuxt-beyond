<script setup lang="ts">
import { z } from 'zod';

interface Props {
  projectId: string;
  maxTextLength: number;
}

const props = defineProps<Props>();

const schemaKnowledgeText = z.object({
  knowledgeText: z
    .string()
    .max(props.maxTextLength, `Text must be ${props.maxTextLength.toLocaleString()} characters or less`),
});

type Schema = z.output<typeof schemaKnowledgeText>;

const toast = useToast();

const stateKnowledgeText = ref<Schema>({
  knowledgeText: '',
});

const isLoading = ref(false);

async function uploadKnowledgeText() {
  toast.add({
    title: 'Demo Mode',
    description: 'Text uploads are disabled in demo mode.',
    color: 'info',
  });
}
</script>

<template>
  <UPageCard :ui="{ header: 'mb-0' }">
    <template #header>
      <h3 class="font-semibold">Add Text Content</h3>
    </template>

    <UForm :schema="schemaKnowledgeText" :state="stateKnowledgeText" class="space-y-4">
      <p class="text-sm text-primary">
        Paste your FAQs, documentation, product information, or any other text that should help guide the project's
        responses.
      </p>

      <UFormField name="knowledgeText">
        <template #label />

        <template #hint>
          <span class="text-sm text-neutral">
            {{ stateKnowledgeText.knowledgeText.length.toLocaleString() }}/{{ maxTextLength.toLocaleString() }}
            characters
          </span>
        </template>

        <UTextarea
          v-model="stateKnowledgeText.knowledgeText"
          placeholder="Paste your content here... (e.g., frequently asked questions, product documentation, company policies, etc.)"
          :rows="12"
          :maxlength="maxTextLength"
          class="w-full"
          disabled
        />
      </UFormField>

      <div v-if="stateKnowledgeText.knowledgeText.length > 0" class="flex justify-end">
        <UButton
          :loading="isLoading"
          :disabled="!stateKnowledgeText.knowledgeText.trim()"
          icon="i-lucide-upload"
          @click="uploadKnowledgeText"
        >
          Upload Content
        </UButton>
      </div>
    </UForm>
  </UPageCard>
</template>
