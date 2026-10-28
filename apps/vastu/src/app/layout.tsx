import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import { MetaPixel } from "@/components/meta-pixel";
import { BRAND, CONSULTATION_FEE_LABEL, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Cinzel({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display", display: "swap" });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Flat Vastu Report + Expert Call | ${BRAND}`,
  description:
    `Money stuck? Constant tension at home? Get a written Vastu report of your flat and a 30-minute one-to-one call with Biprangshu Bhattacharjee — ${CONSULTATION_FEE_LABEL}, no breaking of walls.`,
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
    title: "Get Your Flat Vastu Report + Expert Call",
    description: `Floor plan check, written report and a 30-minute expert call — ${CONSULTATION_FEE_LABEL}.`,
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
