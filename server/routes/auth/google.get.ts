export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email'],
  },
  async onSuccess(event) {
    const query = getQuery(event);
    const redirect = query.redirect as string;
    const loginUrl = redirect
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : '/login';
    return sendRedirect(event, loginUrl);
  },
  onError(event) {
    const query = getQuery(event);
    const redirect = query.redirect as string;
    const errorUrl = redirect
      ? `/login?error=oauth_failed&redirect=${encodeURIComponent(redirect)}`
      : '/login?error=oauth_failed';
    return sendRedirect(event, errorUrl);
  },
});
