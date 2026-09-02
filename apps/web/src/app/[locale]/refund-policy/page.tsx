import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Refund & Cancellation Policy",
    description: "Refund and cancellation terms for AstroKraft orders and consultations.",
    path: "/refund-policy",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function RefundPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="Refund & Cancellation Policy" updatedAt="September 2, 2026">
      <div>
        <h2>Product Orders</h2>
        <ul>
          <li>Cancellations are accepted only before an order has been shipped.</li>
          <li>
            Returns are accepted within 3 days of delivery if a product arrives damaged, defective, or different
            from what was ordered. Please share unboxing photos/video when reporting an issue.
          </li>
          <li>Gemstones and Rudraksha that have been energized/worn are not eligible for return, for hygiene and authenticity reasons, unless found defective on arrival.</li>
          <li>Approved refunds are processed to the original payment method within 5–7 business days.</li>
        </ul>
      </div>

      <div>
        <h2>Consultations</h2>
        <ul>
          <li>A consultation may be rescheduled free of charge if requested at least 24 hours before the booked slot.</li>
          <li>Full refund if AstroKraft is unable to provide the booked consultation.</li>
          <li>No refund for a missed session where the client did not show up or reschedule in advance.</li>
        </ul>
      </div>

      <div>
        <h2>How to Request a Refund</h2>
        <p>
          Email <a href="mailto:vastubipra@gmail.com">vastubipra@gmail.com</a> with your order or booking
          details and the reason for the request. We&rsquo;ll confirm eligibility and next steps within 2 business
          days.
        </p>
      </div>

      <div>
        <h2>Payment Gateway Refunds</h2>
        <p>
          Refunds are issued via Razorpay to your original payment method. Depending on your bank, it may take a
          few additional days to reflect after we initiate the refund.
        </p>
      </div>
    </PolicyPage>
  );
}
