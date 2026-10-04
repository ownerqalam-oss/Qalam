import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

// The page itself is a client component, so its metadata lives here.
// Child [id] pages set their own title and canonical URL.
export const metadata: Metadata = pageMetadata({
  title: "Collections",
  description:
    "Themed groupings of writing from across the Qalam community.",
  path: "/collections",
});

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
