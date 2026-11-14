import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { organization } from "@/config/organization";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Message Check · ${organization.name}`,
  description: "Check a suspicious message for warning signs and learn how to verify it safely before you act.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
