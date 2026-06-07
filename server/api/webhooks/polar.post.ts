import { eq } from 'drizzle-orm';
import type { Subscription } from '@polar-sh/sdk/models/components/subscription';
import { projects } from '~~/server/db/schema';
import { planNames, type PlanName } from '#shared/constants';

const TERMINAL_STATUSES = ['canceled', 'unpaid', 'incomplete', 'incomplete_expired'];

const resolveProjectId = (subscription: Subscription) => {
  return subscription.customer?.externalId || (subscription.metadata?.projectId as string | undefined);
};

const resolvePlanName = (subscription: Subscription): PlanName | undefined => {
  const planName = subscription.product?.metadata?.planName as PlanName | undefined;
  if (planName && planNames.includes(planName)) {
    return planName;
  }
  return undefined;
};

const resolveStatus = (subscription: Subscription) => {
  if (subscription.status === 'active' && subscription.cancelAtPeriodEnd) {
    return 'canceling';
  }

  switch (subscription.status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    default:
      return 'inactive';
  }
};

const syncSubscription = async (subscription: Subscription) => {
  const projectId = resolveProjectId(subscription);
  if (!projectId) {
    console.error('Polar webhook: subscription has no externalCustomerId or projectId metadata');
    return;
  }

  if (TERMINAL_STATUSES.includes(subscription.status)) {
    await revokeSubscription(projectId);
    return;
  }

  const planName = resolvePlanName(subscription);

  await useDrizzle()
    .update(projects)
    .set({
      ...(planName ? { planName } : {}),
      subscriptionStatus: resolveStatus(subscription),
      polarCustomerId: subscription.customerId,
      polarSubscriptionId: subscription.id,
      polarCurrentPeriodEnd: subscription.currentPeriodEnd ?? null,
    })
    .where(eq(projects.id, projectId));

  console.log(`Polar subscription synced for project ${projectId}: ${subscription.status}`);
};

const revokeSubscription = async (projectId: string) => {
  await useDrizzle()
    .update(projects)
    .set({
      planName: 'free',
      subscriptionStatus: 'inactive',
      polarSubscriptionId: null,
      polarCurrentPeriodEnd: null,
    })
    .where(eq(projects.id, projectId));

  console.log(`Polar subscription revoked for project ${projectId}`);
};

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  const webhooksHandler = Webhooks({
    webhookSecret: config.polar.webhookSecret,
    onSubscriptionCreated: async ({ data }) => {
      await syncSubscription(data);
    },
    onSubscriptionUpdated: async ({ data }) => {
      await syncSubscription(data);
    },
    onSubscriptionRevoked: async ({ data }) => {
      const projectId = resolveProjectId(data);
      if (projectId) {
        await revokeSubscription(projectId);
      }
    },
  });

  return webhooksHandler(event);
});
