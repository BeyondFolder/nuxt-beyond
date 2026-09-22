<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
  middleware: ['not-authenticated'],
});

// App/auth page, not content: noindex (sitemap exclusion lives in nuxt.config.ts).
useRobotsRule(false);

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
  isLoading.value = true;

  $fetch('/api/security/forgot-password', {
    method: 'POST',
    body: { ...payload.data, turnstileToken: turnstileToken.value },
  })
    .then(() => {
      toast.add({
        title: 'Password reset email sent',
        description: 'Check your email for reset instructions',
        color: 'success',
      });

      router.push('/login');
    })
    .catch((e) => {
      toast.add({
        title: e.data.message,
        color: 'error',
      });
    })
    .finally(() => {
      isLoading.value = false;
    });
}
</script>

<template>
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
</template>
