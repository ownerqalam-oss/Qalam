import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/AuthProvider";
import { ToastProvider } from "../components/ToastProvider";
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
  metadataBase: new URL("https://qalam.ie"),
  title: {
    default: "Qalam",
    template: "%s",
  },
  description:
    "A home for Muslim writers and readers, sharing articles, poetry, reflections and short stories written with sincerity.",
  openGraph: {
    title: "Qalam",
    description:
      "A home for Muslim writers and readers, sharing articles, poetry, reflections and short stories written with sincerity.",
    url: "https://qalam.ie",
    siteName: "Qalam",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qalam",
    description:
      "A home for Muslim writers and readers, sharing articles, poetry, reflections and short stories written with sincerity.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <Navbar />

            <main className="flex-1">
              {children}
            </main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
