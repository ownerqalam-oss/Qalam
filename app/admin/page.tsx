import Link from "next/link";

const adminLinks = [
  { href: "/admin/invitations", title: "Writer invitations", description: "Invite members and review delivery status." },
  { href: "/admin/members", title: "Members", description: "Review, suspend, or reactivate accounts." },
  { href: "/admin/posts", title: "Posts", description: "Remove or restore writing for moderation." },
  { href: "/admin/reports", title: "Reports", description: "Review member reports and take audited action." },
  { href: "/admin/moderation", title: "Moderation log", description: "Review the immutable administrator action history." },
];

export default function AdminPage() {
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="mb-10 text-4xl font-bold">Admin Dashboard</h1><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{adminLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-xl border p-5 hover:border-black"><h2 className="text-lg font-semibold">{link.title}</h2><p className="mt-2 text-sm text-gray-500">{link.description}</p></Link>)}</div><div className="mt-10 rounded-xl border bg-gray-50 p-6"><h2 className="font-semibold">Moderation is auditable</h2><p className="mt-2 text-sm text-gray-600">Writers control publishing. Administrators may remove content or suspend members only through reasoned actions recorded in the moderation log.</p></div></main>;
}
