import type { Metadata } from "next";
import { Poppins, Inter, Amiri } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/AuthProvider";
import { ToastProvider } from "../components/ToastProvider";
import FeedbackButton from "../components/FeedbackButton";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
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
      className={`${poppins.variable} ${inter.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <Navbar />

            <main className="flex-1">
              {children}
            </main>

            <FeedbackButton />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
