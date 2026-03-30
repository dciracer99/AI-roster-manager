import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dylan's Roster Manager",
  description: "Personal social CRM",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roster",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geist.variable} font-sans antialiased bg-rm-bg`}>
        {children}
      </body>
    </html>
  );
}
