import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PurohitBookingForm } from "@/components/purohit-booking-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Book a Purohit for Your Puja",
    description:
      "Tell us about the puja or ritual you need — Griha Pravesh, Satyanarayan Puja, weddings, and more — and our team will call you to confirm the priest, materials, and price.",
    path: "/purohit-booking",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

interface PurohitBookingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PurohitBookingPage({ params }: PurohitBookingPageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Book a Purohit</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Tell us about your puja and we&rsquo;ll call you back to confirm the priest, materials, and price. No payment
            needed now.
          </p>
        </div>

        <PurohitBookingForm />
      </div>
    </main>
  );
}
