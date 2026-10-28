import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import { MetaPixel } from "@/components/meta-pixel";
import { BRAND, CONSULTATION_FEE_LABEL, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Cinzel({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display", display: "swap" });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `1:1 Business Vastu Consultation | ${BRAND}`,
  description:
    `Is your business space supporting your growth? Book a personalised 1:1 Business Vastu Consultation with Biprangshu Bhattacharjee for ${CONSULTATION_FEE_LABEL}.`,
  // AstroKraft's icons — Biprangshu is its founder.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "Your Business Is Running. But Is It Growing the Way It Should?",
    description: `Personalised 1:1 Business Vastu Consultation — ${CONSULTATION_FEE_LABEL}.`,
    siteName: BRAND,
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0B2545",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="bg-night font-sans text-cream antialiased" suppressHydrationWarning>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
