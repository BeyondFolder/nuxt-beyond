// The embedded widget has a session based on the projectId and the website which embeds it.
// We store the session in memory and also in localStorage, if storage permissions were given (see useStorageAccess)
export function useEmbedSession(projectId: string) {
  const getStorageKey = () => {
    const origin = window.location !== window.parent.location
      ? document.referrer
      : window.location.origin;

    const hostname = new URL(origin).hostname;
    return `session_${projectId}_${hostname}`;
  };

  const embedSession = useState<string | null>('embedSession', () => null);

  const saveSession = (token: string) => {
    const key = getStorageKey();
    localStorage.setItem(key, token);
    embedSession.value = token;
  };

  const getSession = (): string | null => {
    const key = getStorageKey();
    return localStorage.getItem(key) || embedSession.value;
  };

  const clearSession = () => {
    const key = getStorageKey();
    localStorage.removeItem(key);
    embedSession.value = null;
  };

  return { saveSession, getSession, clearSession };
}
