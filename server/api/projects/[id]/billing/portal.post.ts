import { useServerStripe } from '#stripe/server';
import { getUserProjectWithRole } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) throw createError({ statusCode: 404, statusMessage: "Project not found" });
  const { role, project } = userProject;
  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' });
  }

  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only project admins can manage billing' });
  }

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
});
