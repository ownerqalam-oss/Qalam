"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { session, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="w-full border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold">
          Qalam
        </Link>

        <div className="flex gap-8 text-sm">
          <Link href="/journal">Journal</Link>
          <Link href="/about">About</Link>

          {!loading && session && (
            <Link href="/dashboard">Dashboard</Link>
          )}
        </div>

        {!loading && (
          session ? (
            <button
              onClick={handleLogout}
              className="rounded-md border px-6 py-3 transition hover:bg-gray-100"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md border px-6 py-3 transition hover:bg-gray-100"
            >
              Write
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
