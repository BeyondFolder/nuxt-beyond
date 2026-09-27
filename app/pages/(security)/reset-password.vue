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
  title: 'Reset Password',
  description: 'Set your new password',
});

defineRouteRules({
  prerender: false,
});

const toast = useToast();
const route = useRoute();

const token = route.query.token as string;

if (!token) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid reset link',
  });
}

const fields = [
  {
    name: 'password',
    label: 'New Password',
    type: 'password' as const,
    placeholder: 'Enter your new password',
    required: true,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password' as const,
    placeholder: 'Confirm your new password',
    required: true,
  },
];

const schema = z
  .object({
    password: z.string('Invalid password').min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string('Invalid confirm password').min(8, 'Must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Schema = z.output<typeof schema>;

const isLoading = ref(false);
const turnstileToken = ref('');

function onSubmit(_payload: FormSubmitEvent<Schema>) {
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
      title="Reset Password"
      icon="i-lucide-lock"
      :submit="{ label: 'Reset Password', loading: isLoading, disabled: !turnstileToken }"
      @submit="onSubmit"
    >
    <template #description>Enter your new password below.</template>

    <template #footer>
      <div class="text-center">
        <ULink to="/login" class="text-primary font-medium">Back to Login</ULink>
      </div>

      <NuxtTurnstile v-model="turnstileToken" class="mt-4" />
    </template>
    </UAuthForm>
  </div>
</template>
