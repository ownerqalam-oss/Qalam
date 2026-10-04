import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: "Explore",
  description:
    "Discover the Journal, ideas and the people behind the words on Qalam.",
  path: "/explore",
});

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
