// Request access to the browser's storage API (e.g. localStorage) from the user.
// This allows an embeded widget to store data locally.
export function useStorageAccess() {
  async function requestStorageAccess(): Promise<boolean> {
    if (!('requestStorageAccess' in document)) {
      return true;
    }

    try {
      await document.requestStorageAccess();
      return true;
    } catch (error) {
      console.warn('Storage access denied or not available:', error);
      return false;
    }
  }

  function hasStorageAccess(): Promise<boolean> {
    if ('hasStorageAccess' in document) {
      return document.hasStorageAccess();
    }
    return Promise.resolve(true);
  }

  return { requestStorageAccess, hasStorageAccess };
}
