import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { LOCALES } from "@/lib/locales";

// Routes at the true root (outside the [locale] segment) that must never
// get an /en prefix.
const LOCALE_EXEMPT_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

// GSC's Coverage report flagged the bare domain root as "Page with
// redirect" - it was relying on a page-level `redirect("/en")` in
// app/page.tsx, which Next.js renders as a client-side
// `<meta http-equiv="refresh">` for a fully static route instead of a real
// HTTP redirect (confirmed via curl: 200 OK with the meta tag, not a 3xx).
// Separately, any unprefixed path (e.g. "/rudraksha", left over from before
// locale-prefixed URLs existed) matched [locale]/page.tsx with
// locale="rudraksha" and silently rendered duplicate homepage content
// instead of 404ing or redirecting - the same is true for the plain
// domain root once GSC re-crawls it here mid-flight. Doing this in
// middleware (rather than relying on each page's own redirect()/notFound())
// guarantees a real, fast HTTP redirect on every request.
function localePrefixRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const { pathname } = url;

  if (
    LOCALE_EXEMPT_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.startsWith("/__clerk") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return undefined;
  }

  const firstSegment = pathname.split("/")[1] ?? "";
  if ((LOCALES as readonly string[]).includes(firstSegment)) {
    return undefined;
  }

  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 308);
}

export default clerkMiddleware((_auth, req) => {
  return localePrefixRedirect(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy matcher
    "/__clerk/:path*"
  ]
};
