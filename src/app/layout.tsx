import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://modufile.com'),
  title: {
    default: "Modufile - Modify files privately in your browser",
    template: "%s | Modufile",
  },
  description: "Privacy-first file modification tools. Edit PDFs, compress images, and convert formats without uploading your data to any server.",
  applicationName: "Modufile",
  keywords: ["pdf merge", "image compress", "private file tools", "client-side processing", "wasm tools"],
  authors: [{ name: "Modufile Team" }],
  creator: "Modufile",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://modufile.com",
    title: "Modufile - Modify files privately in your browser",
    description: "Privacy-first file modification tools. Edit PDFs, compress images, and convert formats without uploading your data to any server.",
    siteName: "Modufile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modufile - Modify files privately in your browser",
    description: "Privacy-first file modification tools. Edit PDFs, compress images, and convert formats without uploading your data to any server.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
  ],
};

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalNotices } from "@/components/ui/GlobalNotices";
import { ClientBootstrap } from "@/components/ClientBootstrap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Resource hints for WASM engines loaded from CDNs */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background-app`}
        suppressHydrationWarning
      >
        <ClientBootstrap />
        <GlobalNotices />
        <Header />
        <main className="min-h-screen pt-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
