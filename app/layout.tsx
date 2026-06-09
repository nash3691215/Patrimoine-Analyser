import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Radiographie de patrimoine — outil pédagogique",
  description:
    "Comprenez la structure de votre patrimoine et ses angles morts. Outil éducatif : métriques objectives + lecture pédagogique.",
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
