import { useServerStripe } from '#stripe/server';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { projects } from '~~/server/db/schema';
import type { PlanName } from '#shared/constants';

export default defineEventHandler(async (event) => {
  const stripe = await useServerStripe(event);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      message: 'Stripe webhook secret not configured',
    });
  }

  const signature = getHeader(event, 'stripe-signature');
  if (!signature) {
    throw createError({
      statusCode: 400,
      message: 'Missing stripe-signature header',
    });
  }

  const body = await readRawBody(event);
  if (!body) {
    throw createError({
      statusCode: 400,
      message: 'Missing request body',
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('⚠️  Webhook signature verification failed:', errorMessage, error);
    throw createError({
      statusCode: 400,
      message: `Webhook Error: ${errorMessage}`,
    });
  }

  const db = useDrizzle();

  switch (stripeEvent.type) {
    case 'customer.subscription.trial_will_end': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;

      const project = await db.query.projects.findFirst({
        where: eq(projects.stripeSubscriptionId, subscription.id),
      });

      if (project) {
        console.log(`Trial ending soon for project ${project.id}`);
      }

      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;

      const project = await db.query.projects.findFirst({
        where: eq(projects.stripeSubscriptionId, subscription.id),
      });

      if (project) {
        await db
          .update(projects)
          .set({
            planName: 'free',
            subscriptionStatus: 'active',
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
          })
          .where(eq(projects.id, project.id));

        console.log(`Subscription cancelled for project ${project.id}`);
      }
      break;
    }
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session

      const projectId = session.metadata?.projectId;
      const planName = session.metadata?.planName as PlanName | undefined;

      if (!projectId || !planName) {
        console.error('Missing projectId or planName in session metadata');
        break;
      }

      await db
        .update(projects)
        .set({
          planName,
          subscriptionStatus: 'active',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripeCurrentPeriodEnd: null,
        })
        .where(eq(projects.id, projectId));

      console.log(`Subscription created for project ${projectId}: ${session.subscription}`);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;

      const project = await db.query.projects.findFirst({
        where: eq(projects.stripeSubscriptionId, subscription.id),
      });

      if (project) {
        const newPlanName = subscription.items.data[0]?.price.lookup_key?.split('_')?.[0];

        let subscriptionStatus: string = subscription.status;
        if (subscription.cancel_at_period_end) {
          subscriptionStatus = 'canceling';
          console.log(`Subscription scheduled for cancellation at period end for project ${project.id}`);
        } else if (subscription.status === 'active' && project.subscriptionStatus === 'canceling') {
          console.log(`Subscription reactivated for project ${project.id}`);
        }

        await db
          .update(projects)
          .set({
            planName: (newPlanName || project.planName) as PlanName,
            stripeCurrentPeriodEnd: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            subscriptionStatus,
          })
          .where(eq(projects.id, project.id));

        if (newPlanName && newPlanName !== project.planName) {
          console.log(
            `Subscription for project ${project.id}: ${project.planName} → ${newPlanName}`
          );
        } else {
          console.log(`Subscription updated for project ${project.id}: ${subscription.status}`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return { received: true };
});
