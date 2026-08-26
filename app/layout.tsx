import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { rootMetadata, webAppJsonLd } from "@/lib/seo/metadata";

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <head>
        <meta name="theme-color" content="#0f0f0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <Script
          id="schema-webapp"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd()) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
