interface TelegramNotificationInput {
  text: string;
}

// parse_mode: "HTML" means Telegram interprets a handful of tags (<b>, <a>,
// etc.) in the text below - so any dynamic value that ultimately traces back
// to user input (a customer's name, a booking's free-text field) must be
// escaped before interpolation, or that customer could reformat the owner's
// alert or turn part of it into a link of their choosing.
export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Best-effort, mirrors send-push-notification.ts — the admin app is run by
// an assistant, not the owner, so this is the owner's own always-on channel
// for "money just moved" alerts, independent of whether the app push
// notification actually reaches anyone's phone. A failed send must never
// turn an already-successful payment/booking into an error response, so
// every call site wraps this in its own try/catch exactly like the push
// notification call next to it.
export async function sendTelegramNotification({ text }: TelegramNotificationInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Not configured yet (e.g. local dev, or before the bot token is set up)
  // - silently skip rather than throwing, same as push notifications
  // no-op-ing when there are no registered devices.
  if (!token || !chatId) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    // A stalled connection here shouldn't hold up the response to a payment
    // or booking request that already succeeded - bound it so the caller's
    // try/catch settles quickly instead of the client timing out and
    // retrying an already-completed action.
    signal: AbortSignal.timeout(5000)
  });

  if (!res.ok) {
    throw new Error(`Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
