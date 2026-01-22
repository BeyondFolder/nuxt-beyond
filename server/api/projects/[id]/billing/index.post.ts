import { useServerStripe } from '#stripe/server';
import { getUserProjectWithRole } from '~~/server/db/queries';
import { planNames } from '#shared/constants';
import { z } from 'zod';

const bodySchema = z.object({
  planName: z.enum(planNames),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }

  const { role, project } = userProject;
  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' });
  }

  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only project admins can manage billing' });
  }

  const { planName } = await readValidatedBody(event, bodySchema.parse);

  if (!planName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Plan name is required',
    });
  }

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
      userId: session.user.id,
      projectId,
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
    sessionConfig.customer_email = session.user.email;
  }

  if (!project.stripeCustomerId && process.env.STRIPE_PROMO_CODE) {
    sessionConfig.discounts = [
      {
        promotion_code: process.env.STRIPE_PROMO_CODE,
      },
    ];
  }

  const stripeSession = await stripe.checkout.sessions.create(sessionConfig);

  return {
    url: stripeSession.url,
  };
});
