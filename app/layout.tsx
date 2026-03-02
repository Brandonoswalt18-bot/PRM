import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoAccess Vendor Portal | Approved vendor onboarding, HubSpot deal registration, and RMR tracking",
  description:
    "GoAccess Vendor Portal gives approved vendors one place to apply, complete NDA, receive credentials, register deals into HubSpot, and track monthly recurring revenue.",
  metadataBase: new URL("https://prm-site-8tt6tcck5-brandonoswalt18-bots-projects.vercel.app"),
  openGraph: {
    title: "GoAccess Vendor Portal",
    description:
      "Approved vendor onboarding, HubSpot-backed deal registration, and monthly RMR visibility for GoAccess.",
    url: "https://prm-site-8tt6tcck5-brandonoswalt18-bots-projects.vercel.app",
    siteName: "GoAccess Vendor Portal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoAccess Vendor Portal",
    description:
      "A GoAccess-only vendor portal for applications, NDA completion, HubSpot deal registration, and RMR tracking.",
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
