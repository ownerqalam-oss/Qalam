import type { Metadata } from "next";
import { noIndex } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Complete your profile",
  ...noIndex,
};

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
