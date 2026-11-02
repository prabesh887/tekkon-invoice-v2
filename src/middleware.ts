import { NextResponse } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === "/login"
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")

  // Allow Auth.js internal routes to pass through
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // API routes: return 401 if not authenticated
  if (isApiRoute && !isLoggedIn) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Protected pages: redirect to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to home if already logged in on login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder (optional)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
