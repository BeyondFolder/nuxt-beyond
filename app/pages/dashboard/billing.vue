<script setup lang="ts">
import { type PlanName, planNames } from '#shared/constants';

definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const { data: page } = await useAsyncData('index', () => queryCollection('index').first());
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Pricing data not found', fatal: true });
}

const router = useRouter();
const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

if (!isAdmin.value) {
  navigateTo('/dashboard');
}

const paymentProvider = useRuntimeConfig().public.paymentProvider;

const projectId = computed(() => dashboardData.value?.currentProject?.id);
const currentPlan = computed<PlanName>(() => dashboardData.value?.currentProject?.planName || 'free');
const subscriptionStatus = computed(() => dashboardData.value?.currentProject?.subscriptionStatus || 'inactive');
const billingCustomerId = computed(() =>
  paymentProvider === 'polar'
    ? dashboardData.value?.currentProject?.polarCustomerId
    : dashboardData.value?.currentProject?.stripeCustomerId
);
const billingSubscriptionId = computed(() =>
  paymentProvider === 'polar'
    ? dashboardData.value?.currentProject?.polarSubscriptionId
    : dashboardData.value?.currentProject?.stripeSubscriptionId
);

if (!projectId.value) {
  throw createError({ statusCode: 404, statusMessage: 'No project found', fatal: true });
}

const shouldPromoteProTrial = computed(() => {
  return currentPlan.value === 'free' && !billingSubscriptionId.value;
});

const isLoading = ref(false);
const selectedPlanIndex = ref<number | null>(null);

const getButtonLabel = (planName: PlanName) => {
  if (shouldPromoteProTrial.value && planName === 'pro') {
    return 'Start Free Trial';
  }

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
  if (shouldPromoteProTrial.value && planName === 'pro') {
    return true;
  }

  return planName !== 'free' && planName === currentPlan.value;
};

const getPlanBadge = (plan: any) => {
  if (shouldPromoteProTrial.value && plan.planName === 'pro') {
    return '7-Day Free Trial';
  }

  if (plan.planName === currentPlan.value) {
    return 'Current Plan';
  }

  if (plan.badge && (currentPlan.value === 'free' || !currentPlan.value)) {
    return plan.badge;
  }

  return undefined;
};

const handleManagePlan = async (planIndex: number) => {
  if (!projectId.value) {
    return;
  }

  isLoading.value = true;
  selectedPlanIndex.value = planIndex;

  try {
    const response = await $fetch(`/api/projects/${projectId.value}/billing/portal`, {
      method: 'POST',
    });

    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
  } finally {
    isLoading.value = false;
    selectedPlanIndex.value = null;
  }
};

const handleSubscribe = async (planName: PlanName, planIndex: number) => {
  if (!projectId.value) {
    return;
  }

  if (planName === 'free' && currentPlan.value === 'free') {
    router.push('/dashboard');
    return;
  }

  if (billingCustomerId.value && (planName === currentPlan.value || billingSubscriptionId.value)) {
    await handleManagePlan(planIndex);
    return;
  }

  isLoading.value = true;
  selectedPlanIndex.value = planIndex;

  try {
    const response = await $fetch(`/api/projects/${projectId.value}/billing`, {
      method: 'POST',
      body: {
        planName,
      },
    });

    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
  } finally {
    isLoading.value = false;
    selectedPlanIndex.value = null;
  }
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
        :ui="{
          container: 'max-w-7xl mx-auto',
          title: 'text-center',
          description: 'text-center',
        }"
      >
        <template #title>
          <MDC :value="page?.pricing.title ?? ''" />
        </template>

        <UAlert
          v-if="shouldPromoteProTrial"
          class="w-auto mx-auto -mt-8"
          color="primary"
          variant="soft"
          title="Start Your 7-Day Free Trial"
          description="Try our Pro plan Free for 7 days when you add your credit card. Get access to support escalation and self-learning features."
          icon="i-lucide-sparkles"
        />

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
            v-for="(plan, index) in page?.pricing.plans"
            :key="index"
            :title="plan.title"
            :description="plan.description"
            :price="plan.price"
            :discount="!billingSubscriptionId ? plan.discount : undefined"
            :billing-period="plan.billing_period"
            :billing-cycle="plan.billing_cycle"
            :highlight="getPlanHighlight(plan.planName)"
            :scale="getPlanHighlight(plan.planName)"
            variant="subtle"
            :features="plan.features"
            :badge="getPlanBadge(plan)"
          >
            <template #footer>
              <UButton
                :label="isLoading && selectedPlanIndex === index ? 'Processing...' : getButtonLabel(plan.planName)"
                :color="getPlanHighlight(plan.planName) ? 'primary' : 'neutral'"
                :variant="getPlanHighlight(plan.planName) ? 'solid' : 'subtle'"
                :loading="isLoading && selectedPlanIndex === index"
                block
                class="cursor-pointer"
                @click="handleSubscribe(plan.planName, index)"
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
