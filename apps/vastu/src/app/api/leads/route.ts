import { NextRequest, NextResponse } from "next/server";
import { normalizeIndianMobile, vastuLeadSchema, VASTU_PRIVACY_NOTICE_VERSION } from "@astrokraft/validators";
import type { VastuLead } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendMetaEvent } from "@/lib/meta-capi";

// A person who abandons the Cal.com step and comes back the same day keeps
// one lead row instead of piling up duplicates.
const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = vastuLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your details." }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot: look successful, write nothing.
  if (data.website) {
    return NextResponse.json({ leadId: crypto.randomUUID() });
  }

  const whatsapp = normalizeIndianMobile(data.whatsapp);
  const row = {
    full_name: data.fullName,
    whatsapp,
    city: data.city,
    // The short flat-Vastu form doesn't ask these; the columns predate it.
    state: "",
    business_category: "Flat / Apartment",
    business_stage: "existing" as const,
    problems: data.concern ? [data.concern] : [],
    floor_plan_available: data.floorPlanAvailable ?? false,
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
    consent_notice_version: VASTU_PRIVACY_NOTICE_VERSION,
    consented_at: new Date().toISOString()
  };

  try {
    const supabase = getSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("vastu_leads")
      .select("id")
      .eq("whatsapp", whatsapp)
      .eq("status", "lead")
      .is("cal_booking_uid", null)
      .gte("created_at", new Date(Date.now() - REUSE_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<VastuLead, "id">>();

    const { data: lead, error } = existing
      ? await supabase.from("vastu_leads").update(row).eq("id", existing.id).select("id").single<Pick<VastuLead, "id">>()
      : await supabase.from("vastu_leads").insert(row).select("id").single<Pick<VastuLead, "id">>();

    if (error || !lead) throw error ?? new Error("lead write returned no row");

    await sendMetaEvent({
      eventName: "Lead",
      eventId: `lead_${lead.id}`,
      lead: row,
      customData: { content_category: data.concern ?? "Flat / Apartment" }
    });

    return NextResponse.json({ leadId: lead.id, whatsapp });
  } catch (error) {
    console.error("vastu lead write failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again or message us on WhatsApp." }, { status: 500 });
  }
}
