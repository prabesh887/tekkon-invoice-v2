import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { createInMemoryRateLimiter, getClientIp } from "@/lib/rate-limiter"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

const loginRateLimiter = createInMemoryRateLimiter({
  maxFailures: MAX_FAILED_ATTEMPTS,
  windowMs: LOCKOUT_WINDOW_MS,
})

// Avoid holding onto stale entries indefinitely.
const interval = setInterval(() => {
  loginRateLimiter.cleanup()
}, CLEANUP_INTERVAL_MS)

interval.unref?.()

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip = getClientIp(request)

        // Block requests from IPs that have exceeded the failure limit.
        if (loginRateLimiter.isBlocked(ip)) {
          return null
        }

        const parsed = z
          .object({
            username: z.string().min(1),
            password: z.string().min(1),
          })
          .safeParse(credentials)

        if (!parsed.success) {
          loginRateLimiter.recordFailure(ip)
          return null
        }

        const { username, password } = parsed.data
        const adminUsername = process.env.ADMIN_USERNAME
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

        if (!adminUsername || !adminPasswordHash) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD_HASH")
          }
          throw new Error("Admin credentials not configured")
        }

        if (username !== adminUsername) {
          loginRateLimiter.recordFailure(ip)
          return null
        }

        const isValid = await bcrypt.compare(password, adminPasswordHash)

        if (!isValid) {
          loginRateLimiter.recordFailure(ip)
          return null
        }

        // Successful login clears any prior failures for this IP.
        loginRateLimiter.reset(ip)

        return {
          id: "1",
          name: adminUsername,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})
