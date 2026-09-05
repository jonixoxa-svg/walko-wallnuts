import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { headers } from "next/headers";
import { baseUrl, site } from "@/lib/site";
import { CartProvider } from "@/components/cart/CartProvider";
import CookieBanner from "@/components/site/CookieBanner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: {
    default: `${site.brand} — Own a walnut tree`,
    template: `%s · ${site.brand}`,
  },
  description:
    "Two thousand numbered walnut trees in a Styrian valley. Choose one, own it for life and follow its growth, care and harvest online.",
  applicationName: site.brand,
  authors: [{ name: site.brand }],
  openGraph: {
    type: "website",
    siteName: site.brand,
    images: [{ url: "/photos/hero-208.webp", width: 1800, height: 1200, alt: site.brand }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a2b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const lang = headerList.get("x-locale") === "de" ? "de" : "en";

  return (
    <html lang={lang} className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <CartProvider>
          {children}
          <CookieBanner locale={lang} />
        </CartProvider>
      </body>
    </html>
  );
}
