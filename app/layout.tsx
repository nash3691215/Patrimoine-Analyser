import type { Metadata } from "next";

import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://s-investir-demo.vercel.app";

const TITLE = "Radiographie de patrimoine — outil pédagogique";
const DESCRIPTION =
  "Saisissez votre allocation : métriques objectives calculées en code (liquidité, concentration, immobilier), puis lecture pédagogique de vos angles morts. Démo immédiate, sans compte.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Radiographie de patrimoine",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Radiographie de patrimoine — métriques objectives et lecture pédagogique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
