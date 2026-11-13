/**
 * Astro Vastu Masterclass — lead sheet writer (Google Apps Script web app).
 *
 * Paste this whole file into the sheet: Extensions → Apps Script → replace the
 * contents of Code.gs → set SECRET below → Save → Deploy → New deployment →
 * type "Web app", Execute as "Me", Who has access "Anyone" → Deploy → copy the
 * Web app URL into SHEETS_WEBHOOK_URL (and SECRET into SHEETS_WEBHOOK_SECRET).
 *
 * The apps/vastu server POSTs JSON here after a payment is verified server-side:
 *   { secret, action: "paid", timestamp, fullName, whatsapp, amount, paymentId, orderId }
 *   { secret, action: "lead", timestamp, fullName, whatsapp }
 * Tabs and header rows are created automatically on first use.
 */

// Must equal SHEETS_WEBHOOK_SECRET in the app's env. Use a long random string.
const SECRET = "CHANGE-ME-to-a-long-random-string";

// Optional but recommended: the sheet's ID, the long part of its URL between
// /d/ and /edit. When set, the script opens the sheet by ID instead of relying
// on the "active" spreadsheet, which a web app isn't guaranteed to have.
const SPREADSHEET_ID = "";

const REGISTRATIONS = { name: "Registrations", headers: ["Timestamp (IST)", "Full Name", "WhatsApp", "Amount", "Payment ID", "Order ID", "Status"] };
const LEADS = { name: "Leads - Not Paid", headers: ["Timestamp (IST)", "Full Name", "WhatsApp", "Status"] };

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad json" });
  }
  if (!body || body.secret !== SECRET || SECRET.indexOf("CHANGE-ME") === 0) {
    return reply({ ok: false, error: "unauthorized" });
  }

  // One writer at a time, so two calls for the same payment (or phone) can't
  // both pass the duplicate check before either has written its row.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return reply({ ok: false, error: "spreadsheet not found - set SPREADSHEET_ID" });
    const fullName = safeText(body.fullName);
    if (body.action === "paid") {
      const reg = getTab(ss, REGISTRATIONS);
      if (columnValues(reg, 5).indexOf(String(body.paymentId)) === -1) {
        appendAsText(reg, [body.timestamp, fullName, body.whatsapp, String(body.amount), body.paymentId, body.orderId, "Paid"]);
      }
      // The same person in the follow-up list is no longer a lead to chase.
      const leads = getTab(ss, LEADS);
      const i = columnValues(leads, 3).indexOf(String(body.whatsapp));
      if (i >= 1) leads.getRange(i + 1, 4).setValue("Paid");
      return reply({ ok: true });
    }
    if (body.action === "lead") {
      const leads = getTab(ss, LEADS);
      if (columnValues(leads, 3).indexOf(String(body.whatsapp)) === -1) {
        // The paid call can arrive first (the lead call runs after the
        // response); don't list an already-paid buyer as "Initiated".
        const paid = columnValues(getTab(ss, REGISTRATIONS), 3).indexOf(String(body.whatsapp)) >= 1;
        appendAsText(leads, [body.timestamp, fullName, body.whatsapp, paid ? "Paid" : "Initiated"]);
      }
      return reply({ ok: true });
    }
    return reply({ ok: false, error: "unknown action" });
  } finally {
    // Commit pending writes before the next request can take the lock, or its
    // duplicate check could miss the row just appended.
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

/** Get the tab, creating it with a bold header row if it doesn't exist yet. */
function getTab(ss, spec) {
  let sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** All values in a 1-based column, as strings (index 0 = header row). */
function columnValues(sheet, col) {
  const last = sheet.getLastRow();
  if (last === 0) return [];
  return sheet.getRange(1, col, last, 1).getValues().map(function (r) { return String(r[0]); });
}

/**
 * A user-typed value with any leading formula trigger (= + - @) removed. The
 * app already rejects names that don't start with a letter; this is the
 * second guard, so nothing a visitor typed can ever be read as a formula.
 */
function safeText(v) {
  return String(v == null ? "" : v).replace(/^[\s=+\-@]+/, "");
}

/**
 * Append a row formatted as plain text first, so "+91…" stays text instead of
 * being turned into a number.
 */
function appendAsText(sheet, values) {
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length);
  range.setNumberFormat("@");
  range.setValues([values.map(function (v) { return v == null ? "" : String(v); })]);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
