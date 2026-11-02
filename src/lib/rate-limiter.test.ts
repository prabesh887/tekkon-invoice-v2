import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createInMemoryRateLimiter, getClientIp } from "./rate-limiter"

const WINDOW_MS = 1000
const MAX_FAILURES = 3

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("createInMemoryRateLimiter", () => {
  it("is not blocked before any failures", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    expect(limiter.isBlocked("1.2.3.4")).toBe(false)
  })

  it("blocks after max failures within the window", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    limiter.recordFailure("1.2.3.4")
    limiter.recordFailure("1.2.3.4")
    expect(limiter.isBlocked("1.2.3.4")).toBe(false)
    limiter.recordFailure("1.2.3.4")
    expect(limiter.isBlocked("1.2.3.4")).toBe(true)
  })

  it("tracks keys independently", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    for (let i = 0; i < MAX_FAILURES; i++) {
      limiter.recordFailure("1.2.3.4")
    }
    expect(limiter.isBlocked("1.2.3.4")).toBe(true)
    expect(limiter.isBlocked("5.6.7.8")).toBe(false)
  })

  it("unblocks after the window expires", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    for (let i = 0; i < MAX_FAILURES; i++) {
      limiter.recordFailure("1.2.3.4")
    }
    expect(limiter.isBlocked("1.2.3.4")).toBe(true)

    vi.advanceTimersByTime(WINDOW_MS + 1)
    expect(limiter.isBlocked("1.2.3.4")).toBe(false)
  })

  it("reset clears failures immediately", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    for (let i = 0; i < MAX_FAILURES; i++) {
      limiter.recordFailure("1.2.3.4")
    }
    expect(limiter.isBlocked("1.2.3.4")).toBe(true)

    limiter.reset("1.2.3.4")
    expect(limiter.isBlocked("1.2.3.4")).toBe(false)
  })

  it("only counts failures that fall inside the window", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    limiter.recordFailure("1.2.3.4")
    limiter.recordFailure("1.2.3.4")

    vi.advanceTimersByTime(WINDOW_MS + 1)
    limiter.recordFailure("1.2.3.4")

    expect(limiter.isBlocked("1.2.3.4")).toBe(false)
  })

  it("cleanup removes expired keys and reports the count", () => {
    const limiter = createInMemoryRateLimiter({
      maxFailures: MAX_FAILURES,
      windowMs: WINDOW_MS,
    })
    limiter.recordFailure("expired-key")
    limiter.recordFailure("live-key")

    vi.advanceTimersByTime(WINDOW_MS + 1)
    limiter.recordFailure("live-key")

    const removed = limiter.cleanup()
    expect(removed).toBe(1)

    expect(limiter.isBlocked("expired-key")).toBe(false)
    expect(limiter.isBlocked("live-key")).toBe(false)
  })
})

describe("getClientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api/send-payslip", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    })
    expect(getClientIp(request)).toBe("203.0.113.9")
  })

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost/api/send-payslip", {
      headers: { "x-real-ip": "198.51.100.7" },
    })
    expect(getClientIp(request)).toBe("198.51.100.7")
  })

  it("returns 'unknown' when no headers are present", () => {
    const request = new Request("http://localhost/api/send-payslip")
    expect(getClientIp(request)).toBe("unknown")
  })
})
