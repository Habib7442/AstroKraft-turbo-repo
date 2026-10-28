import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { VastuLead } from "@astrokraft/db";
import { PayPanel } from "@/components/pay-panel";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { BRAND, CONSULTATION_FEE_LABEL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Complete your payment | ${BRAND}`,
  robots: { index: false, follow: false }
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Where the visitor lands right after booking a slot in Cal.com. The leadId
// is an unguessable UUID; the page shows only a first name and the slot.
export default async function PayPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  if (!UUID_RE.test(leadId)) notFound();

  const { data: lead } = await getSupabaseAdminClient()
    .from("vastu_leads")
    .select("id, full_name, scheduled_start, payment_status, floor_plan_available")
    .eq("id", leadId)
    .maybeSingle<Pick<VastuLead, "id" | "full_name" | "scheduled_start" | "payment_status" | "floor_plan_available">>();
  if (!lead) notFound();

  const firstName = lead.full_name.trim().split(/\s+/)[0];
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    lead.scheduled_start ? new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: "Asia/Kolkata" }).format(new Date(lead.scheduled_start)) : null;
  const slot = fmt({ dateStyle: "full", timeStyle: "short" });
  const shortSlot = fmt({ weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <p className="text-center font-display text-sm tracking-[0.25em] text-gold-soft">VASTU by BIPRANGSHU™</p>
      <div className="mt-6 rounded-3xl border border-gold/40 bg-night-800 p-6">
        <p className="eyebrow">Step 3 of 3 · Payment</p>
        <h1 className="mt-2 text-2xl font-extrabold text-cream">Hi {firstName}, your slot is reserved</h1>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-night-600 bg-night-700 p-4 text-sm">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
          <div>
            <p className="font-semibold text-cream">Flat Vastu Report + Expert Call</p>
            <p className="text-muted">{slot ? `${slot} (IST)` : "Slot details are in your SMS / email confirmation"}</p>
          </div>
        </div>
        <div className="mt-5 flex items-baseline justify-between border-t border-night-600 pt-4">
          <span className="text-muted">Consultation fee</span>
          <span className="text-3xl font-extrabold text-cream">{CONSULTATION_FEE_LABEL}</span>
        </div>
        <PayPanel
          leadId={lead.id}
          initiallyPaid={lead.payment_status === "paid"}
          fullName={lead.full_name}
          slot={shortSlot}
          hasFloorPlan={lead.floor_plan_available}
        />
      </div>
    </main>
  );
}
