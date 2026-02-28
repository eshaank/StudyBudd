"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* -------------------- Auth -------------------- */
  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoading(false);
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setMenuOpen(false);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  /* Close menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Close on outside click / ESC */
  useEffect(() => {
    function handleClick(e) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  /* -------------------- Helpers -------------------- */
  const displayName = useMemo(() => {
    if (!user?.email) return "Account";
    return user.email.split("@")[0];
  }, [user]);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh?.();
  }

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`nav-pill ${active ? "nav-pill--active" : ""}`}
      >
        {label}
      </Link>
    );
  };

  const isAuthRoute =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  const showTopLinks = !user;

  /* -------------------- Render -------------------- */
  return (
    <header className="sticky top-0 z-50 liquid-header">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-3">
        <div className="liquid-nav rounded-2xl border border-white/10 overflow-visible">
          <div className="relative flex items-center justify-between px-4 py-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/S.svg"
                alt="StudyBudd"
                width={40}
                height={40}
                priority
              />
              <div className="leading-tight">
                <div className="text-white font-extrabold tracking-tight">
                  StudyBudd
                </div>
                <div className="text-xs text-white/70 -mt-0.5">
                  AI Study Companion
                </div>
              </div>
            </Link>

            {/* Desktop nav (logged out only) */}
            {showTopLinks && (
              <nav className="hidden md:flex items-center gap-2">
                {navLink("/features", "Features")}
                {navLink("/pricing", "Pricing")}
                {navLink("/quizzes", "Quizzes")}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notification bell — only when logged in */}
              {!loading && user && <NotificationBell />}

              <div ref={menuRef}>
              {loading ? (
                <span className="text-white/70 text-sm px-3">...</span>
              ) : user ? (
                <div className="relative">

                  {/* ✅ Account trigger */}
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className={`account-trigger ${
                      menuOpen ? "account-trigger--open" : ""
                    }`}
                    title={user.email ?? "Account menu"}
                  >
                    <span className="account-trigger__avatar">
                      {displayName?.[0]?.toUpperCase() ?? "U"}
                    </span>

                    <span className="account-trigger__name">
                      {displayName}
                    </span>

                    <span
                      className="account-trigger__icon"
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M4 7h16M4 12h16M4 17h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <div
                      role="menu"
                      className="menu-panel absolute right-0 mt-2 w-64 z-[9999]"
                    >
                      <div className="px-3 py-2 text-xs text-white/70 border-b border-white/10">
                        Signed in as{" "}
                        <span className="text-white/90">
                          {user.email}
                        </span>
                      </div>

                      <div className="p-2 flex flex-col gap-1">
                        <Link href="/dashboard" className="menu-item">
                          Dashboard
                        </Link>
                        <Link href="/dashboard/files" className="menu-item">
                          Files
                        </Link>
                        <Link href="/dashboard/chat" className="menu-item">
                          Chat
                        </Link>
                        <Link href="/dashboard/quizzes" className="menu-item">
                          Quizzes
                        </Link>

                        <div className="h-px bg-white/10 my-1" />

                        <Link href="/account" className="menu-item">
                          Account
                        </Link>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                          onClick={signOut}
                          className="menu-item menu-item--danger"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!isAuthRoute && (
                    <Link
                      href="/login"
                      className="nav-pill nav-pill--ghost"
                    >
                      Log in
                    </Link>
                  )}
                  <Link href="/signup" className="nav-btn nav-btn--light">
                    Sign up
                  </Link>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Mobile nav (logged out only) */}
          {!user && (
            <div className="md:hidden flex items-center gap-2 px-4 pb-3">
              {navLink("/features", "Features")}
              {navLink("/pricing", "Pricing")}
              {navLink("/quizzes", "Quizzes")}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
