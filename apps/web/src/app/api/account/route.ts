import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { eraseUserData } from "@/lib/erase-user-data";
import { DATA_PROCESSORS } from "@/lib/data-processors";

// DPDP s.11 right to access: everything held about the signed-in user, plus
// who it is shared with.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const user = await currentUser();

    const [profile, orders, consultations, reviews, purohitBookings] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, phone, created_at").eq("id", userId).maybeSingle(),
      supabase.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("consultations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("purohit_bookings").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ]);

    for (const result of [profile, orders, consultations, reviews, purohitBookings]) {
      if (result.error) throw result.error;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        id: userId,
        emailAddresses: user?.emailAddresses.map((e) => e.emailAddress) ?? [],
        phoneNumbers: user?.phoneNumbers.map((p) => p.phoneNumber) ?? [],
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : null
      },
      profile: profile.data,
      orders: orders.data,
      consultations: consultations.data,
      productReviews: reviews.data,
      purohitBookings: purohitBookings.data,
      sharedWith: DATA_PROCESSORS
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="astrokraft-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    console.error("account data export error:", err);
    return NextResponse.json({ error: "Could not prepare your data export." }, { status: 500 });
  }
}

// DPDP s.6(4) withdrawal of consent + s.12(3) erasure, self-service. Data
// first, then the Clerk account - if the Clerk call fails the person can
// simply retry; eraseUserData is idempotent.
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  try {
    await eraseUserData(userId);
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("account delete error:", err);
    return NextResponse.json(
      { error: "We couldn't delete your account. Please try again or email vastubipra@gmail.com." },
      { status: 500 }
    );
  }
}
