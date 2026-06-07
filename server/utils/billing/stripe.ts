import { useServerStripe } from '#stripe/server';
import type { PaymentProvider } from './provider';

export const stripeProvider: PaymentProvider = {
  async createCheckout({ event, project, planName, userId, userEmail }) {
    if (project.stripeSubscriptionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A subscription is already active',
      });
    }

    const stripe = await useServerStripe(event);

    const prices = await stripe.prices.list({
      lookup_keys: [`${planName}_monthly`], // TODO: Add support for yearly prices
      expand: ['data.product'],
    });
    const priceId = prices.data?.[0]?.id;

    if (!priceId) {
      throw createError({
        statusCode: 500,
        statusMessage: `Price ID not found for plan: ${planName}`,
      });
    }

    const config = useRuntimeConfig(event);

    const datafastVisitorId = getCookie(event, 'datafast_visitor_id');
    const datafastSessionId = getCookie(event, 'datafast_session_id');

    const sessionConfig: Record<string, any> = {
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.public.siteUrl}/dashboard?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.siteUrl}/dashboard/billing`,
      metadata: {
        userId,
        projectId: project.id,
        planName,
        ...(datafastVisitorId && { datafast_visitor_id: datafastVisitorId }),
        ...(datafastSessionId && { datafast_session_id: datafastSessionId }),
      },
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
    };

    if (project.stripeCustomerId) {
      sessionConfig.customer = project.stripeCustomerId;
      sessionConfig.customer_update = {
        address: 'auto',
        name: 'auto',
      };
    } else {
      sessionConfig.customer_email = userEmail;
    }

    if (!project.stripeCustomerId && process.env.STRIPE_PROMO_CODE) {
      sessionConfig.discounts = [
        {
          promotion_code: process.env.STRIPE_PROMO_CODE,
        },
      ];
    }

    if (planName === 'pro' && !project.stripeCustomerId) {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
      };
    }

    const stripeSession = await stripe.checkout.sessions.create(sessionConfig);

    return {
      url: stripeSession.url,
    };
  },

  async createPortalSession({ event, project }) {
    if (!project.stripeCustomerId) {
      throw createError({
        statusCode: 400,
        message: 'No Stripe customer found for this project',
      });
    }

    const stripe = await useServerStripe(event);
    const config = useRuntimeConfig(event);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: project.stripeCustomerId,
      return_url: `${config.public.siteUrl}/dashboard/billing`,
    });

    return {
      url: portalSession.url,
    };
  },
};
