"use client";

import { useEffect } from "react";
import { disableAnalytics, flushAnalyticsQueue } from "@astrokraft/analytics";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Renders nothing - just boots PostHog once, in the browser, after the page
// has settled. Everything here is chosen so this needs no cookie banner and
// can't slow down first paint:
//   - persistence "memory": no cookie, localStorage, or other identifier is
//     ever written to the visitor's device (a full reload starts a fresh
//     anonymous visit, which is the accepted trade-off for that).
//   - session recording off: this site's forms collect names, phone numbers,
//     birth details, and shipping addresses - none of that should ever be
//     recorded. Don't turn this on without masking every input first.
//   - person_profiles "identified_only" + no identify() calls anywhere: we
//     never attach a name/email to a visitor, so events stay anonymous.
//   - api_host "/ingest": same-origin proxy (next.config.mjs rewrites), so
//     the strict CSP needs no new origins and ad-blockers don't drop events.
//   - dynamic import + idle callback: posthog-js stays out of the initial
//     bundle and out of the LCP window.
// Funnel events fired before this finishes (an add-to-cart in the first few
// seconds) are queued in memory by @astrokraft/analytics and replayed, with
// their original timestamps, right after window.posthog is set below.
// With no NEXT_PUBLIC_POSTHOG_KEY set this is a complete no-op.
export function PostHogInit() {
  useEffect(() => {
    if (!POSTHOG_KEY) {
      disableAnalytics();
      return;
    }

    let cancelled = false;

    const start = async () => {
      const { default: posthog } = await import("posthog-js");
      if (cancelled || posthog.__loaded) return;

      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com",
        persistence: "memory",
        person_profiles: "identified_only",
        capture_pageview: "history_change",
        autocapture: true,
        disable_session_recording: true,
        // Not used - skips loading the extra surveys script on every page.
        disable_surveys: true,
        respect_dnt: true
      });

      // logAnalyticsEvent() in @astrokraft/analytics reads this global.
      (window as unknown as { posthog?: unknown }).posthog = posthog;
      flushAnalyticsQueue();
    };

    // A blocked or failed load means the queue would never drain - stop
    // collecting instead of holding events for nothing.
    const startSafely = () => {
      start().catch(disableAnalytics);
    };

    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    const handle = idle ? idle(startSafely, { timeout: 4000 }) : window.setTimeout(startSafely, 2000);

    return () => {
      cancelled = true;
      const cancelIdle = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle && cancelIdle) cancelIdle(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  return null;
}
