<script setup lang="ts">
import type { ProjectConfiguration } from '#shared/types';
import { type PlanName, PLANS_CONSTANTS } from '#shared/constants';

definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const { session } = useUserSession();
const { data: dashboardData, pending, error } = await useFetch('/api/dashboard', { key: 'api/dashboard' });
const { data: statsData } = await useFetch('/api/dashboard/stats', { key: 'api/dashboard/stats' });

const route = useRoute();
const toast = useToast();

const supportsEscalation = computed(() => {
  const planName = dashboardData.value?.currentProject?.planName;
  if (!planName) {
    return false;
  }
  return PLANS_CONSTANTS[planName as PlanName]?.SUPPORT_ESCALATION || false;
});

const hasQuestionsWithoutSupport = computed(() => {
  if (supportsEscalation.value) {
    return false;
  }
  const pendingQuestions = statsData.value?.pendingQuestions || 0;
  const totalQuestions = statsData.value?.totalQuestionsThisMonth || 0;
  return pendingQuestions > 0 || totalQuestions > 0;
});

const maxReplies = computed(() => {
  const planName = dashboardData.value?.currentProject?.planName;
  if (!planName) {
    return 0;
  }
  return PLANS_CONSTANTS[planName as PlanName]?.MAX_NB_OF_AI_REPLIES || 0;
});

const repliesThisMonth = computed(() => statsData.value?.repliesThisMonth || 0);

const hasExceededReplies = computed(() => {
  return repliesThisMonth.value >= maxReplies.value;
});

watch(session, async () => {
  await refreshNuxtData('api/dashboard');
  await refreshNuxtData('api/dashboard/stats');
});

onMounted(() => {
  const billingSuccess = route.query.billing_success;
  if (billingSuccess === 'true') {
    toast.add({
      title: 'Plan successfully updated!',
      color: 'success',
    });
  }
});

