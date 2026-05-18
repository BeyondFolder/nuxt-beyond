<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
  middleware: ['not-authenticated'],
});

useSeoMeta({
  title: 'Forgot Password',
  description: 'Reset your password',
});

const toast = useToast();
const router = useRouter();

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
];

const schema = z.object({
  email: z.email('Invalid email'),
});

type Schema = z.output<typeof schema>;

const isLoading = ref(false);
const turnstileToken = ref('');

function onSubmit(payload: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Demo Mode',
    description: 'Password reset is disabled in demo mode. Please use the demo accounts to explore.',
    color: 'info',
  });
}
</script>

<template>
  <div class="space-y-4">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Demo Mode"
      description="Password reset is disabled in this demo. Use the demo accounts on the login page to explore NuxtBeyond."
    />

    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Forgot Password"
      icon="i-lucide-key"
      :submit="{ label: 'Send Reset Email', loading: isLoading, disabled: !turnstileToken }"
      @submit="onSubmit"
    >
    <template #description> Enter your email address and we'll send you a link to reset your password. </template>

    <template #footer>
      <div class="text-center">
        <ULink to="/login" class="text-primary font-medium">Back to Login</ULink>
      </div>

      <NuxtTurnstile v-model="turnstileToken" class="mt-4" />
    </template>
    </UAuthForm>
  </div>
</template>
