import type { Metadata } from "next";
import { noIndex } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Write",
  ...noIndex,
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
