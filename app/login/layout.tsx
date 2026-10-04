import type { Metadata } from "next";
import { noIndex } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Sign in",
  ...noIndex,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
