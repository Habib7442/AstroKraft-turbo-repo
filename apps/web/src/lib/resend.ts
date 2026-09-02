import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing env.RESEND_API_KEY");
}

// Server-only client — RESEND_API_KEY must never reach the browser.
export const resend = new Resend(process.env.RESEND_API_KEY);
