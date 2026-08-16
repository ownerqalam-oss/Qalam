"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase/client";

const NAV_LINKS = [
  { href: "/journal", label: "JOURNAL" },
  { href: "/explore", label: "EXPLORE" },
  { href: "/writers", label: "WRITERS" },
  { href: "/dashboard", label: "DASHBOARD" },
];

export default function Navbar() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    setMenuOpen(false);

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-[#F7F1E8]">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex h-[80px] items-center justify-between border-b border-[#DCD4C9] md:h-[105px]">

          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <Image
              src="/logo2.png"
              alt="Qalam"
              width={210}
              height={70}
              className="h-auto w-[140px] md:w-[175px]"
              priority
            />
          </Link>

          {/* Main navigation */}
          <div className="hidden items-center gap-9 text-[13px] font-medium text-[#46382F] md:flex">

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "rounded-full bg-[#053400] px-7 py-2.5 text-white transition"
                    : "transition hover:text-[#053400]"
                }
              >
                {link.label}
              </Link>
            ))}

          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 md:gap-5">

            {/* Search */}
            <div className="hidden items-center gap-3 text-[12px] text-[#9A9188] md:flex">
              <span>SEARCH</span>
              <span className="text-[18px] text-[#46382F]">⌕</span>
            </div>

            {!loading && session ? (
              <>
                <button
                  onClick={handleLogout}
                  className="hidden text-[13px] font-medium text-[#053400] md:block"
                >
                  LOG OUT
                </button>

                <Link
                  href="/write"
                  className="rounded-full bg-[#053400] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95 md:px-7 md:py-2.5 md:text-[13px]"
                >
                  WRITE
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  className="hidden text-[13px] font-medium text-[#053400] md:block"
                >
                  SIGN IN
                </Link>

                <Link
                  href="/write"
                  className="rounded-full bg-[#053400] px-4 py-2 text-[12px] font-medium text-white transition hover:bg-[#0B4D2B] active:scale-95 md:px-7 md:py-2.5 md:text-[13px]"
                >
                  WRITE
                </Link>
              </>
            ) : (
              <div className="h-9 w-20" />
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="relative h-9 w-9 shrink-0 md:hidden"
            >
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-[#053400] transition ${
                  menuOpen ? "rotate-45" : "-translate-y-[6px]"
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 bg-[#053400] transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-[#053400] transition ${
                  menuOpen ? "-rotate-45" : "translate-y-[6px]"
                }`}
              />
            </button>

          </div>

        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="flex flex-col gap-1 border-b border-[#DCD4C9] pb-6 pt-2 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-[#053400] text-white"
                    : "text-[#46382F] hover:bg-[#E9E2D8]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 border-t border-[#DCD4C9] pt-3">
              {!loading && session ? (
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-[#053400] transition hover:bg-[#E9E2D8]"
                >
                  LOG OUT
                </button>
              ) : !loading ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-[#053400] transition hover:bg-[#E9E2D8]"
                >
                  SIGN IN
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
