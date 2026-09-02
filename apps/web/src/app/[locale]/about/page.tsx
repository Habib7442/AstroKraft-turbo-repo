import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "About Us",
    description: "AstroKraft is a Vedic astrology and lab-certified gemstone marketplace based in Silchar, Assam.",
    path: "/about",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="About AstroKraft" updatedAt="September 2, 2026">
      <p>
        AstroKraft is a Vedic astrology and gemstone marketplace based in Rangirkhari, Silchar, Assam. We bring
        together authentic astrological guidance and lab-certified gemstones, Rudraksha, and Vastu solutions under
        one roof — rooted in traditional Vedic practice and backed by verified expertise.
      </p>
      <div>
        <h2>What We Offer</h2>
        <ul>
          <li>Lab-certified gemstones, Rudraksha, and crystal bracelets sourced and verified for authenticity.</li>
          <li>One-on-one consultations with experienced astrologers across career, love, finance, health, and more.</li>
          <li>Secure online ordering with cards, UPI, netbanking, and EMI via Razorpay.</li>
        </ul>
      </div>
      <div>
        <h2>Our Promise</h2>
        <p>
          Every product we sell is verified before it reaches you, and every astrologer on our platform is vetted
          for genuine expertise. We built AstroKraft to make trustworthy Vedic guidance and authentic gemstones
          accessible, wherever you are.
        </p>
      </div>
      <p>
        Have a question before you order? Reach out on our{" "}
        <Link href={`/${locale}/contact`}>Contact page</Link> — we&rsquo;re happy to help.
      </p>
    </PolicyPage>
  );
}
