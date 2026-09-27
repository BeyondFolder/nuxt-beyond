export {};

declare global {
  interface Window {
    nuxtbeyond?: ((...args: unknown[]) => void) & { open?: () => void; q?: unknown[] };
  }
}
