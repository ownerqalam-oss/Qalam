import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

// The page itself is a client component, so its metadata lives here.
// Child [id] pages set their own title and canonical URL.
export const metadata: Metadata = pageMetadata({
  title: "Writers",
  description:
    "Meet the writers behind the words. Discover their perspectives, stories and reflections shared through Qalam.",
  path: "/writers",
});

export default function WritersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
