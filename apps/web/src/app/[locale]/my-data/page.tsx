import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { OrdersSignInGate } from "@/components/orders-sign-in-gate";
import { MyDataControls } from "@/components/my-data-controls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Your Data & Privacy",
    description: "Download or delete the personal data AstroKraft holds about you.",
    path: "/my-data",
    locale: isValidLocale(locale) ? locale : "en",
    noIndex: true
  });
}

export default async function MyDataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Your Data & Privacy</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Access or erase your personal data at any time. For corrections, testimonials, bookings made without
            an account, or any other request, email our Grievance Officer at{" "}
            <a href="mailto:vastubipra@gmail.com" className="text-primary underline underline-offset-2">
              vastubipra@gmail.com
            </a>
            . See our{" "}
            <Link href={`/${locale}/privacy-policy`} className="text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {userId ? (
          <MyDataControls locale={locale} />
        ) : (
          <OrdersSignInGate
            title="Sign in to manage your data"
            description="Sign in to download or delete the personal data linked to your account."
          />
        )}
      </div>
    </main>
  );
}
