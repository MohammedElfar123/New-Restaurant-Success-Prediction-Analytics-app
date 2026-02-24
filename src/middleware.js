import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

// Create the intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // Extract locale from pathname and validate it
  const supportedLocales = ["en", "ar"];
  const pathLocale = pathname.split("/")[1];
  const locale = supportedLocales.includes(pathLocale) ? pathLocale : "en";

  // Public routes (don't need authentication)
  const publicRoutes = [
    "/admin/login",
    "/hospital/login",
    "/doctor/login",
    "/forgot-password",
    "/reset-password"
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.includes(route));

  // Check if user is authenticated
  const token = request.cookies.get("access_token")?.value;
  const userType = request.cookies.get("user_type")?.value; // admin, hospital, doctor

  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    // Redirect to appropriate login based on path
    let loginPath = "/admin/login";
    if (pathname.includes("/hospital/")) {
      loginPath = "/hospital/login";
    } else if (pathname.includes("/doctor/")) {
      loginPath = "/doctor/login";
    }

    const loginUrl = new URL(`/${locale}${loginPath}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login page, redirect to appropriate dashboard
  if (token && isPublicRoute) {
    let dashboardPath = "/admin/users";

    if (userType === "hospital") {
      dashboardPath = "/hospital/dashboard";
    } else if (userType === "doctor") {
      dashboardPath = "/doctor/dashboard";
    }

    const dashboardUrl = new URL(`/${locale}${dashboardPath}`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Apply intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
