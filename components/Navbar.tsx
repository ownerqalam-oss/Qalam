"use client";

import Image from "next/image";
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
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="transition hover:opacity-80">
          <Image
          src="/logo2.png"
          alt="Qalam"
          width={210}
          height={70}
          className="h-14 w-auto"
          priority
        />
        </Link>

        <div className="flex items-center gap-8 text-[15px] font-medium text-gray-700">
          <Link
            href="/journal"
            className="transition hover:text-[#053400]"
          >
            Journal
          </Link>

          <Link
            href="/about"
            className="transition hover:text-[#053400]"
          >
            About
          </Link>

          {!loading && session && (
            <Link
              href="/dashboard"
              className="transition hover:text-[#053400]"
            >
              Dashboard
            </Link>
          )}
        </div>

        {!loading &&
          (session ? (
            <button
              onClick={handleLogout}
              className="rounded-full border border-[#053400] px-5 py-2 text-[#053400] transition hover:bg-[#053400] hover:text-white"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#053400] px-6 py-2 text-white transition hover:bg-[#0B4D2B]"
            >
              Write
            </Link>
          ))}
      </div>
    </nav>
  );
}
