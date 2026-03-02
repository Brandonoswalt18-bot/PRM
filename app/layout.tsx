import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay PRM | Partner Revenue Infrastructure for SaaS",
  description:
    "Relay PRM helps SaaS companies recruit partners, track referrals, calculate commissions, and run payouts with HubSpot and Stripe.",
  metadataBase: new URL("https://relayprm.com"),
  openGraph: {
    title: "Relay PRM",
    description:
      "Partner revenue infrastructure for SaaS teams running affiliate, referral, agency, reseller, and integration programs.",
    url: "https://relayprm.com",
    siteName: "Relay PRM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Relay PRM",
    description:
      "Launch a PRM that finance, sales ops, and partners can all trust.",
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
