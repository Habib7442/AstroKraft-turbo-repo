import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Anton, Poppins } from "next/font/google";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import type { MasterclassRegistration } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { PendingRefresher, PurchasePixel } from "@/components/masterclass/thank-you-client";
import { MASTERCLASS_GROUP_INVITE_URL, syncRegistrationToSheet } from "@/lib/masterclass";
import { WORKSHOP_DATE_LABEL, WORKSHOP_WHATSAPP_DISPLAY } from "@/lib/workshop";
import { whatsappLink } from "@/lib/site";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-mc-display", display: "swap" });
const sans = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mc-sans", display: "swap" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "You're registered — Astro Vastu Masterclass | AstroKraft",
  robots: { index: false, follow: false }
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reached right after checkout with the registration's unguessable UUID.
// The confirmation and the WhatsApp group invite (a server-only env var) are
// rendered ONLY for a row the database records as paid — which only a verified
// checkout signature or a signed Razorpay webhook can set. A client claiming
// success without paying lands on the "confirming" state and nothing more.
export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id || !UUID_RE.test(id)) notFound();

  const { data: row } = await getSupabaseAdminClient()
    .from("masterclass_registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle<MasterclassRegistration>();
  if (!row) notFound();

  const paid = row.payment_status === "paid";
  // Self-heal: if the Sheet write failed earlier, retry once this page has
  // been sent (no-op when the row is already in the Sheet).
  if (paid && !row.sheet_synced_at) after(() => syncRegistrationToSheet(row));

  const sessionLabel = row.session_label ?? WORKSHOP_DATE_LABEL;
  const supportUrl = whatsappLink(`Hi, I paid for the Astro Vastu Masterclass (${row.full_name.trim()}) and need help.`);

  return (
    <div
      className={`${display.variable} ${sans.variable} flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#123066_0%,#0A1F44_45%,#06152E_100%)] px-4 py-10 font-mc-sans text-white`}
    >
      <div className="mc-stars pointer-events-none fixed inset-0 opacity-50" aria-hidden />
      <main className="mc-card relative w-full max-w-lg p-6 text-center sm:p-8">
        {paid ? (
          <>
            <PurchasePixel registrationId={row.id} value={row.amount_paise / 100} />
            <CheckCircle2 className="mx-auto h-14 w-14 text-mc-gold" aria-hidden />
            <h1 className="mt-3 font-mc-display text-4xl uppercase leading-tight sm:text-5xl">
              You&apos;re registered! <span aria-hidden>🎉</span>
            </h1>
            <p className="mt-2 text-white/90">Your seat for the Astro Vastu Masterclass is booked.</p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-mc-gold/50 bg-mc-card px-4 py-2 text-sm font-semibold">
              <CalendarDays className="h-5 w-5 shrink-0 text-mc-gold" aria-hidden />
              {sessionLabel ?? "Date shared in the WhatsApp group"} · Live on Zoom
            </p>

            {/* The one action that matters: the Zoom link, exact date and updates live in the group.
                WhatsApp green with dark ink text — white on #25D366 fails contrast. */}
            <a
              href={MASTERCLASS_GROUP_INVITE_URL ?? supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-6 py-4 text-lg font-bold text-mc-ink shadow-[0_0_32px_rgba(37,211,102,0.45)] transition hover:bg-[#2fe174] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 sm:text-xl"
            >
              <WhatsAppIcon className="h-7 w-7" color="#06152E" />
              {MASTERCLASS_GROUP_INVITE_URL ? "Join the WhatsApp Group" : "Get the WhatsApp Group Link"}
            </a>

            <p className="mt-4 text-sm leading-relaxed text-white/85">
              The Zoom link, exact date &amp; time, and all updates are shared in the WhatsApp group — please join now so
              you don&apos;t miss it.
            </p>

            <p className="mt-6 text-xs text-mc-muted">
              Didn&apos;t mean to pay? Contact us on{" "}
              <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-mc-gold/60 underline-offset-2 hover:text-white">
                WhatsApp {WORKSHOP_WHATSAPP_DISPLAY}
              </a>
              .
            </p>
            {row.razorpay_payment_id && <p className="mt-2 text-[11px] text-mc-muted/70">Payment ID: {row.razorpay_payment_id}</p>}
          </>
        ) : (
          <>
            <PendingRefresher />
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-mc-gold" aria-hidden />
            <h1 className="mt-4 font-mc-display text-3xl uppercase sm:text-4xl">Confirming your payment…</h1>
            <p className="mt-3 text-mc-muted">
              This usually takes a few seconds. Please keep this page open — don&apos;t pay again.
            </p>
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 text-sm text-mc-muted hover:text-white"
            >
              <WhatsAppIcon className="h-4 w-4" /> Taking too long? WhatsApp us
            </a>
          </>
        )}
      </main>
    </div>
  );
}
