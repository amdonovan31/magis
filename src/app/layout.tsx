import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magis — Personal Training",
  description: "Your personal training companion",
  manifest: "/manifest.json",
  themeColor: "#1B3A2D",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Magis",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
