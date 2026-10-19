import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { VastuLead, VastuLeadStatus } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { confirmCalBooking } from "@/lib/cal-api";

// Cal.com webhook → vastu_leads. Configure in Cal.com: Settings → Developer →
// Webhooks, URL https://<site>/api/webhooks/cal, a secret (= CAL_WEBHOOK_SECRET),
// and the triggers handled below. Cal.com signs the raw body with
// HMAC-SHA256(secret) in the X-Cal-Signature-256 header.

type CalAttendee = { name?: string; email?: string; phoneNumber?: string | null; timeZone?: string };
type CalPayload = {
  uid?: string;
  bookingId?: number;
  rescheduleUid?: string;
  startTime?: string;
  endTime?: string;
  attendees?: CalAttendee[];
  metadata?: Record<string, unknown>;
  responses?: Record<string, { value?: unknown } | undefined>;
};

const STATUS_BY_TRIGGER: Partial<Record<string, VastuLeadStatus>> = {
  // "Requires confirmation" is on: a new (unpaid) booking arrives as
  // BOOKING_REQUESTED; BOOKING_CREATED follows once it is confirmed after payment.
  BOOKING_REQUESTED: "booked",
  BOOKING_CREATED: "booked",
  BOOKING_RESCHEDULED: "rescheduled",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_REJECTED: "cancelled",
  MEETING_ENDED: "completed"
};

// Payment is not taken in Cal.com — Razorpay on /pay/<leadId> sets payment_status.
const HANDLED_TRIGGERS = new Set(Object.keys(STATUS_BY_TRIGGER));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function responseValue(payload: CalPayload, key: string): string | undefined {
  const value = payload.responses?.[key]?.value;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-cal-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { triggerEvent?: string; payload?: CalPayload };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const trigger = event.triggerEvent ?? "";
  const payload = event.payload ?? {};
  // PING (Cal.com's "test webhook") and triggers we don't track: acknowledge.
  if (!HANDLED_TRIGGERS.has(trigger) || !payload.uid) {
    return NextResponse.json({ ok: true, ignored: trigger || "unknown" });
  }

  const supabase = getSupabaseAdminClient();
  const attendee = payload.attendees?.[0];
  const metaLeadId = typeof payload.metadata?.leadId === "string" ? payload.metadata.leadId : undefined;

  // Find the lead: the leadId we put into the embed's booking metadata, else
  // this booking's uid, else (on reschedule) the uid it replaced.
  const findBy = async (column: "id" | "cal_booking_uid", value: string | undefined) => {
    if (!value || (column === "id" && !UUID_RE.test(value))) return null;
    const { data } = await supabase.from("vastu_leads").select("*").eq(column, value).maybeSingle<VastuLead>();
    return data;
  };
  // metadata[leadId] can be set by anyone holding the Cal.com link (it is a URL
  // param), so it only identifies the lead's OWN booking: the lead's first
  // booking, the same booking again, or a reschedule of it. Any other booking
  // carrying a lead's id — e.g. a paid customer booking extra slots via the raw
  // link — must not take over that row (or be auto-confirmed off its payment);
  // it falls through to its own unpaid row below.
  const isOwnBooking = (l: VastuLead) =>
    !l.cal_booking_uid ||
    l.cal_booking_uid === payload.uid ||
    (!!payload.rescheduleUid && l.cal_booking_uid === payload.rescheduleUid);
  const metaLead = await findBy("id", metaLeadId);
  const lead =
    (metaLead && isOwnBooking(metaLead) ? metaLead : null) ??
    (await findBy("cal_booking_uid", payload.uid)) ??
    (await findBy("cal_booking_uid", payload.rescheduleUid));

  const update: Partial<VastuLead> = {
    cal_booking_uid: payload.uid,
    cal_booking_id: payload.bookingId ?? null,
    attendee_email: attendee?.email ?? lead?.attendee_email ?? null,
    scheduled_start: payload.startTime ?? lead?.scheduled_start ?? null,
    scheduled_end: payload.endTime ?? lead?.scheduled_end ?? null,
    last_cal_event: trigger,
    cal_payload: payload as Record<string, unknown>
  };
  const status = STATUS_BY_TRIGGER[trigger];
  // Late/out-of-order deliveries must not move a finished booking backwards.
  const terminal = lead && (lead.status === "cancelled" || lead.status === "completed");
  if (status && !(terminal && (status === "booked" || status === "rescheduled"))) update.status = status;

  if (lead) {
    const { error } = await supabase.from("vastu_leads").update(update).eq("id", lead.id);
    if (error) {
      console.error("cal webhook update failed:", error);
      return NextResponse.json({ error: "db error" }, { status: 500 });
    }
    // Paid before this booking's webhook arrived (or a paid booking was
    // rescheduled into a new pending booking): confirm it now. isOwnBooking
    // is re-checked so a payment only ever confirms the booking it paid for.
    if (trigger === "BOOKING_REQUESTED" && lead.payment_status === "paid" && isOwnBooking(lead)) {
      await confirmCalBooking(payload.uid);
    }
  } else {
    // A booking with no row of its own: made outside the landing-page form
    // (the raw Cal.com link), or carrying another lead's id (see isOwnBooking).
    // It gets its own unpaid row and is never auto-confirmed.
    const phone = responseValue(payload, "attendeePhoneNumber") ?? attendee?.phoneNumber ?? "";
    const { error } = await supabase
      .from("vastu_leads")
      .upsert(
        {
          ...update,
          status: update.status ?? "booked",
          full_name: attendee?.name ?? responseValue(payload, "name") ?? "Unknown",
          whatsapp: phone,
          city: "",
          state: "",
          business_category: "Unknown",
          business_stage: "existing",
          admin_notes: metaLead
            ? `Booked via Cal.com with lead ${metaLead.id}'s link — a separate booking, not covered by that lead's payment.`
            : null
        },
        { onConflict: "cal_booking_uid" }
      );
    if (error) {
      console.error("cal webhook insert failed:", error);
      return NextResponse.json({ error: "db error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
