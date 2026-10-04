import type { Metadata } from "next";
import { noIndex } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Sign up",
  ...noIndex,
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