const stats = computed(() => {
  if (!statsData.value) {
    return [];
  }

  return [
    {
      label: 'Replies This Month',
      value: `${repliesThisMonth.value} / ${maxReplies.value}`,
      icon: 'i-lucide-bot',
      color: hasExceededReplies.value ? ('error' as const) : ('primary' as const),
      description: 'AI responses sent',
    },
    {
      label: 'Chats This Month',
      value: statsData.value?.chatsThisMonth || 0,
      icon: 'i-lucide-message-circle',
      color: 'primary' as const,
      description: 'Customer conversations',
    },
    {
      label: 'Pending Questions',
      value: statsData.value?.pendingQuestions || 0,
      icon: 'i-lucide-help-circle',
      color: 'warning' as const,
      description: 'Awaiting response',
    },
    {
      label: 'Questions This Month',
      value: statsData.value?.totalQuestionsThisMonth || 0,
      icon: 'i-lucide-inbox',
      color: 'info' as const,
      description: 'Support escalations',
    },
  ];
});
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pending" class="space-y-6">
        <div class="grid gap-4 md:grid-cols-4">
          <UCard v-for="i in 4" :key="i">
            <div class="space-y-3">
              <USkeleton class="h-4 w-24" />
              <USkeleton class="h-8 w-16" />
              <USkeleton class="h-3 w-32" />
            </div>
          </UCard>
        </div>
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        title="Error loading dashboard"
        :description="error.message"
      >
        <template #actions>
          <UButton color="error" variant="ghost" @click="() => refreshNuxtData('api/dashboard')">
            <UIcon name="i-lucide-refresh-cw" class="mr-1" />
            Retry
          </UButton>
        </template>
      </UAlert>

      <div v-else-if="dashboardData" class="space-y-6">
        <div class="grid gap-4 grid-cols-2 md:grid-cols-4">
          <UCard v-for="stat in stats" :key="stat.label">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <p class="text-sm text-neutral">{{ stat.label }}</p>
                <p class="text-3xl font-semibold" :class="stat.color === 'error' ? 'text-error' : ''">
                  {{ stat.value }}
                </p>
                <p class="text-xs text-neutral">{{ stat.description }}</p>
              </div>
              <UIcon :name="stat.icon" :class="`text-${stat.color} text-2xl`" />
            </div>
          </UCard>
        </div>

        <UAlert
          v-if="hasExceededReplies && dashboardData.currentProject"
          color="error"
          variant="soft"
          title="Reply limit exceeded"
          icon="i-lucide-alert-circle"
        >
          <template #description>
            <p class="mb-3">
              You have used all your
              <strong>{{ maxReplies }} allowed replies</strong>
              this month for the
              <UBadge
                :color="getPlanColor(dashboardData.currentProject.planName || 'free')"
                variant="subtle"
                size="lg"
                class="capitalize"
              >
                {{ dashboardData.currentProject.planName }} Plan </UBadge
              >. Your AI chatbot will stop responding to new messages until you upgrade your plan or wait until next
              month.
            </p>
          </template>
          <template #actions>
            <UButton to="/dashboard/billing" color="error" variant="solid"> Upgrade Plan </UButton>
          </template>
        </UAlert>

        <UAlert
          v-if="hasQuestionsWithoutSupport"
          color="warning"
          variant="soft"
          title="Upgrade to respond to customer questions"
          icon="i-lucide-lock"
        >
          <template #description>
            <p class="mb-3">
              You have
              <strong
                >{{ statsData?.totalQuestionsThisMonth || 0 }} total question{{
                  (statsData?.totalQuestionsThisMonth || 0) === 1 ? '' : 's'
                }}</strong
              >
              this month. Upgrade to the
              <UBadge :color="getPlanColor('pro')" variant="subtle" size="lg" class="capitalize"> Pro Plan </UBadge>
              or higher to respond to customer questions and improve your AI agent.
            </p>
          </template>
          <template #actions>
            <UButton to="/dashboard/billing" color="warning" variant="solid"> Upgrade Plan </UButton>
          </template>
        </UAlert>

        <UCard v-if="dashboardData?.currentProject">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">{{ dashboardData.currentProject.name }}</h2>
              <UBadge
                :color="getPlanColor(dashboardData.currentProject.planName || 'free')"
                variant="subtle"
                size="lg"
                class="capitalize"
              >
                {{ dashboardData.currentProject.planName }} Plan
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <p v-if="dashboardData.currentProject.description" class="text-neutral">
              {{ dashboardData.currentProject.description }}
            </p>

            <div class="flex flex-wrap gap-6">
              <div>
                <p class="text-xs text-neutral mb-1">Your Role</p>
                <UBadge :color="getRoleColor(dashboardData.currentProjectRole || '')" variant="soft" class="capitalize">
                  {{ dashboardData.currentProjectRole }}
                </UBadge>
              </div>

              <div>
                <p class="text-xs text-neutral mb-1">Status</p>
                <UBadge
                  :color="getStatusColor(dashboardData.currentProject.subscriptionStatus || '')"
                  variant="soft"
                  class="capitalize"
                >
                  {{ dashboardData.currentProject.subscriptionStatus }}
                </UBadge>
              </div>

              <div>
                <p class="text-xs text-neutral mb-1">Created</p>
                <p class="text-sm">
                  {{ formatDate(dashboardData.currentProject.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Quick Actions</h2>
          </template>

          <div class="grid gap-4 grid-cols-3">
            <UButton
              v-if="supportsEscalation"
              to="/dashboard/questions"
              color="warning"
              variant="soft"
              size="xl"
              class="h-24 flex-col gap-2"
              block
            >
              <UIcon name="i-lucide-inbox" class="text-2xl" />
              <span>Support Questions</span>
            </UButton>

            <UButton
              to="/configuration/customization"
              color="primary"
              variant="soft"
              size="xl"
              class="h-24 flex-col gap-2"
              block
            >
              <UIcon name="i-lucide-settings" class="text-2xl" />
              <span>Project Settings</span>
            </UButton>

            <UButton
              to="/dashboard/members"
              color="secondary"
              variant="soft"
              size="xl"
              class="h-24 flex-col gap-2"
              block
            >
              <UIcon name="i-lucide-users" class="text-2xl" />
              <span>Manage Members</span>
            </UButton>
          </div>
        </UCard>
      </div>

      <UAlert
        v-else
        color="warning"
        variant="soft"
        title="No data available"
        description="Unable to load dashboard information."
      >
        <template #actions>
          <UButton color="warning" variant="ghost" @click="() => refreshNuxtData('api/dashboard')">
            <UIcon name="i-lucide-refresh-cw" class="mr-1" />
            Refresh
          </UButton>
        </template>
      </UAlert>
    </template>
  </UDashboardPanel>
</template>
