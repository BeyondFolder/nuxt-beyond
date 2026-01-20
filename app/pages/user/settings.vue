<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

useSeoMeta({
  title: 'Change Password',
  description: 'Update your account password',
});

defineRouteRules({
  prerender: false,
});

const toast = useToast();
const router = useRouter();
const { user } = useUserSession();

// Check if user uses credentials provider (has password)
if (user.value?.provider !== 'credentials') {
  router.push('/dashboard');
}

const fields = [
  {
    name: 'currentPassword',
    label: 'Current Password',
    type: 'password' as const,
    placeholder: 'Enter your current password',
    required: true,
  },
  {
    name: 'newPassword',
    label: 'New Password',
    type: 'password' as const,
    placeholder: 'Enter your new password',
    required: true,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm New Password',
    type: 'password' as const,
    placeholder: 'Confirm your new password',
    required: true,
  },
];

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type Schema = z.output<typeof schema>;

const isLoading = ref(false);

function onSubmit(payload: FormSubmitEvent<Schema>) {
  isLoading.value = true;

  $fetch('/api/security/change-password', {
    method: 'POST',
    body: {
      currentPassword: payload.data.currentPassword,
      newPassword: payload.data.newPassword,
    },
  })
    .then(() => {
      toast.add({
        title: 'Password changed successfully',
        description: 'Your password has been updated',
        color: 'success',
      });

      // Reset form
      payload.data.currentPassword = '';
      payload.data.newPassword = '';
      payload.data.confirmPassword = '';
    })
    .catch((e) => {
      toast.add({
        title: e.data.message || 'Something went wrong',
        color: 'error',
      });
    })
    .finally(() => {
      isLoading.value = false;
    });
}
</script>

<template>
  <UDashboardPanel id="user-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="User Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 w-full lg:max-w-xl mx-auto">
        <UPageCard variant="subtle">
          <UFormField name="email" label="Email" class="flex max-sm:flex-col justify-between items-center">
            <UInput
              :default-value="user?.email"
              type="email"
              autocomplete="off"
              disabled
              class="w-75"
              variant="subtle"
            />
          </UFormField>
        </UPageCard>
        <UPageCard variant="subtle">
          <UAuthForm
            :fields="fields"
            :schema="schema"
            title="Change Password"
            icon="i-lucide-shield"
            :submit="{ label: 'Change Password', loading: isLoading }"
            @submit="onSubmit"
          />
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
