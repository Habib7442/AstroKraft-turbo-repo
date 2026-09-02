import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    const email = email_addresses[0]?.email_address ?? null;
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;
    const role = public_metadata?.role === "admin" ? "admin" : "customer";

    const { error } = await supabase.from("profiles").upsert({
      id,
      email,
      full_name: fullName,
      role
    });

    if (error) {
      console.error("Failed to upsert profile:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete profile:", error);
        return new Response("Database error", { status: 500 });
      }
    }
  }

  return new Response("OK", { status: 200 });
}
