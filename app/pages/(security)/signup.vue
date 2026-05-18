<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
  middleware: ['not-authenticated'],
});

useSeoMeta({
  title: 'Sign up',
  description: 'Create an account to get started',
});

const toast = useToast();
const route = useRoute();

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
    required: true,
  },
  {
    name: 'acceptTerms',
    type: 'checkbox' as const,
    label: 'I agree to the Terms of Service and Privacy Policy',
    required: true,
  },
];

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
      const redirect = route.query.redirect as string;
      const authUrl = redirect ? `/auth/google?redirect=${encodeURIComponent(redirect)}` : '/auth/google';
      navigateTo(authUrl, { external: true });
    },
  },
];

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Invalid password').min(8, 'Must be at least 8 characters'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
});

type Schema = z.output<typeof schema>;

const isLoading = ref(false);
const turnstileToken = ref('');

const loginLink = computed(() => {
  const redirect = route.query.redirect as string;
  return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
});

function onSubmit(payload: FormSubmitEvent<Schema>) {
  isLoading.value = true;

  $fetch('/api/security/register', {
    method: 'POST',
    body: { ...payload.data, turnstileToken: turnstileToken.value },
  })
    .then((response: { email: string }) => {
      toast.add({
        title: `We've sent a verification link to ${response.email}`,
        description: 'Please check your email for confirmation.',
        color: 'success',
      });

      const redirect = route.query.redirect as string;
      const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
      navigateTo(loginUrl);

      if (typeof (window as any).datafast === 'function') {
        (window as any).datafast("signup", {
          email: response.email,
        });
      }
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
    :providers="providers"
    title="Create an account"
    icon="i-lucide-lock"
    :submit="{ label: 'Create account', loading: isLoading, disabled: !turnstileToken }"
    @submit="onSubmit"
  >
    <template #description>
      Already have an account? <ULink :to="loginLink" class="text-primary font-medium">Login</ULink>.
    </template>

    <template #footer>
      <NuxtTurnstile v-model="turnstileToken" />
    </template>

    <template #validation>
      <p class="text-xs text-muted mt-2">
        By creating an account, you agree to our
        <ULink to="/terms-of-service" class="text-primary font-medium">Terms of Service</ULink>
        and
        <ULink to="/privacy-policy" class="text-primary font-medium">Privacy Policy</ULink>.
      </p>
    </template>
  </UAuthForm>
</template>
