import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { INDEXABLE_LOCALES, LOCALES } from "@/lib/locales";

const DEFAULT_LOCALE = "en";

// Routes at the true root (outside the [locale] segment) that must never
// get an /en prefix.
const LOCALE_EXEMPT_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

// First path segments reserved for internal routing, matched as a whole
// segment (not a prefix) - "/api" must not also swallow "/apiary" and send
// a real page path down the wrong branch.
const LOCALE_EXEMPT_FIRST_SEGMENTS = new Set(["_next", "api", "trpc", "__clerk", "ingest"]);

// Paths from the previous site that Google still crawls. Unknown slugs fall
// through to [category] and render "not found" with a 200 (the loading.tsx
// stream has already started), so map them to a real page instead.
// "" means the homepage.
const LEGACY_SLUGS: Record<string, string> = {
  gemstones: "vedic-gemstones",
  "sign-in": "",
  "sign-up": ""
};

// Query params old links carried that no page reads any more. The booking
// flow assigns the astrologer itself, so ?astrologer= only duplicates
// /consultation.
const LEGACY_QUERY_PARAMS: Record<string, string[]> = {
  consultation: ["astrologer"]
};

// Each page has exactly one indexable URL: /en/<path>, no trailing slash.
// Everything else - no locale (/rudraksha), the untranslated /bn twin, a
// trailing slash (/en/ - Next's own slash redirect is off for the PostHog
// proxy, see next.config.mjs) - gets ONE 308 straight to that URL rather
// than a chain of hops. This lives in middleware because a page-level
// redirect() on a static route renders a 200 with a meta refresh, not a 3xx.
function canonicalPathRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  const { pathname } = url;

  if (LOCALE_EXEMPT_PATHS.has(pathname) || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return undefined;
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  if (LOCALE_EXEMPT_FIRST_SEGMENTS.has(first)) {
    return undefined;
  }

  let target: string[];
  if ((LOCALES as readonly string[]).includes(first)) {
    target = (INDEXABLE_LOCALES as readonly string[]).includes(first)
      ? segments
      : [DEFAULT_LOCALE, ...segments.slice(1)];
  } else {
    target = [DEFAULT_LOCALE, ...segments];
  }

  const legacy = target.length === 2 && Object.hasOwn(LEGACY_SLUGS, target[1]) ? LEGACY_SLUGS[target[1]] : undefined;
  if (legacy !== undefined) {
    target = legacy ? [target[0], legacy] : [target[0]];
  }

  let queryChanged = false;
  const page = target[1] ?? "";
  for (const param of Object.hasOwn(LEGACY_QUERY_PARAMS, page) ? LEGACY_QUERY_PARAMS[page] : []) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      queryChanged = true;
    }
  }

  const targetPath = `/${target.join("/")}`;
  if (targetPath === pathname && !queryChanged) return undefined;

  url.pathname = targetPath;
  return NextResponse.redirect(url, 308);
}

export default clerkMiddleware((_auth, req) => {
  return canonicalPathRedirect(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // "ingest/" is the PostHog analytics proxy - a beacon on every click, so
    // it must skip Clerk's session handling entirely, not just the redirect.
    "/((?!_next|ingest/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy matcher
    "/__clerk/:path*"
  ]
};
