import { Polar } from '@polar-sh/sdk';

export const getPolarClient = () => {
  const config = useRuntimeConfig();
  const accessToken = config.polar.accessToken;
  if (!accessToken) {
    throw new Error('Missing POLAR_ACCESS_TOKEN');
  }
  return new Polar({
    accessToken,
    server: config.polar.mode as 'production' | 'sandbox' | undefined,
  });
};
