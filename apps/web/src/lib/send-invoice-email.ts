import { resend } from "@/lib/resend";
import { renderInvoicePdf, type InvoiceOrder, type InvoiceCustomer } from "@/lib/invoice-pdf";

// Testing only: onboarding@resend.dev works without domain verification but
// only delivers reliably to the Resend account owner's own email — switch to
// a verified astrokraft.online sender before sending to real customers.
const SENDER = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
// Must match the Resend account's own registered address while sending from
// the sandbox sender — every recipient (to/cc/bcc) is restricted to it until
// a real sender domain is verified. See the RESEND_FROM_EMAIL comment above.
const OWNER_NOTIFY_EMAIL = "astrokraftwebsitemanagement@gmail.com";

interface SendInvoiceEmailParams {
  to: string;
  subject: string;
  html: string;
  filenamePrefix: string;
  order: InvoiceOrder;
  customer: InvoiceCustomer;
}

// Best-effort by design — callers should wrap this in try/catch and never let
// a failed email turn an already-successful payment into an error response.
export async function sendInvoiceEmail({ to, subject, html, filenamePrefix, order, customer }: SendInvoiceEmailParams) {
  const pdfBuffer = await renderInvoicePdf(order, customer);

  const { error } = await resend.emails.send({
    from: SENDER,
    to,
    bcc: OWNER_NOTIFY_EMAIL,
    subject,
    html,
    attachments: [
      {
        filename: `${filenamePrefix}-${order.id.slice(0, 8)}.pdf`,
        content: pdfBuffer
      }
    ]
  });

  if (error) {
    throw new Error(typeof error === "object" && "message" in error ? String(error.message) : "Resend send failed");
  }
}
