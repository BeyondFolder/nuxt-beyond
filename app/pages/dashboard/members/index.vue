<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const toast = useToast();

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });
const projectId = computed(() => dashboardData.value?.currentProject?.id);

const { data: membersData } = await useFetch(
  () => `/api/projects/${projectId.value}/members`,
  {
    key: `api/projects/${projectId.value}/members`,
    watch: [projectId],
  }
);

const isAdmin = computed(() => membersData.value?.currentUserRole === 'admin');

const adminCount = computed(() => {
  return membersData.value?.members?.filter(m => m.role === 'admin').length || 0;
});

function canDeleteMember(member: any) {
  if (!isAdmin.value) {
    return false;
  }
  if (member.userId === membersData.value?.currentUserId && member.role === 'admin' && adminCount.value <= 1) {
    return false;
  }
  return true;
}

async function removeMember(_memberId: string) {
  toast.add({
    title: 'Demo Mode',
    description: 'Removing members is disabled in demo mode.',
    color: 'info',
  });
}

async function cancelInvitation(_invitationId: string) {
  toast.add({
    title: 'Demo Mode',
    description: 'Cancelling invitations is disabled in demo mode.',
    color: 'info',
  });
}

function getRoleColor(role: string) {
  return role === 'admin' ? 'primary' : 'neutral';
}

function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <UDashboardPanel id="members">
    <template #header>
      <UDashboardNavbar title="Members">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            v-if="isAdmin"
            label="Invite Member"
            icon="i-lucide-user-plus"
            color="primary"
            to="/dashboard/members/invite"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Team Members</h2>
              <UBadge variant="soft">{{ membersData?.members?.length || 0 }} member{{ (membersData?.members?.length || 0) === 1 ? '' : 's' }}</UBadge>
            </div>
          </template>

          <div class="divide-y divide-neutral">
            <div
              v-for="member in membersData?.members"
              :key="member.id"
              class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-3">
                <UAvatar :alt="member.email" size="md" />
                <div>
                  <p class="font-medium">{{ member.email }}</p>
                  <p class="text-sm text-neutral">Joined {{ formatDate(member.joinedAt) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <UBadge :color="getRoleColor(member.role)" variant="soft" class="capitalize">
                  {{ member.role }}
                </UBadge>
                <UButton
                  v-if="canDeleteMember(member)"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="removeMember(member.id)"
                />
              </div>
            </div>

            <div v-if="!membersData?.members || membersData.members.length === 0" class="py-12 text-center">
              <p class="text-neutral">No members found</p>
            </div>
          </div>
        </UCard>

        <UCard v-if="membersData?.invitations && membersData.invitations.length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Pending Invitations</h2>
              <UBadge color="warning" variant="soft">{{ membersData.invitations.length }} pending</UBadge>
            </div>
          </template>

          <div class="divide-y divide-neutral">
            <div
              v-for="invitation in membersData.invitations"
              :key="invitation.id"
              class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-3">
                <UAvatar :alt="invitation.email" size="md" />
                <div>
                  <p class="font-medium">{{ invitation.email }}</p>
                  <p class="text-sm text-neutral">
                    Invited by {{ invitation.invitedBy }} • Expires {{ formatDate(invitation.expiresAt) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <UBadge :color="getRoleColor(invitation.role)" variant="soft" class="capitalize">
                  {{ invitation.role }}
                </UBadge>
                <UButton
                  v-if="isAdmin"
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="cancelInvitation(invitation.id)"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
