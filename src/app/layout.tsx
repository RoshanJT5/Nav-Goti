import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { PWAInstaller } from "@/components/PWAInstaller";

// Viewport configuration separated as per Next.js 14+ best practices
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export const metadata: Metadata = {
  title: "Nav Goti - Ancient Indian Strategy Game",
  description: "Play Nav Goti, the ancient strategy game from Sindhu, India. Challenge AI, play locally with friends, or compete online against players worldwide.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nav Goti"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased touch-none select-none" style={{
        touchAction: 'pan-x pan-y',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}>
        <ErrorReporter />
        <PWAInstaller />
        <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth -webkit-overflow-scrolling-touch">
          {children}
        </div>
      </body>
    </html>
  );
}
