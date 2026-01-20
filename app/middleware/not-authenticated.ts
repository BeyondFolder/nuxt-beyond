// Note: This might not work properly for prerendered or SSR pages after deploy. Make sure to test pages which use this
export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession();

  // skip middleware on server
  if (import.meta.server) {
    return
  }

  if (loggedIn.value) {
    return navigateTo('/dashboard', { replace: true });
  }
});
