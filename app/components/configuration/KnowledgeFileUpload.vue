<script setup lang="ts">
import { z } from 'zod';
import type { FormErrorEvent, FormSubmitEvent } from '@nuxt/ui';
import { ALLOWED_FILE_TYPES } from '#shared/constants';
import { formatBytesToMB } from '#shared/utils';

interface Props {
  projectId: string;
  maxFileSize: number;
  maxNbOfFiles: number;
}

const props = defineProps<Props>();

const schema = z.object({
  files: z
    .array(
      z
        .instanceof(File, {
          message: 'Please select a file.',
        })
        .refine((file) => file.size <= props.maxFileSize, {
          message: `A file is too large. Please only upload files smaller than ${formatBytesToMB(props.maxFileSize)}.`,
        })
        .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
          message: 'Please only upload valid files (PDF, Word, CSV, ODT, or text).',
        })
    )
    .max(
      props.maxNbOfFiles,
      `You can only upload a maximum of ${props.maxNbOfFiles} file(s). Please remove some files and try again.`
    ),
});

type Schema = z.output<typeof schema>;

const state = ref<Schema>({
  files: [],
});

const isLoading = ref(false);
const fileUploadError = ref<FormErrorEvent | null>(null);

const toast = useToast();

async function uploadFiles(_event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Demo Mode',
    description: 'File uploads are disabled in demo mode.',
    color: 'info',
  });
}
</script>

<template>
  <UPageCard :ui="{ header: 'mb-0' }">
    <template #header>
      <h3 class="font-semibold">Upload Files</h3>
    </template>

    <UForm class="space-y-4" :schema="schema" :state="state" @submit="uploadFiles" @error="fileUploadError = $event">
      <p class="text-sm text-primary">
        Upload documents in PDF, Word, CSV, ODT or text format. You can add a maximum of {{ maxNbOfFiles }} file(s)
      </p>

      <UFileUpload
        v-model="state.files"
        multiple
        :accept="ALLOWED_FILE_TYPES.join(',')"
        label="Click or drag and drop to upload files"
        :description="`Each file must be smaller than ${formatBytesToMB(maxFileSize)}`"
        icon="i-lucide-files"
        color="primary"
        highlight
        variant="area"
        size="lg"
        layout="list"
        position="outside"
        class="w-full cursor-pointer"
        disabled
        @change="fileUploadError = null"
      />

      <div v-if="state.files.length > 0" class="flex justify-end">
        <UButton type="submit" :loading="isLoading" :disabled="!!fileUploadError" icon="i-lucide-upload">
          Upload {{ state.files.length }} File{{ state.files.length === 1 ? '' : 's' }}
        </UButton>
      </div>

      <UAlert
        v-if="fileUploadError"
        color="error"
        variant="subtle"
        :title="fileUploadError?.errors?.[0]?.message"
        class="mt-2"
      />
      <UAlert v-if="fileUploadError?.errors?.[0]?.name === 'files'" color="warning" variant="subtle" class="mt-2">
        <template #title>
          If you want to upload more files,
          <ULink to="/dashboard/billing"> you can upgrade your plan here</ULink>
        </template>
      </UAlert>
    </UForm>
  </UPageCard>
</template>
