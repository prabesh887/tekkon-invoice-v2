/**
 * Simple in-memory brute-force protection built around per-key
 * failure timestamps. Limits how many failures a single key (e.g.
 * an IP address) can accumulate within a rolling time window.
 *
 * Note: this state is per serverless instance. For robust
 * protection across instances, back this with a shared store
 * (e.g. Upstash Redis). For a single-instance Node/Vercel
 * deployment this is effective.
 */
export interface RateLimiterOptions {
  maxFailures: number
  windowMs: number
}

export interface RateLimiter {
  isBlocked(key: string): boolean
  recordFailure(key: string): void
  reset(key: string): void
  cleanup(): number
}

export function createInMemoryRateLimiter(
  options: RateLimiterOptions
): RateLimiter {
  const { maxFailures, windowMs } = options
  const failedAttempts = new Map<string, number[]>()

  function prune(key: string): number[] {
    const cutoff = Date.now() - windowMs
    const timestamps = (failedAttempts.get(key) ?? []).filter((t) => t > cutoff)
    return timestamps
  }

  return {
    isBlocked(key: string): boolean {
      return prune(key).length >= maxFailures
    },

    recordFailure(key: string): void {
      const timestamps = prune(key)
      timestamps.push(Date.now())
      failedAttempts.set(key, timestamps)
    },

    reset(key: string): void {
      failedAttempts.delete(key)
    },

    cleanup(): number {
      const cutoff = Date.now() - windowMs
      let removed = 0
      for (const [key, timestamps] of failedAttempts) {
        if (timestamps.every((t) => t <= cutoff)) {
          failedAttempts.delete(key)
          removed += 1
        }
      }
      return removed
    },
  }
}

/**
 * Best-effort client IP extraction. On Vercel/behind a proxy the
 * real client IP arrives via x-forwarded-for (first hop).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}
