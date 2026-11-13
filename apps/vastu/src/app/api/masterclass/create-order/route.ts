import { after, NextRequest, NextResponse } from "next/server";
import { recordInitiatedLead } from "@/lib/google-sheets";
import { createRazorpayOrder, getRazorpayClient } from "@astrokraft/payments";
import type { MasterclassRegistration } from "@astrokraft/db";
import { masterclassRegistrationSchema, normalizeIndianMobile, VASTU_PRIVACY_NOTICE_VERSION } from "@astrokraft/validators";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendMetaEvent } from "@/lib/meta-capi";
import { MASTERCLASS_AMOUNT_PAISE, MASTERCLASS_APP, markRegistrationPaid, masterclassEventId } from "@/lib/masterclass";
import { WORKSHOP_DATE_LABEL } from "@/lib/workshop";

// A retry within this window (closed the checkout, payment failed, refreshed)
// reuses the same row and, while it can still be paid, the same Razorpay
// order — so a slow UPI approval on the first order can't end up paid twice.
const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

const GENERIC_ERROR = "Could not start payment. Please try again or message us on WhatsApp.";

// The amount is fixed server-side; the client only sends name + WhatsApp.
export async function POST(req: NextRequest) {
  const parsed = masterclassRegistrationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your details." }, { status: 400 });
  }
  const data = parsed.data;
  // Honeypot: a bot filled the hidden field. Nothing is written or charged.
  if (data.website) return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });

  const whatsapp = normalizeIndianMobile(data.whatsapp);
  const details = {
    full_name: data.fullName,
    whatsapp,
    amount_paise: MASTERCLASS_AMOUNT_PAISE,
    session_label: WORKSHOP_DATE_LABEL,
    utm_source: data.attribution.utm_source ?? null,
    utm_medium: data.attribution.utm_medium ?? null,
    utm_campaign: data.attribution.utm_campaign ?? null,
    utm_content: data.attribution.utm_content ?? null,
    utm_term: data.attribution.utm_term ?? null,
    fbclid: data.attribution.fbclid ?? null,
    fbp: data.attribution.fbp ?? null,
    fbc: data.attribution.fbc ?? null,
    user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null,
    // Notice sits next to the Book Now button; pressing it is the affirmative act.
    consent_notice_version: VASTU_PRIVACY_NOTICE_VERSION,
    consented_at: new Date().toISOString()
  };

  try {
    const supabase = getSupabaseAdminClient();

    const { data: recent } = await supabase
      .from("masterclass_registrations")
      .select("id, razorpay_order_id, amount_paise")
      .eq("whatsapp", whatsapp)
      .in("payment_status", ["pending", "failed"])
      .gte("created_at", new Date(Date.now() - REUSE_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<MasterclassRegistration, "id" | "razorpay_order_id" | "amount_paise">>();

    // Reuse the stored order while Razorpay says it can still be paid.
    let reusableOrder: { id: string; amount: number | string; currency: string } | null = null;
    if (recent?.razorpay_order_id) {
      const existing = await getRazorpayClient().orders.fetch(recent.razorpay_order_id).catch(() => null);
      if (existing?.status === "paid") {
        // Paid but not yet recorded (verify call and webhook both missed so far).
        const payments = await getRazorpayClient().orders.fetchPayments(existing.id);
        const captured = payments.items.find((p) => p.status === "captured");
        if (captured) {
          const row = await markRegistrationPaid(existing.id, captured.id, recent.id);
          if (row) return NextResponse.json({ alreadyPaid: true, registrationId: row.id });
        }
      } else if (existing && (existing.status === "created" || existing.status === "attempted") && Number(existing.amount) === MASTERCLASS_AMOUNT_PAISE) {
        reusableOrder = existing;
      }
    }

    const { data: row, error } = recent
      ? await supabase
          .from("masterclass_registrations")
          .update({ ...details, payment_status: "pending" })
          .eq("id", recent.id)
          .select("id")
          .single<Pick<MasterclassRegistration, "id">>()
      : await supabase.from("masterclass_registrations").insert(details).select("id").single<Pick<MasterclassRegistration, "id">>();
    if (error || !row) throw error ?? new Error("registration write returned no row");

    const order =
      reusableOrder ??
      (await createRazorpayOrder({
        amount: MASTERCLASS_AMOUNT_PAISE,
        currency: "INR",
        receipt: `mc_${row.id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
        notes: { app: MASTERCLASS_APP, registrationId: row.id }
      }));

    const { error: orderError } = await supabase
      .from("masterclass_registrations")
      .update({ razorpay_order_id: order.id })
      .eq("id", row.id)
      .neq("payment_status", "paid");
    if (orderError) throw orderError;

    // Follow-up list for the team: everyone who started checkout, tab
    // "Leads - Not Paid" (status "Initiated", de-duplicated by phone; flipped
    // to "Paid" by syncRegistrationToSheet). Runs after the response is sent,
    // so it never delays opening Razorpay.
    after(() => recordInitiatedLead(data.fullName, whatsapp));

    void sendMetaEvent({
      eventName: "InitiateCheckout",
      eventId: masterclassEventId("initiate", row.id),
      lead: { ...details, city: "", state: "" },
      customData: { currency: "INR", value: MASTERCLASS_AMOUNT_PAISE / 100 }
    });

    return NextResponse.json({
      registrationId: row.id,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: { name: data.fullName, contact: whatsapp }
    });
  } catch (error) {
    console.error("masterclass create-order failed:", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
