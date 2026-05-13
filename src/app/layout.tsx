import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAProvider } from "@/components/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RiffSync",
  description: "Your band's creative hub for songs, scheduling, and decisions.",
  openGraph: {
    title: "RiffSync",
    description:
      "Songs, scheduling, and decisions — without the group-chat chaos.",
    siteName: "RiffSync",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RiffSync",
    description:
      "Songs, scheduling, and decisions — without the group-chat chaos.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RiffSync",
  },
  applicationName: "RiffSync",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground">
        <PWAProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </PWAProvider>
      </body>
    </html>
  );
}
