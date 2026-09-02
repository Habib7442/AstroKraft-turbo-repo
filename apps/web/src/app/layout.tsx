import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { CartHydrator } from "@/components/cart-hydrator";
import { constructMetadata, globalJsonLd, viewport } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = constructMetadata({ root: true });
export { viewport };

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#F7F5FC] text-[#221A3D]" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd()) }}
        />
        <ClerkProvider>
          <CartHydrator />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
