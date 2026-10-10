import { createPolar, type Environment } from '@polar-sh/sdk/2026-10';

export const getPolarClient = () => {
  const config = useRuntimeConfig();
  const accessToken = config.polar.accessToken;
  if (!accessToken) {
    throw new Error('Missing POLAR_ACCESS_TOKEN');
  }
  return createPolar({
    accessToken,
    environment: (config.polar.mode || undefined) as Environment | undefined,
  });
};
