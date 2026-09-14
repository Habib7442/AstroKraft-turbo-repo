import { NextRequest, NextResponse } from "next/server";
import { platformReviewSchema } from "@astrokraft/validators";
import { getSupabaseAdminClient } from "@/lib/supabase";

// Public testimonials - no sign-in required, unlike /api/reviews (which
// requires a Clerk session and ties a review to one signed-in buyer). Every
// submission still lands as "pending" and needs admin approval before it's
// visible on /testimonials, which is the actual anti-spam control here
// rather than rate-limiting an anonymous caller.
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

    const supabase = getSupabaseAdminClient();
    const { data: review, error } = await supabase
      .from("platform_reviews")
      .insert({
        name: data.name.trim(),
        rating: data.rating,
        comment: data.comment.trim(),
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ reviewId: review.id, status: review.status });
  } catch (err: any) {
    console.error("platform-reviews create error:", err);
    return NextResponse.json({ error: "Failed to submit your review." }, { status: 500 });
  }
}
