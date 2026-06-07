import type { H3Event } from 'h3';
import type { projects } from '~~/server/db/schema';
import type { PlanName } from '#shared/constants';
import { stripeProvider } from './stripe';
import { polarProvider } from './polar';

export type BillingProject = typeof projects.$inferSelect;

export interface CheckoutOptions {
  event: H3Event;
  project: BillingProject;
  planName: PlanName;
  userId: string;
  userEmail: string;
}

export interface PortalOptions {
  event: H3Event;
  project: BillingProject;
}

export interface PaymentProvider {
  createCheckout(opts: CheckoutOptions): Promise<{ url: string | null }>;
  createPortalSession(opts: PortalOptions): Promise<{ url: string | null }>;
}

export const getPaymentProvider = (event: H3Event): PaymentProvider => {
  const provider = useRuntimeConfig(event).public.paymentProvider;
  return provider === 'polar' ? polarProvider : stripeProvider;
};
