import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { organization } from "@/config/organization";
import { siteUrl } from "@/config/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const title = `Message Check · ${organization.name}`;
const description =
  "Paste a suspicious message, or a screenshot of one, and see the warning signs explained, with the safe way to check it before you click, call or pay.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: `${organization.name} Message Check`,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: `${organization.name} Message Check`,
    title,
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:text-white"
        >
          Skip to the checker
        </a>
        {children}
      </body>
    </html>
  );
}
