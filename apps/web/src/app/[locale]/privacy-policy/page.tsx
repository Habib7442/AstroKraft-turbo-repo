import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Privacy Policy",
    description: "How AstroKraft collects, uses, and protects your personal information.",
    path: "/privacy-policy",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="Privacy Policy" updatedAt="September 2, 2026">
      <p>
        This Privacy Policy explains how AstroKraft (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
        collects, uses, and protects your personal information when you use our website and services.
      </p>

      <div>
        <h2>Information We Collect</h2>
        <ul>
          <li>Account details: name, email address, and phone number, via our sign-in provider.</li>
          <li>Order details: shipping address, items purchased, and payment status.</li>
          <li>Consultation details: birth date, time and place of birth, submitted when booking a consultation.</li>
          <li>Usage data: pages visited and interactions, used to improve the site.</li>
        </ul>
      </div>

      <div>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To process and fulfil orders and consultation bookings.</li>
          <li>To communicate order updates, booking confirmations, and support responses.</li>
          <li>To improve our products, services, and website experience.</li>
        </ul>
      </div>

      <div>
        <h2>Payment Information</h2>
        <p>
          All payments are processed securely by Razorpay. We do not store your card, UPI, or netbanking
          credentials on our servers.
        </p>
      </div>

      <div>
        <h2>Data Sharing</h2>
        <p>
          We do not sell your personal information. We share data only with service providers who help us operate
          — such as our payment processor (Razorpay) and cloud hosting/storage providers — solely to deliver our
          services.
        </p>
      </div>

      <div>
        <h2>Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting us at{" "}
          <a href="mailto:vastubipra@gmail.com">vastubipra@gmail.com</a>.
        </p>
      </div>

      <p className="text-xs text-ink-muted">
        This policy may be updated from time to time. Continued use of the site after changes means you accept the
        revised policy.
      </p>
    </PolicyPage>
  );
}
