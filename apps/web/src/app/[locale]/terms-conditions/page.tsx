import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Terms & Conditions",
    description: "The terms and conditions governing your use of AstroKraft.",
    path: "/terms-conditions",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="Terms & Conditions" updatedAt="September 2, 2026">
      <p>
        These Terms & Conditions govern your use of the AstroKraft website and services. By placing an order or
        booking a consultation, you agree to these terms.
      </p>

      <div>
        <h2>Products & Services</h2>
        <p>
          We sell gemstones, Rudraksha, crystal bracelets, and related items, and offer paid astrology
          consultations. Product images are representative; natural stones may vary slightly in shade, size, and
          inclusions.
        </p>
      </div>

      <div>
        <h2>Orders & Payment</h2>
        <p>
          All orders are subject to availability and confirmation of payment. Payments are processed via Razorpay,
          supporting cards, UPI, netbanking, and EMI. An order is confirmed only once payment is successfully
          captured.
        </p>
      </div>

      <div>
        <h2>Consultations</h2>
        <p>
          Consultation bookings are confirmed upon successful payment. Astrological guidance is provided for
          informational and spiritual purposes only and does not constitute medical, legal, financial, or
          professional advice. Decisions made based on a consultation are the client&rsquo;s own responsibility.
        </p>
      </div>

      <div>
        <h2>Intellectual Property</h2>
        <p>
          All content on this site — including text, images, and branding — is the property of AstroKraft and may
          not be reproduced without permission.
        </p>
      </div>

      <div>
        <h2>Limitation of Liability</h2>
        <p>
          AstroKraft is not liable for indirect or consequential losses arising from the use of our products or
          services, to the extent permitted by applicable law.
        </p>
      </div>

      <div>
        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of India, with courts in Assam having jurisdiction.</p>
      </div>

      <p>
        Questions about these terms? Contact us at{" "}
        <a href="mailto:vastubipra@gmail.com">vastubipra@gmail.com</a>.
      </p>
    </PolicyPage>
  );
}
