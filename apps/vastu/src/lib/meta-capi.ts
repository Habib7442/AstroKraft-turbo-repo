import "server-only";
import crypto from "crypto";
import type { VastuLead } from "@astrokraft/db";
import { SITE_URL } from "./site";

// Pin an explicit Graph API version; bump before Meta retires it (~2 years
// after release).
const GRAPH_VERSION = "v23.0";

const sha256 = (value: string) => crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

type CapiEvent = {
  eventName: "Lead" | "Schedule" | "Purchase";
  /** Must equal the browser pixel's eventID for the same event so Meta dedupes them. */
  eventId: string;
  lead: Pick<VastuLead, "whatsapp" | "full_name" | "city" | "state" | "fbp" | "fbc" | "ip_address" | "user_agent"> & {
    attendee_email?: string | null;
  };
  customData?: Record<string, unknown>;
};

/**
 * Server-side Conversions API event. A no-op when the pixel/token are not
 * configured, and never throws — tracking must not break a booking write.
 */
export async function sendMetaEvent({ eventName, eventId, lead, customData }: CapiEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return;

  const [firstName, ...rest] = lead.full_name.trim().split(/\s+/);
  const userData: Record<string, unknown> = {
    ph: [sha256(lead.whatsapp.replace(/\D/g, ""))],
    fn: [sha256(firstName ?? "")],
    ct: [sha256(lead.city.replace(/\s+/g, ""))],
    st: [sha256(lead.state.replace(/\s+/g, ""))],
    country: [sha256("in")]
  };
  if (rest.length) userData.ln = [sha256(rest[rest.length - 1])];
  if (lead.attendee_email) userData.em = [sha256(lead.attendee_email)];
  if (lead.fbp) userData.fbp = lead.fbp;
  if (lead.fbc) userData.fbc = lead.fbc;
  if (lead.ip_address) userData.client_ip_address = lead.ip_address;
  if (lead.user_agent) userData.client_user_agent = lead.user_agent;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: SITE_URL,
        user_data: userData,
        custom_data: customData
      }
    ]
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // /api/leads and payment verification wait on this; tracking must never
      // hold up the booking flow. A timeout lands in the catch below.
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) console.error(`Meta CAPI ${eventName} failed:`, res.status, await res.text());
  } catch (error) {
    console.error(`Meta CAPI ${eventName} failed:`, error);
  }
}
