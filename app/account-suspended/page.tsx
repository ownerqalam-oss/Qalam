import Link from "next/link";

export default function AccountSuspendedPage() {
  return <main className="mx-auto max-w-2xl px-6 py-20 text-center"><p className="text-sm font-medium uppercase tracking-[0.25em] text-red-700">Account suspended</p><h1 className="mt-4 text-4xl font-bold">Your Qalam account is unavailable</h1><p className="mt-5 text-gray-600">Your profile and published writing are hidden. Contact a Qalam administrator if you believe this is a mistake.</p><Link href="/journal" className="mt-8 inline-block rounded-full bg-[#053400] px-5 py-3 text-white">Browse the Journal</Link></main>;
}
