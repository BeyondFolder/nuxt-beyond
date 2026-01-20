import type { H3Event } from 'h3';
import { kv } from 'hub:kv'

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  event: H3Event,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const key = `${config.keyPrefix || 'ratelimit'}:${ip}`;

  try {
    const now = Date.now();

    const data = await kv.get<{ count: number; resetAt: number }>(key);

    if (!data || data.resetAt < now) {
      const resetAt = now + config.windowMs;
      await kv.set(key, { count: 1, resetAt }, { ttl: Math.ceil(config.windowMs / 1000) });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    if (data.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.resetAt,
      };
    }

    const newCount = data.count + 1;
    await kv.set(key, { count: newCount, resetAt: data.resetAt }, { ttl: Math.ceil(config.windowMs / 1000) });

    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetAt: data.resetAt,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }
}
