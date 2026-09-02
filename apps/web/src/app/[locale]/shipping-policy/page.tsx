import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Shipping Policy",
    description: "Shipping timelines, charges, and delivery information for AstroKraft orders.",
    path: "/shipping-policy",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function ShippingPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="Shipping Policy" updatedAt="September 2, 2026">
      <p>
        We ship gemstones, Rudraksha, and crystal bracelets across India. Here&rsquo;s what to expect after you
        place an order.
      </p>

      <div>
        <h2>Processing Time</h2>
        <p>
          Orders are processed within 1–2 business days of payment confirmation. Each item is quality-checked
          before dispatch.
        </p>
      </div>

      <div>
        <h2>Delivery Timelines</h2>
        <ul>
          <li>Major cities: 3–5 business days after dispatch.</li>
          <li>Other locations: 5–8 business days after dispatch.</li>
        </ul>
      </div>

      <div>
        <h2>Shipping Charges</h2>
        <p>Shipping charges, if any, are calculated at checkout before payment.</p>
      </div>

      <div>
        <h2>Order Tracking</h2>
        <p>
          Once your order ships, you&rsquo;ll receive tracking details. You can also reach out to{" "}
          <a href="mailto:vastubipra@gmail.com">vastubipra@gmail.com</a> for an update on your order
          status.
        </p>
      </div>

      <div>
        <h2>Delays</h2>
        <p>
          Delivery timelines are estimates. Delays may occur due to courier disruptions, weather, or events beyond
          our control — we&rsquo;ll keep you informed if this happens.
        </p>
      </div>
    </PolicyPage>
  );
}
