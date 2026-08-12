"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { logout } from "../app/auth/actions";
import { useAuth } from "./AuthProvider";

const linkClass = "text-xs font-medium uppercase tracking-wide text-[#46382F] transition hover:text-[#053400]";

export default function Navbar() {
  const { authenticated, admin, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#F7F1E8]" aria-label="Primary navigation">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#DCD4C9] py-4 lg:h-[105px] lg:flex-nowrap lg:py-0">
          <Link href="/" className="shrink-0" aria-label="Qalam home">
            <Image src="/logo2.png" alt="Qalam" width={210} height={70} className="h-auto w-[130px] sm:w-[155px] lg:w-[175px]" priority />
          </Link>

          <div className="order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#DCD4C9] pt-4 lg:order-2 lg:w-auto lg:flex-nowrap lg:border-0 lg:pt-0">
            <Link href="/journal" className="rounded-full bg-[#053400] px-5 py-2.5 text-xs font-medium text-white">Journal</Link>
            {authenticated ? (
              <>
                <Link href="/following" className={linkClass}>Following</Link>
                <Link href="/dashboard" className={linkClass}>Dashboard</Link>
                <Link href="/new" className={linkClass}>Write</Link>
                {admin && <Link href="/admin" className={linkClass}>Admin</Link>}
              </>
            ) : (
              <Link href="/about" className={linkClass}>About</Link>
            )}
          </div>

          <div className="relative order-2 flex items-center lg:order-3">
            {!loading && authenticated ? (
              <>
                <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-haspopup="menu" className="rounded-full border border-[#B9AD9D] px-4 py-2 text-xs font-medium uppercase text-[#053400]">
                  Account <span aria-hidden="true">▾</span>
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-[#DCD4C9] bg-[#FFFDF9] p-2 shadow-lg">
                    <Link role="menuitem" href="/profile" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F1EAE0]">Profile</Link>
                    <Link role="menuitem" href="/saved" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F1EAE0]">Saved Posts</Link>
                    <Link role="menuitem" href="/settings" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F1EAE0]">Settings</Link>
                    <form action={logout}><button role="menuitem" type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F1EAE0]">Log out</button></form>
                  </div>
                )}
              </>
            ) : !loading ? (
              <Link href="/login" className="text-xs font-medium uppercase text-[#053400]">Sign in</Link>
            ) : (
              <span className="h-5 w-14 animate-pulse rounded bg-[#E8DED2]" aria-label="Loading account status" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
