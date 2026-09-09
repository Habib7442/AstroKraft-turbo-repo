import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { reviewSchema } from "@astrokraft/validators";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/ensure-profile";

// An order that never reached a real payment (created/payment_pending/payment_failed)
// or was cancelled outright never delivered the product — everything else means
// the customer actually paid for and received it at some point.
const NON_PURCHASE_ORDER_STATUSES = ["created", "payment_pending", "payment_failed", "cancelled"];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid review." }, { status: 400 });
    }

    const { rating, comment, productId } = parsed.data;

    // reviews.user_id has a FK to profiles(id) — same reasoning as
    // create-order: don't depend on the Clerk webhook's async timing.
    await ensureProfile(userId);

    const supabase = getSupabaseAdminClient();

    const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("is_active", true).maybeSingle();
    if (!product) {
      return NextResponse.json({ error: "This product could not be found." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "You've already reviewed this product." }, { status: 400 });
    }

    const { data: purchases } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", productId)
      .eq("orders.user_id", userId);
    const isVerifiedBuyer = (purchases ?? []).some(
      (item: any) => !NON_PURCHASE_ORDER_STATUSES.includes(item.orders?.status)
    );

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        product_id: productId,
        rating,
        comment: comment.trim(),
        is_verified_buyer: isVerifiedBuyer,
        status: "pending"
      })
      .select()
      .single();

    if (insertError) {
      // 23505 = unique_violation on reviews_user_id_product_id_key — the
      // SELECT check above is best-effort only; this is what actually
      // catches a duplicate under concurrent requests for the same
      // (user_id, product_id) that both passed that check before either
      // insert committed.
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "You've already reviewed this product." }, { status: 400 });
      }
      throw insertError;
    }

    return NextResponse.json({ reviewId: review.id, status: review.status });
  } catch (err: any) {
    console.error("reviews create error:", err);
    return NextResponse.json({ error: "Failed to submit your review." }, { status: 500 });
  }
}
