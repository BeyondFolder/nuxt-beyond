<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
  middleware: ['not-authenticated'],
});

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue',
});

const toast = useToast();
const route = useRoute();

const turnstile = ref();
const turnstileToken = ref('');
const showDemoModal = ref(false);

onMounted(() => {
  const error = route.query.error;
  if (error === 'different_provider') {
    toast.add({
      title: 'This email is already registered with a different provider.',
      color: 'error',
    });
  } else if (error === 'oauth_failed') {
    toast.add({
      title: 'Authentication failed. Please try again.',
      color: 'error',
    });
  } else if (error === 'verification_expired') {
    toast.add({
      title: 'Verification link expired. A new verification email has been sent.',
      color: 'warning',
    });
  } else if (error === 'verification_invalid') {
    toast.add({
      title: 'Invalid verification token',
      color: 'error',
    });
  } else if (error === 'verification_error') {
    toast.add({
      title: 'Link expired and failed to send new verification email. Please try again.',
      color: 'warning',
    });
  }

  const verified = route.query.verified;
  if (verified === 'true') {
    toast.add({
      title: 'Email verified successfully. You can now login.',
      color: 'success',
    });
  }

  if (error || verified) {
    navigateTo('/login', { replace: true });
  }
});

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
];

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
      toast.add({
        title: 'Demo Mode',
        description: 'Google OAuth is disabled in demo mode. Please use the demo accounts below.',
        color: 'info',
      });
    },
  },
];

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

const isLoading = ref(false);
const authForm = useTemplateRef('authForm')

const { fetch: refreshSession } = useUserSession();

const signupLink = computed(() => {
  const redirect = route.query.redirect as string;
  return redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';
});

function handleUseAccount(credentials: { email: string; password: string }) {
  console.log('credentials', credentials);

  authForm.value.state.email = credentials.email;
  authForm.value.state.password = credentials.password;
}

function onSubmit(payload: FormSubmitEvent<Schema>) {
  isLoading.value = true;

  $fetch('/api/security/login', {
    method: 'POST',
    body: { ...payload.data, turnstileToken: turnstileToken.value },
  })
    .then(async () => {
      await refreshSession();
      const redirect = route.query.redirect as string;
      if (redirect) {
        window.location.href = redirect;
      } else {
        await navigateTo('/dashboard');
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
      turnstile.value?.reset();
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
      description="This is a demo environment. Use the demo accounts below to explore NuxtBeyond features."
    />

    <UAuthForm
      ref="authForm"
      :fields="fields"
      :schema="schema"
      :providers="providers"
      title="Login"
      icon="i-lucide-unlock"
      :submit="{ label: 'Login', loading: isLoading, disabled: !turnstileToken }"
      @submit="onSubmit"
    >
      <template #description>
        Don't have an account? <ULink :to="signupLink" class="text-primary font-medium">Sign up</ULink>.
      </template>

      <template #password-hint>
        <ULink to="/forgot-password" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
      </template>

      <template #footer>
        <NuxtTurnstile ref="turnstile" v-model="turnstileToken" />
      </template>
    </UAuthForm>

    <div class="text-center">
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-user"
        @click="showDemoModal = true"
        type="button"
      >
        View Demo Accounts
      </UButton>
    </div>

    <DemoAccountsModal v-model="showDemoModal" @use-account="handleUseAccount" />
  </div>
</template>
