"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase/client";
import NotificationBell from "./NotificationBell";
import { ButtonLink } from "./ui/Button";

const NAV_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/explore", label: "Explore" },
  { href: "/writers", label: "Writers" },
];

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export default function Navbar() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const accountRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    if (!session) return;

    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [session]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    const term = search.trim();
    setMenuOpen(false);
    router.push(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  }

  const initial = (profile?.display_name || session?.user.email || "Q")[0].toUpperCase();

  const searchInput = (className: string) => (
    <form onSubmit={handleSearchSubmit} className={className}>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Journal or writers..."
          aria-label="Search Journal or writers"
          className="w-full rounded-full border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-900"
        />
      </div>
    </form>
  );

  return (
    <nav className="bg-cream">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex h-[80px] items-center gap-4 border-b border-border md:h-[90px]">

          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <Image
              src="/logo2.png"
              alt="Qalam"
              width={210}
              height={70}
              className="h-auto w-[140px] md:w-[160px]"
              priority
            />
          </Link>

          {/* Section links */}
          <div className="hidden items-center gap-7 text-[13px] font-medium text-ink-900 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-brand-900"
                    : "transition hover:text-brand-900"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          {searchInput("hidden flex-1 max-w-[360px] md:block")}

          {/* Right side */}
          <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-4">

            <NotificationBell />

            {!loading && session ? (
              <>
                <ButtonLink
                  href="/editor"
                  variant="primary"
                  className="hidden sm:inline-flex"
                >
                  Write
                </ButtonLink>

                {/* Account menu */}
                <div ref={accountRef} className="relative hidden md:block">
                  <button
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-[13px] font-medium text-white transition hover:bg-brand-700"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                      <Link
                        href="/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-3 text-sm font-medium text-ink-900 transition hover:bg-brand-50"
                      >
                        Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-left text-sm font-medium text-ink-900 transition hover:bg-brand-50"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : !loading ? (
              <div className="hidden items-center gap-2 md:flex">
                <ButtonLink href="/login" variant="ghost">
                  Log in
                </ButtonLink>

                <ButtonLink href="/signup" variant="primary">
                  Sign up
                </ButtonLink>
              </div>
            ) : (
              <div className="hidden h-9 w-24 md:block" />
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="relative h-9 w-9 shrink-0 lg:hidden"
            >
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-brand-900 transition ${
                  menuOpen ? "rotate-45" : "-translate-y-[6px]"
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 bg-brand-900 transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-brand-900 transition ${
                  menuOpen ? "-rotate-45" : "translate-y-[6px]"
                }`}
              />
            </button>

          </div>

        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="flex flex-col gap-4 border-b border-border pb-6 pt-4 lg:hidden">

            {searchInput("block md:hidden")}

            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive(link.href)
                      ? "bg-brand-900 text-white"
                      : "text-ink-900 hover:bg-cream-card"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!loading && session && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive("/dashboard")
                      ? "bg-brand-900 text-white"
                      : "text-ink-900 hover:bg-cream-card"
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>

            <div className="border-t border-border pt-3">
              {!loading && session ? (
                <div className="flex flex-col gap-2">
                  <ButtonLink href="/editor" variant="primary" className="w-full">
                    Write
                  </ButtonLink>

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-brand-900 transition hover:bg-cream-card"
                  >
                    Log out
                  </button>
                </div>
              ) : !loading ? (
                <div className="flex flex-col gap-2">
                  <ButtonLink href="/signup" variant="primary" className="w-full">
                    Sign up
                  </ButtonLink>

                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 text-center text-sm font-medium text-brand-900 transition hover:bg-cream-card"
                  >
                    Log in
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
