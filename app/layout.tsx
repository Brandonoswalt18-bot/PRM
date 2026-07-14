import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { getPortalBaseUrl } from "@/lib/email";
import "./globals.css";
import "./design-system.css";

const portalBaseUrl = getPortalBaseUrl();
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "GoAccess Vendor Portal",
  description:
    "Apply to become a GoAccess vendor, complete agreements, register deals, and access partner training.",
  metadataBase: new URL(portalBaseUrl),
  openGraph: {
    title: "GoAccess Vendor Portal",
    description:
      "GoAccess vendor applications, agreements, deal registration, and partner training.",
    url: portalBaseUrl,
    siteName: "GoAccess Vendor Portal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoAccess Vendor Portal",
    description:
      "GoAccess vendor applications, agreements, deal registration, and partner training.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      className={`${inter.variable} ${jetBrainsMono.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
