import Link from "next/link";

export function FeedPagination({ href }: { href: string | null }) {
  if (!href) return null;
  return <nav aria-label="Feed pagination" className="mt-8 flex justify-center"><Link href={href} className="rounded-full border border-[#053400] px-5 py-2 text-sm font-semibold text-[#053400] hover:bg-[#F1EAE0]">Older posts</Link></nav>;
}
