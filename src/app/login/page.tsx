"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Free photo by Huy Phan on Unsplash (Unsplash License)
const LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1742199009963-c028d0c5a603?auto=format&fit=crop&w=2000&q=80"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          username,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Incorrect username or password. Please try again.")
        } else {
          router.push("/")
          router.refresh()
        }
      } catch {
        setError("Something went wrong. Please try again in a moment.")
      }
    })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-12">
      {/* Full-bleed background photo with slow zoom */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGIN_IMAGE}
        alt=""
        aria-hidden
        className="login-bg-zoom absolute inset-0 h-full w-full object-cover"
      />
      <style>{`
        @keyframes login-bg-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.12); }
        }
        .login-bg-zoom {
          animation: login-bg-zoom 30s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .login-bg-zoom { animation: none; }
        }
      `}</style>

      {/* Overlay: darkens the photo so the card and text stand out */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-primary/40"
      />
      {/* Floating login card */}
      <Card className="relative w-full max-w-md border-white/20 bg-background/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your admin account to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isPending}
                aria-invalid={!!error}
                className="bg-background/70"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  aria-invalid={!!error}
                  className="bg-background/70 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !username || !password}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Authorized personnel only.
          </p>
        </CardContent>
      </Card>

      {/* Photo credit */}
      <p className="absolute bottom-4 w-full px-4 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Tekkon Technologies | Payslip
      </p>
    </main>
  )
}
