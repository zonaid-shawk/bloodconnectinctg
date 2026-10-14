import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ThemeToggle from "./ThemeToggle";
import SupabaseStatusModal from "./SupabaseStatusModal";

function Navbar() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(error ? null : data.session);
      setChecking(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/80 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-black tracking-tight text-red-600 transition-transform hover:scale-[1.02] dark:text-red-500 sm:text-2xl"
        >
          <span className="text-2xl">🩸</span>
          <span>BloodConnect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
          >
            Home
          </Link>

          <Link
            to="/find-donor"
            className="text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
          >
            Find Donor
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
          >
            <span>Dashboard</span>
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
              Stats
            </span>
          </Link>

          <Link
            to="/about"
            className="text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
          >
            About
          </Link>

          {/* Supabase Status Button */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100/90 active:scale-95 transition dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
            title="Inspect Supabase backend connection & SQL schema"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database</span>
          </button>

          {/* Theme Mode Toggle */}
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800" />
          <ThemeToggle />

          {!checking &&
            (session ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Register
                </Link>
              </div>
            ))}
        </nav>

        {/* Mobile Right Controls: ThemeToggle + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Home
            </Link>

            <Link
              to="/find-donor"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Find Donor
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <span>Dashboard</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
                Stats
              </span>
            </Link>

            <Link
              to="/about"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              About
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsDbModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Database & SQL</span>
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                View
              </span>
            </button>

            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

            {!checking &&
              (session ? (
                <>
                  <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/login"
                    className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Register
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Supabase Status & SQL Schema Modal */}
      <SupabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </header>
  );
}

export default Navbar;

