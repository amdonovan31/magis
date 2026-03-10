import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevRoleSwitcher from "@/components/dev/DevRoleSwitcher";

export const metadata: Metadata = {
  title: "Magis — Personal Training",
  description: "Your personal training companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Magis",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1B3A2D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === "development" && <DevRoleSwitcher />}
      </body>
    </html>
  );
}
