import "server-only";

// Google Sheet writer for the masterclass leads — server only.
//
// Writes go through a Google Apps Script web app bound to the sheet
// (apps/vastu/google-apps-script/masterclass-sheet.gs): no Google Cloud project,
// service account or key file. The script checks a shared secret, takes a lock
// (so duplicate checks are race-free), de-duplicates, creates the tabs/headers
// on first use, and stores every value as plain text.
//
// Env (server-only — never NEXT_PUBLIC_):
//   SHEETS_WEBHOOK_URL     the Apps Script "Web app" URL (https://script.google.com/macros/s/…/exec)
//   SHEETS_WEBHOOK_SECRET  must equal SECRET in the script
// Both unset = Sheet sync is skipped (Supabase still records everything).

const TIMEOUT_MS = 15000; // Apps Script cold starts can take a few seconds

type Config = { url: string; secret: string };

function getConfig(): Config | null {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return null;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    console.error("SHEETS_WEBHOOK_URL is not an Apps Script web app URL (…/macros/s/<id>/exec) — Sheet sync disabled");
    return null;
  }
  return { url, secret };
}

export const isSheetConfigured = () => getConfig() !== null;

async function post(cfg: Config, payload: Record<string, unknown>): Promise<void> {
  // Apps Script answers a POST with a 302 to script.googleusercontent.com;
  // fetch follows it (as a GET) to read the script's JSON reply.
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret: cfg.secret }),
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const text = await res.text();
  let json: { ok?: boolean; error?: string } = {};
  try {
    json = JSON.parse(text);
  } catch {
    // An HTML page here usually means the deployment isn't "Anyone" access, or the URL is stale.
  }
  if (!res.ok || json.ok !== true) {
    throw new Error(`Sheet webhook failed (${res.status}): ${json.error ?? text.slice(0, 200)}`);
  }
}

/** "13 Nov 2026, 9:05 pm" in IST. */
export function istTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

export type PaidRow = {
  paidAt: Date;
  fullName: string;
  whatsapp: string;
  amountRupees: number;
  paymentId: string;
  orderId: string;
};

/**
 * Append a paid registration to "Registrations" (skipped by the script if that
 * Payment ID is already there) and mark the same phone "Paid" in
 * "Leads - Not Paid". Throws on failure so the caller can retry later; returns
 * false when unconfigured.
 */
export async function appendPaidRegistration(row: PaidRow): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) return false;
  await post(cfg, {
    action: "paid",
    timestamp: istTimestamp(row.paidAt),
    fullName: row.fullName,
    whatsapp: row.whatsapp,
    amount: row.amountRupees,
    paymentId: row.paymentId,
    orderId: row.orderId
  });
  return true;
}

/**
 * Record a form submission that hasn't paid (yet) in "Leads - Not Paid" with
 * status "Initiated" (the script de-duplicates by phone). Best effort: never throws.
 */
export async function recordInitiatedLead(fullName: string, whatsapp: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  try {
    await post(cfg, { action: "lead", timestamp: istTimestamp(), fullName, whatsapp });
  } catch (error) {
    console.error("could not record initiated lead in Google Sheet:", error);
  }
}
