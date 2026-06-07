import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - config.windowMs);

    const { count } = await supabaseAdmin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('window_start', windowStart.toISOString());

    const currentCount = count || 0;

    if (currentCount >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil(config.windowMs / 1000),
      };
    }

    await supabaseAdmin.from('rate_limits').insert({
      key,
      count: 1,
      window_start: new Date().toISOString(),
    });

    // Limpiar registros viejos en background sin encadenar .catch()
    void supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('window_start', new Date(Date.now() - 3600000).toISOString());

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  } catch (e) {
    console.error('Rate limit error:', e);
    return { allowed: true, remaining: 1, resetIn: 0 };
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}