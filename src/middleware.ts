import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected route patterns
const protectedRoutes = ["/user", "/operator", "/admin"];
const authRoutes = ["/login"];
const changePasswordRoute = "/change-password";

// Role-based access mapping
const roleAccess: Record<string, string[]> = {
  "/user": ["USER", "OPERATOR", "ADMIN"],
  "/operator": ["OPERATOR", "ADMIN"],
  "/admin": ["ADMIN"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token
  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
  });

  const isAuthenticated = !!token;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isChangePasswordRoute = pathname.startsWith(changePasswordRoute);

  // Allow change-password route for authenticated users who need to change password
  if (isAuthenticated && isChangePasswordRoute) {
    return NextResponse.next();
  }

  // Force redirect to change-password if mustChangePassword is true
  if (
    isAuthenticated &&
    isProtectedRoute &&
    token.mustChangePassword === true
  ) {
    return NextResponse.redirect(new URL("/user/profil", request.url));
  }

  // Redirect authenticated users away from auth routes (login)
  if (isAuthenticated && isAuthRoute) {
    // If must change password, redirect to change-password
    if (token.mustChangePassword === true) {
      return NextResponse.redirect(new URL("/user/profil", request.url));
    }

    const role = token.role as string;
    let redirectPath = "/user/dashboard";

    if (role === "OPERATOR") redirectPath = "/operator/dashboard";
    else if (role === "ADMIN") redirectPath = "/admin/dashboard";

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect unauthenticated users from change-password to login
  if (!isAuthenticated && isChangePasswordRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check role-based access
  if (isAuthenticated && isProtectedRoute) {
    const role = token.role as string;

    for (const [route, allowedRoles] of Object.entries(roleAccess)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(role)) {
          // Redirect to appropriate dashboard based on role
          let redirectPath = "/user/dashboard";
          if (role === "OPERATOR") redirectPath = "/operator/dashboard";
          else if (role === "ADMIN") redirectPath = "/admin/dashboard";

          return NextResponse.redirect(new URL(redirectPath, request.url));
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes (except auth)
    "/((?!_next/static|_next/image|favicon.ico|api(?!/auth)).*)",
  ],
};
