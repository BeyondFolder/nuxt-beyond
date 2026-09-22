import { getUserWithProject } from '~~/server/db/queries';
import { loginUser } from '~~/server/utils/auth';

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email'],
  },
  async onSuccess(event, { user }) {
    const db = useDrizzle();
    const query = getQuery(event);
    const redirect = query.redirect as string;

    const result = await getUserWithProject(db, user.email);

    if (
      result &&
      result.length !== 0 &&
      (result[0]?.user.provider !== 'google' || result[0]?.user.providerId !== user.sub)
    ) {
      const errorUrl = redirect
        ? `/login?error=different_provider&redirect=${encodeURIComponent(redirect)}`
        : '/login?error=different_provider';
      return sendRedirect(event, errorUrl);
    }

    // eslint-disable-next-line prefer-const
    let { user: dbUser, project, role } = result[0] || {};

    if (!dbUser) {
      dbUser = await db
        .insert(tables.users)
        .values({
          email: user.email,
          provider: 'google',
          providerId: user.sub,
        })
        .returning()
        .get();
    }

    await loginUser(event, dbUser, 'google', project || undefined, role || undefined, user.sub);

    return sendRedirect(event, redirect || '/dashboard');
  },
  onError(event, error) {
    console.error('Google OAuth error:', error);
    const query = getQuery(event);
    const redirect = query.redirect as string;
    const errorUrl = redirect
      ? `/login?error=oauth_failed&redirect=${encodeURIComponent(redirect)}`
      : '/login?error=oauth_failed';
    return sendRedirect(event, errorUrl);
  },
});
