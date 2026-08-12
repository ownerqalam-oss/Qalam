import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qalam",
  description: "A home for Muslim writers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Navbar />

          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
