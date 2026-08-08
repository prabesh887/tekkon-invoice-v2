import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            username: z.string().min(1),
            password: z.string().min(1),
          })
          .safeParse(credentials)

        if (!parsed.success) {
          console.log("🔴 Validation failed:", parsed.error)
          return null
        }

        const { username, password } = parsed.data
        const adminUsername = process.env.ADMIN_USERNAME
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

        if (!adminUsername || !adminPasswordHash) {
          console.error("❌ Missing ADMIN_USERNAME or ADMIN_PASSWORD_HASH")
          throw new Error("Admin credentials not configured")
        }

        if (username !== adminUsername) {
          return null
        }

        const isValid = await bcrypt.compare(password, adminPasswordHash)

        if (!isValid) {
          return null
        }

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
