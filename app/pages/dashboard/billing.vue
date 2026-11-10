<script setup lang="ts">
import { GITHUB_REPO_URL, type PlanName, planNames, planTitles, PLANS_CONSTANTS } from '#shared/constants';

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

const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

if (!isAdmin.value) {
  navigateTo('/dashboard');
}

const projectId = computed(() => dashboardData.value?.currentProject?.id);
const currentPlan = computed<PlanName>(() => dashboardData.value?.currentProject?.planName || 'free');
const subscriptionStatus = computed(() => dashboardData.value?.currentProject?.subscriptionStatus || 'inactive');

if (!projectId.value) {
  throw createError({ statusCode: 404, statusMessage: 'No project found', fatal: true });
}

const bytesToMegabytes = (bytes: number) => bytes / (1024 * 1024);

const plans = planNames.map((planName) => {
  const limits = PLANS_CONSTANTS[planName];

  return {
    planName,
    title: planTitles[planName],
    features: [
      `${limits.MAX_NB_OF_FILES} documents`,
      `${bytesToMegabytes(limits.MAX_FILE_SIZE)}MB max file size`,
      `${limits.MAX_NB_OF_AI_REPLIES.toLocaleString('en-US')} AI replies/month`,
      ...(limits.SUPPORT_ESCALATION ? ['Human support escalation'] : []),
      ...(limits.SELF_LEARNING ? ['Self learning*'] : []),
    ],
  };
});

const getButtonLabel = (planName: PlanName) => {
  if (planName === 'free' && currentPlan.value === 'free') {
    return 'Continue as Free';
  }

  if (planName === currentPlan.value) {
    return 'Manage Plan';
  }

  const currentIndex = planNames.indexOf(currentPlan.value);
  const selectedIndex = planNames.indexOf(planName);

  if (selectedIndex > currentIndex) {
    return 'Upgrade Plan';
  }

  return 'Downgrade Plan';
};

const getPlanHighlight = (planName: PlanName) => {
  return planName !== 'free' && planName === currentPlan.value;
};

const getPlanBadge = (planName: PlanName) => {
  if (planName === currentPlan.value) {
    return 'Current Plan';
  }

  return undefined;
};

const handlePlanClick = (planName: PlanName) => {
  if (planName === 'free' && currentPlan.value === 'free') {
    router.push('/dashboard');
    return;
  }

  toast.add({
    title: 'Checkout is turned off in the demo',
    description: 'Clone NuxtBeyond from GitHub and connect Stripe or Polar to turn on real checkout.',
    icon: 'i-lucide-info',
    color: 'info',
    actions: [
      {
        label: 'View on GitHub',
        icon: 'i-simple-icons-github',
        to: GITHUB_REPO_URL,
        target: '_blank',
      },
    ],
  });
};

useSeoMeta({
  title: 'Billing - NuxtBeyond',
  description: 'Manage your subscription and billing',
});
</script>

<template>
  <UDashboardPanel grow>
    <template #header>
      <UDashboardNavbar title="Billing">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageSection
        title="Plans and billing"
        description="Checkout is turned off in this demo. In your own copy of NuxtBeyond, these plans connect to Stripe or Polar."
        :ui="{
          container: 'max-w-7xl mx-auto',
          title: 'text-center',
          description: 'text-center',
        }"
      >
        <UAlert
          v-if="subscriptionStatus === 'canceling'"
          class="w-auto mx-auto  -mt-8"
          color="warning"
          variant="soft"
          title="Subscription Canceling"
          description="Your subscription is scheduled to cancel at the end of the billing period. You can reactivate it by clicking 'Manage Plan' above."
          icon="i-lucide-alert-triangle"
        />

        <UPricingPlans scale compact>
          <UPricingPlan
            v-for="plan in plans"
            :key="plan.planName"
            :title="plan.title"
            :highlight="getPlanHighlight(plan.planName)"
            :scale="getPlanHighlight(plan.planName)"
            variant="subtle"
            :features="plan.features"
            :badge="getPlanBadge(plan.planName)"
          >
            <template #footer>
              <UButton
                :label="getButtonLabel(plan.planName)"
                :color="getPlanHighlight(plan.planName) ? 'primary' : 'neutral'"
                :variant="getPlanHighlight(plan.planName) ? 'solid' : 'subtle'"
                block
                class="cursor-pointer"
                @click="handlePlanClick(plan.planName)"
              />
            </template>
          </UPricingPlan>
        </UPricingPlans>

        <UAlert
          class="w-auto mx-auto mt-8"
          color="neutral"
          variant="soft"
          title="*Self Learning"
          description="Your team can add answered support questions to the knowledge base, so the AI can use those answers in future replies."
        />
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>
