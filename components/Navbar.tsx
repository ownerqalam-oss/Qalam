"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { createClient } from "../lib/supabase/client";

export default function Navbar() {
  const { session, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-[#F7F1E8]">
      <div className="mx-auto max-w-[1400px] px-10">
        <div className="flex h-[105px] items-center justify-between border-b border-[#DCD4C9]">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo2.png"
              alt="Qalam"
              width={210}
              height={70}
              className="h-auto w-[175px]"
              priority
            />
          </Link>

          {/* Main navigation */}
          <div className="flex items-center gap-9 text-[13px] font-medium text-[#46382F]">

            <Link
              href="/journal"
              className="rounded-full bg-[#053400] px-7 py-2.5 text-white"
            >
              JOURNAL
            </Link>

            <Link
              href="/explore"
              className="transition hover:text-[#053400]"
            >
              EXPLORE
            </Link>

            <Link
              href="/writers"
              className="transition hover:text-[#053400]"
            >
              WRITERS
            </Link>

            <Link
              href="/dashboard"
              className="transition hover:text-[#053400]"
            >
              DASHBOARD
            </Link>

          </div>

          {/* Right side */}
          <div className="flex items-center gap-5">

            {/* Search */}
            <div className="hidden items-center gap-3 text-[12px] text-[#9A9188] md:flex">
              <span>SEARCH</span>
              <span className="text-[18px] text-[#46382F]">⌕</span>
            </div>

            {!loading && session ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-[13px] font-medium text-[#053400]"
                >
                  LOG OUT
                </button>

                <Link
                  href="/write"
                  className="rounded-full bg-[#053400] px-7 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#0B4D2B]"
                >
                  WRITE
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-[#053400]"
                >
                  SIGN IN
                </Link>

                <Link
                  href="/write"
                  className="rounded-full bg-[#053400] px-7 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#0B4D2B]"
                >
                  WRITE
                </Link>
              </>
            ) : (
              <div className="h-9 w-20" />
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
