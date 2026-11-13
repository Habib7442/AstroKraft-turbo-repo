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
const RETRY_ERROR = "We couldn't check your earlier payment just now. Please try again in a moment.";

type RazorpayOrder = { id: string; amount: number | string; currency: string; status?: string };
type RegistrationRow = Pick<MasterclassRegistration, "id" | "whatsapp" | "razorpay_order_id" | "payment_status" | "created_at">;

const alreadyPaid = (registrationId: string) => NextResponse.json({ alreadyPaid: true, registrationId });
const retryLater = () => NextResponse.json({ error: RETRY_ERROR }, { status: 503 });

/** A Razorpay order the buyer can still complete at the current fee. */
const isPayable = (order: RazorpayOrder) =>
  (order.status === "created" || order.status === "attempted") && Number(order.amount) === MASTERCLASS_AMOUNT_PAISE;

// The amount is fixed server-side; the client only sends name + WhatsApp (and,
// on a retry, the registration id create-order gave it the first time).
export async function POST(req: NextRequest) {
  const parsed = masterclassRegistrationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your details." }, { status: 400 });
  }
  const data = parsed.data;
  // Honeypot: a bot filled the hidden field. Nothing is written or charged.
  if (data.website) return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });

  const whatsapp = normalizeIndianMobile(data.whatsapp);
  // amount_paise is deliberately absent: it's written only together with the
  // order id it belongs to (insert / order claim below), so an outstanding
  // older order never has its amount rewritten.
  const details = {
    full_name: data.fullName,
    whatsapp,
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
    const razorpay = getRazorpayClient();

    const loadRow = async (id: string) => {
      const { data: row, error } = await supabase
        .from("masterclass_registrations")
        .select("id, whatsapp, razorpay_order_id, payment_status, created_at")
        .eq("id", id)
        .maybeSingle<RegistrationRow>();
      if (error) throw error;
      return row;
    };

    // Only the visitor's own earlier attempt (id held in their browser) is
    // reused, and only for the same number within the window. A stranger who
    // knows someone's phone number gets a fresh row of their own.
    let recent: RegistrationRow | null = null;
    if (data.registrationId) {
      const row = await loadRow(data.registrationId);
      const fresh = row && Date.now() - new Date(row.created_at).getTime() < REUSE_WINDOW_MS;
      if (row && fresh && row.whatsapp === whatsapp) {
        if (row.payment_status === "paid") return alreadyPaid(row.id);
        if (row.payment_status === "pending" || row.payment_status === "failed") recent = row;
      }
    }

    // Reuse the stored order while Razorpay says it can still be paid. If its
    // state can't be checked, stop: an unknown order may still be payable (a
    // slow UPI approval), and a second order could charge the buyer twice.
    let reusableOrder: RazorpayOrder | null = null;
    if (recent?.razorpay_order_id) {
      let existing: RazorpayOrder;
      try {
        existing = (await razorpay.orders.fetch(recent.razorpay_order_id)) as RazorpayOrder;
      } catch (fetchError) {
        console.error("masterclass create-order: could not fetch existing order", recent.razorpay_order_id, fetchError);
        return retryLater();
      }
      if (existing.status === "paid") {
        // Paid but not yet recorded (verify call and webhook both missed so far).
        const payments = await razorpay.orders.fetchPayments(existing.id);
        const captured = payments.items.find((p) => p.status === "captured");
        const row = captured ? await markRegistrationPaid(existing.id, captured.id, recent.id, Number(captured.amount)) : null;
        return row ? alreadyPaid(row.id) : retryLater();
      }
      if (isPayable(existing)) reusableOrder = existing;
    }

    let registrationId: string;
    if (recent) {
      // Never touch a row that turned paid meanwhile (a webhook can land
      // between the lookup above and this write).
      const { data: row, error } = await supabase
        .from("masterclass_registrations")
        .update({ ...details, payment_status: "pending" })
        .eq("id", recent.id)
        .neq("payment_status", "paid")
        .select("id")
        .maybeSingle<Pick<MasterclassRegistration, "id">>();
      if (error) throw error;
      if (!row) {
        const current = await loadRow(recent.id);
        if (current?.payment_status === "paid") return alreadyPaid(current.id);
        throw new Error("masterclass registration update matched no row");
      }
      registrationId = row.id;
    } else {
      const { data: row, error } = await supabase
        .from("masterclass_registrations")
        .insert({ ...details, amount_paise: MASTERCLASS_AMOUNT_PAISE })
        .select("id")
        .single<Pick<MasterclassRegistration, "id">>();
      if (error || !row) throw error ?? new Error("registration insert returned no row");
      registrationId = row.id;
    }

    let order: RazorpayOrder;
    if (reusableOrder) {
      order = reusableOrder;
    } else {
      const created = (await createRazorpayOrder({
        amount: MASTERCLASS_AMOUNT_PAISE,
        currency: "INR",
        receipt: `mc_${registrationId.slice(0, 8)}_${Date.now()}`.slice(0, 40),
        notes: { app: MASTERCLASS_APP, registrationId }
      })) as RazorpayOrder;

      // Compare-and-swap: store the new order only if the row still holds the
      // order id we read. If two requests race, exactly one order is attached
      // to the row and both return that one (the loser's order is never shown
      // to the buyer, so it can't be paid).
      const previousOrderId = recent?.razorpay_order_id ?? null;
      let claim = supabase
        .from("masterclass_registrations")
        .update({ razorpay_order_id: created.id, amount_paise: MASTERCLASS_AMOUNT_PAISE })
        .eq("id", registrationId)
        .neq("payment_status", "paid");
      claim = previousOrderId ? claim.eq("razorpay_order_id", previousOrderId) : claim.is("razorpay_order_id", null);
      const { data: claimed, error: claimError } = await claim.select("id").maybeSingle();
      if (claimError) throw claimError;

      if (claimed) {
        order = created;
      } else {
        const current = await loadRow(registrationId);
        if (current?.payment_status === "paid") return alreadyPaid(current.id);
        if (!current?.razorpay_order_id) throw new Error("masterclass order claim lost but no order stored");
        let winner: RazorpayOrder;
        try {
          winner = (await razorpay.orders.fetch(current.razorpay_order_id)) as RazorpayOrder;
        } catch (fetchError) {
          console.error("masterclass create-order: could not fetch winning order", current.razorpay_order_id, fetchError);
          return retryLater();
        }
        if (!isPayable(winner)) return retryLater();
        order = winner;
      }
    }

    // Follow-up list for the team: everyone who started checkout, tab
    // "Leads - Not Paid" (status "Initiated", de-duplicated by phone; flipped
    // to "Paid" by syncRegistrationToSheet). Runs after the response is sent,
    // so it never delays opening Razorpay.
    after(() => recordInitiatedLead(data.fullName, whatsapp));

    void sendMetaEvent({
      eventName: "InitiateCheckout",
      eventId: masterclassEventId("initiate", registrationId),
      lead: { ...details, city: "", state: "" },
      customData: { currency: "INR", value: MASTERCLASS_AMOUNT_PAISE / 100 }
    });

    return NextResponse.json({
      registrationId,
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
