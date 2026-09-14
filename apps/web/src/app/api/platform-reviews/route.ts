import { NextRequest, NextResponse } from "next/server";
import { platformReviewSchema } from "@astrokraft/validators";
import type { PlatformReview } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";

const RATE_LIMIT_MAX_PER_HOUR = 3;

// Public testimonials - no sign-in required, unlike /api/reviews (which
// requires a Clerk session and ties a review to one signed-in buyer). The
// honeypot field below only stops a bot naive enough to fill every input; a
// caller that simply omits it could otherwise create unlimited pending rows
// via the service-role client (which bypasses RLS) - no database-capacity
// protection, and no protection for the admin moderation queue itself.
// create_platform_review rate-limits by submitter IP instead (there's no
// phone/email collected here to key on, unlike purohit bookings).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = platformReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid review." }, { status: 400 });
    }

    const data = parsed.data;

    // A bot fills the hidden honeypot field. Respond exactly like a real
    // success so the bot cannot tell the submission was rejected, but write
    // nothing.
    if (data.website) {
      return NextResponse.json({ reviewId: "ok", status: "pending" });
    }

    // x-forwarded-for can carry a client-supplied chain ("client, proxy1,
    // proxy2") - the first entry is what Vercel's own edge network recorded
    // as the connecting client, the only part not trivially spoofable by
    // the caller.
    const submitterIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const supabase = getSupabaseAdminClient();

    // Count-then-insert as two separate round-trips would let two
    // concurrent requests from the same IP both read count < limit before
    // either commits (TOCTOU). create_platform_review does both inside one
    // transaction, serialized per-IP with a Postgres advisory lock, so the
    // limit holds even under real concurrency.
    const { data: review, error: rpcError } = await supabase
      .rpc("create_platform_review", {
        p_name: data.name.trim(),
        p_rating: data.rating,
        p_comment: data.comment.trim(),
        p_submitter_ip: submitterIp,
        p_rate_limit_max: RATE_LIMIT_MAX_PER_HOUR,
        p_rate_limit_window: "1 hour"
      })
      .single<PlatformReview>();

    if (rpcError) {
      if (rpcError.message?.includes("rate_limit_exceeded")) {
        return NextResponse.json(
          { error: "You've submitted a few reviews already. Please try again later." },
          { status: 429 }
        );
      }
      throw rpcError;
    }

    return NextResponse.json({ reviewId: review.id, status: review.status });
  } catch (err: any) {
    console.error("platform-reviews create error:", err);
    return NextResponse.json({ error: "Failed to submit your review." }, { status: 500 });
  }
}
