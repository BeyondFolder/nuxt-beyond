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
  toast.add({
    title: 'Demo Mode',
    description: 'Team invitations are disabled in demo mode.',
    color: 'info',
  });
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
