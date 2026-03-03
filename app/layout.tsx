import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoAccess Vendor Portal",
  description:
    "Apply to become a GoAccess vendor, complete onboarding, register deals, and track monthly recurring revenue.",
  metadataBase: new URL("https://prm-gamma.vercel.app"),
  openGraph: {
    title: "GoAccess Vendor Portal",
    description:
      "GoAccess vendor application, onboarding, deal registration, and recurring revenue tracking.",
    url: "https://prm-gamma.vercel.app",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
