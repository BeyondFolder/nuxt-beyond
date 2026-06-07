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
const toast = useToast();
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

const isLoading = ref(false);
const selectedPlanIndex = ref<number | null>(null);

const getButtonLabel = (planName: PlanName) => {
  if (planName === 'boilerplate' || planName === 'bundle') {
    return 'Purchase Now';
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
  if (planName === 'boilerplate') {
    return true;
  }

  return planName !== 'free' && planName === currentPlan.value;
};

const getPlanBadge = (plan: any) => {
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

const mockPaymentLinks: Record<string, string> = {
  free: '/dashboard',
  pro: 'https://buy.stripe.com/test_pro',
  advanced: 'https://buy.stripe.com/test_advanced',
  boilerplate: 'https://buy.stripe.com/test_28EbJ2800dNnfMK6ab9ws00?prefilled_promo_code=BOILERPLATE1',
  bundle: 'https://buy.stripe.com/test_00w7sM0xydNnfMKdCD9ws01?prefilled_promo_code=BUNDLE1',
};

const handleSubscribe = async (planName: PlanName, planIndex: number) => {
  if (!projectId.value) {
    return;
  }

  if (planName === 'free' && currentPlan.value === 'free') {
    router.push('/dashboard');
    return;
  }

  isLoading.value = true;
  selectedPlanIndex.value = planIndex;

  const paymentLink = mockPaymentLinks[planName];
  if (paymentLink) {
    window.location.href = paymentLink;
    return;
  }

  isLoading.value = false;
  selectedPlanIndex.value = null;
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
          <MDC :value="page.pricing.title" />
        </template>

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
            v-for="(plan, index) in page.pricing.plans"
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
          description="After your support team handles a case, the answer can be automatically included in the AI's training data for future responses"
        />
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>
