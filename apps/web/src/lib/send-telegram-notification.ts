interface TelegramNotificationInput {
  text: string;
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
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  });

  if (!res.ok) {
    throw new Error(`Telegram API returned ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
