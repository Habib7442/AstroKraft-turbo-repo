import type { Metadata } from "next";
import { VASTU_PRIVACY_NOTICE_VERSION } from "@astrokraft/validators";
import { BRAND, CONSULTATION_FEE_LABEL, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Policies | ${BRAND}`,
  description: `Privacy Policy, Payment Terms and Refund & Rescheduling Policy for ${BRAND}.`
};

// DRAFT terms — to be reviewed and confirmed by the business before ads go live.
export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-cream sm:px-6">
      <a href="/" className="text-sm text-gold-soft hover:underline">
        ← Back to booking
      </a>
      <h1 className="mt-6 text-3xl font-extrabold text-cream">Policies</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {VASTU_PRIVACY_NOTICE_VERSION}</p>

      <section id="privacy" className="mt-10 scroll-mt-20 space-y-3">
        <h2 className="text-xl font-bold text-gold-soft">Privacy Policy</h2>
        <p>
          When you book a consultation we collect your name, phone / WhatsApp number, city and state, business category and stage, the business
          challenges you select, whether a floor plan is available, and — through our booking provider — your chosen slot (and your email address, if you give one).
          We also record which advertisement or link brought you to this page.
        </p>
        <p>
          We use this information only to schedule and deliver your consultation, contact you about your booking by WhatsApp, SMS, phone or
          email, and measure how our advertising performs. We do not sell your data.
        </p>
        <p>
          Your data is processed by service providers that help us run this service: Cal.com (scheduling and booking notifications),
          Razorpay (payments), Supabase (secure data storage) and Meta Platforms (advertising measurement). Payment card and UPI
          details are handled by Razorpay and never stored by us.
        </p>
        <p>
          This website uses the Meta Pixel and related cookies. When you visit any page — whether or not you book — Meta may receive
          information such as the pages you view, the actions you take (for example, opening the booking form), your browser and device
          details, IP address and cookie identifiers. When you submit the booking form or pay, we also send Meta your contact details —
          phone number, name, city, state, country and email (if you gave one) — in hashed form, along with your IP address and browser
          details. Hashing converts each value into a one-way code; it is not encryption, and Meta matches these codes against its own
          records, so they can be linked to your Facebook or Instagram account. We use this only to measure and improve our Facebook and
          Instagram advertising.
          You can manage how Meta uses this information for ads in your Facebook or Instagram ad settings.
        </p>
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by writing to{" "}
          <a className="text-gold-soft underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section id="payment" className="mt-10 scroll-mt-20 space-y-3">
        <h2 className="text-xl font-bold text-gold-soft">Payment Terms</h2>
        <p>
          The consultation fee is {CONSULTATION_FEE_LABEL} (inclusive of applicable taxes), payable in full online via Razorpay (UPI, cards,
          netbanking and wallets) right after you choose your slot. Your slot is held when you book and is confirmed only after successful
          payment. If a payment fails you can retry from the payment page; bookings left unpaid may be released.
        </p>
      </section>

      <section id="refunds" className="mt-10 scroll-mt-20 space-y-3">
        <h2 className="text-xl font-bold text-gold-soft">Refund &amp; Rescheduling Policy</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>You can reschedule once, free of charge, up to 24 hours before your slot using the link in your confirmation email.</li>
          <li>Cancellations made more than 24 hours before the slot are eligible for a full refund.</li>
          <li>Cancellations within 24 hours of the slot, or missed consultations, are not refundable, but may be rescheduled once at our discretion.</li>
          <li>If we need to cancel or cannot hold your consultation, you will receive a full refund or a new slot, as you prefer.</li>
          <li>Approved refunds are made to the original payment method within 7 working days.</li>
        </ul>
        <p>
          For any request, contact us at{" "}
          <a className="text-gold-soft underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          or WhatsApp +91 {CONTACT_PHONE}.
        </p>
      </section>
    </main>
  );
}
