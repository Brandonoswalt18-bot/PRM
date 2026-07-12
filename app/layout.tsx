import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { getPortalBaseUrl } from "@/lib/email";
import "./globals.css";

const portalBaseUrl = getPortalBaseUrl();
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "GoAccess Vendor Portal",
  description:
    "Apply to become a GoAccess vendor, complete onboarding, register deals, and track monthly recurring revenue.",
  metadataBase: new URL(portalBaseUrl),
  openGraph: {
    title: "GoAccess Vendor Portal",
    description:
      "GoAccess vendor application, onboarding, deal registration, and recurring revenue tracking.",
    url: portalBaseUrl,
    siteName: "GoAccess Vendor Portal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoAccess Vendor Portal",
    description:
      "GoAccess vendor application, onboarding, deal registration, and recurring revenue tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
