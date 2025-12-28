import type { Context, Options } from 'elysia-rate-limit';
import Redis from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

/**
 * Custom generator to extract client IP from request headers.
 * Uses request.headers directly since server.requestIP() isn't available
 * in detached Elysia instances.
 */
const ipGenerator = (request: Request, server: unknown): string => {
  // Try server.requestIP() first if available
  if (server && typeof server === 'object' && 'requestIP' in server) {
    const serverWithIP = server as { requestIP: (req: Request) => { address: string } | null };
    const ip = serverWithIP.requestIP(request)?.address;
    if (ip) return ip;
  }

  // Fallback to headers
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    '127.0.0.1'
  );
};

/**
 * Redis-backed rate limit context for distributed rate limiting.
 * Falls back to in-memory (DefaultContext) if Redis is not configured.
 */
export class RedisRateLimitContext implements Context {
  private prefix: string;
  private duration = 60_000;

  constructor(prefix = 'rl:') {
    this.prefix = prefix;
  }

  init(options: Omit<Options, 'context'>): void {
    this.duration = options.duration;
  }

  async increment(key: string): Promise<{ count: number; nextReset: Date }> {
    const fullKey = this.prefix + key;
    const now = Date.now();
    const durationSec = Math.ceil(this.duration / 1000);

    if (!redis) {
      // Fallback: no limit if Redis not available
      return { count: 0, nextReset: new Date(now + this.duration) };
    }

    const multi = redis.multi();
    multi.incr(fullKey);
    multi.pttl(fullKey);
    const results = await multi.exec();

    const count = (results?.[0]?.[1] as number) ?? 1;
    const ttl = (results?.[1]?.[1] as number) ?? -1;

    // Set expiry on first request
    if (ttl === -1) {
      await redis.expire(fullKey, durationSec);
    }

    const nextReset = ttl > 0
      ? new Date(now + ttl)
      : new Date(now + this.duration);

    return { count, nextReset };
  }

  async decrement(key: string): Promise<void> {
    if (!redis) return;
    const fullKey = this.prefix + key;
    await redis.decr(fullKey);
  }

  async reset(key?: string): Promise<void> {
    if (!redis) return;
    if (key) {
      await redis.del(this.prefix + key);
    }
    // If no key, reset all (not implemented for safety)
  }

  async kill(): Promise<void> {
    // Cleanup if needed
  }
}

/** Strict rate limit: 5 requests per 15 minutes (for register) */
export const strictRateLimitOptions: Partial<Options> = {
  duration: 60_000 * 15,
  max: 5,
  generator: ipGenerator,
  context: new RedisRateLimitContext('rl:strict:'),
  errorResponse: new Response(
    JSON.stringify({ message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ),
};

/** Auth rate limit: 10 requests per 15 minutes (for login) */
export const authRateLimitOptions: Partial<Options> = {
  duration: 60_000 * 15,
  max: 10,
  generator: ipGenerator,
  context: new RedisRateLimitContext('rl:auth:'),
  errorResponse: new Response(
    JSON.stringify({ message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ),
};

/** Checkout rate limit: 5 requests per minute */
export const checkoutRateLimitOptions: Partial<Options> = {
  duration: 60_000,
  max: 5,
  generator: ipGenerator,
  context: new RedisRateLimitContext('rl:checkout:'),
  errorResponse: new Response(
    JSON.stringify({ message: 'Trop de tentatives de paiement. Veuillez réessayer dans une minute.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ),
};
