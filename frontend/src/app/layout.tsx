import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { LanguageProvider } from "@/lib/i18n";
import { CloudSyncInitializer } from "@/components/CloudSyncInitializer";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce CRM — Operations Platform",
  description: "Mobile-first workforce operations, attendance, tasks, orders, and payroll",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workforce CRM",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="grain-overlay min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <CloudSyncInitializer />
              <PWAInstallPrompt />
              {children}
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
