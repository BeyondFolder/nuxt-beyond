<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const router = useRouter();
const toast = useToast();

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });
const projectId = computed(() => dashboardData.value?.currentProject?.id);

const { data: membersData } = await useFetch(
  () => `/api/projects/${projectId.value}/members`,
  {
    key: `members-${projectId.value}`,
    watch: [projectId],
  }
);

const isAdmin = computed(() => membersData.value?.currentUserRole === 'admin');

if (!isAdmin.value) {
  router.push('/dashboard/members');
}

const inviteEmail = ref('');
const inviteRole = ref<'admin' | 'member'>('member');
const inviteLoading = ref(false);

async function handleInvite() {
  if (!projectId.value || !inviteEmail.value) {
    return;
  }

  inviteLoading.value = true;

  try {
    await $fetch(`/api/projects/${projectId.value}/members/invite`, {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        role: inviteRole.value,
      },
    });

    toast.add({
      title: 'Invitation sent',
      description: `An invitation has been sent to ${inviteEmail.value}`,
      color: 'success',
    });

    await refreshNuxtData(`api/projects/${projectId.value}/members`);

    await router.push('/dashboard/members');
  } catch (error: any) {
    toast.add({
      title: 'Failed to send invitation',
      description: error.data?.message || 'An error occurred',
      color: 'error',
    });
  } finally {
    inviteLoading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="invite-member">
    <template #header>
      <UDashboardNavbar title="Invite Member">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/dashboard/members"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Send Invitation</h2>
            <p class="text-sm text-neutral mt-1">Invite a new member to join this project</p>
          </template>

          <UForm @submit="handleInvite">
            <div class="space-y-4">
              <UFormField label="Email Address" name="email" required>
                <UInput
                  v-model="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  required
                  size="lg"
                />
              </UFormField>

              <UFormField label="Role" name="role" required>
                <USelect
                  v-model="inviteRole"
                  class="w-50"
                  :items="[
                    { value: 'member', label: 'Member', description: 'Can view and use project features' },
                    { value: 'admin', label: 'Admin', description: 'Full access including settings and billing' },
                  ]"
                />
              </UFormField>

              <UAlert color="info" variant="solid" icon="i-lucide-info">
                <template #description>
                  An invitation email will be sent to this address. The recipient will have 7 days to accept the invitation.
                </template>
              </UAlert>

              <div class="flex justify-end gap-2 pt-4">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="ghost"
                  to="/dashboard/members"
                />
                <UButton
                  type="submit"
                  label="Send Invitation"
                  color="primary"
                  :loading="inviteLoading"
                  icon="i-lucide-send"
                />
              </div>
            </div>
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
