import type { Metadata } from "next";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Your Cart",
    path: "/cart",
    locale: isValidLocale(locale) ? locale : "en",
    noIndex: true
  });
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
