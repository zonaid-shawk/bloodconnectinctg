import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Navbar() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

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
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-red-600">
          🩸 BloodConnect
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="font-medium text-gray-700 hover:text-red-600">
            Home
          </Link>

          <Link
            to="/find-donor"
            className="font-medium text-gray-700 hover:text-red-600"
          >
            Find Donor
          </Link>

          <Link
            to="/dashboard"
            className="font-medium text-gray-700 hover:text-red-600 flex items-center gap-1.5"
          >
            <span>Dashboard</span>
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
              Stats
            </span>
          </Link>

          <Link
            to="/about"
            className="font-medium text-gray-700 hover:text-red-600"
          >
            About
          </Link>

          {!checking &&
            (session ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="font-semibold text-red-600 hover:text-red-700"
                >
                  Register
                </Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
