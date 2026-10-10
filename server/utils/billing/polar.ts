import { getPolarClient } from '~~/server/utils/polar';
import type { PaymentProvider } from './provider';

export const polarProvider: PaymentProvider = {
  async createCheckout({ event, project, planName, userId, userEmail }) {
    if (project.polarSubscriptionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A subscription is already active',
      });
    }

    const polar = getPolarClient();

    const products = await polar.products.list({
      is_archived: false,
      metadata: { planName }, // TODO: Add support for yearly prices
    });
    const productId = products.items[0]?.id;

    if (!productId) {
      throw createError({
        statusCode: 500,
        statusMessage: `No Polar product found for plan: ${planName}`,
      });
    }

    const config = useRuntimeConfig(event);

    const datafastVisitorId = getCookie(event, 'datafast_visitor_id');
    const datafastSessionId = getCookie(event, 'datafast_session_id');

    const checkout = await polar.checkouts.create({
      products: [productId],
      external_customer_id: project.id,
      customer_email: project.polarCustomerId ? undefined : userEmail,
      success_url: `${config.public.siteUrl}/dashboard?billing_success=true`,
      metadata: {
        userId,
        projectId: project.id,
        planName,
        ...(datafastVisitorId && { datafast_visitor_id: datafastVisitorId }),
        ...(datafastSessionId && { datafast_session_id: datafastSessionId }),
      },
    });

    return {
      url: checkout.url,
    };
  },

  async createPortalSession({ project }) {
    if (!project.polarCustomerId) {
      throw createError({
        statusCode: 400,
        message: 'No billing customer found for this project',
      });
    }

    const polar = getPolarClient();

    const customerSession = await polar.customerSessions.create({
      customer_id: project.polarCustomerId,
    });

    return {
      url: customerSession.customer_portal_url,
    };
  },
};
