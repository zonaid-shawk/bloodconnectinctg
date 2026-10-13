import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { supabase } from "./lib/supabase";
import { ensureDonorProfile } from "./lib/ensureDonorProfile";

import Home from "./pages/Home";
import About from "./pages/About";
import FindDonor from "./pages/FindDonor";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  const [profileSyncError, setProfileSyncError] = useState("");

  useEffect(() => {
    let mounted = true;
    const pendingSyncs = new Set();

    function syncDonorProfile(user) {
      const timeoutId = setTimeout(async () => {
        pendingSyncs.delete(timeoutId);

        if (!mounted) return;

        try {
          await ensureDonorProfile(user);
          if (mounted) setProfileSyncError("");
        } catch (error) {
          console.error("Failed to save donor profile:", error);
          if (mounted) {
            setProfileSyncError(
              "Your account is confirmed, but your donor profile could not be saved. Please contact support.",
            );
          }
        }
      }, 0);

      pendingSyncs.add(timeoutId);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        syncDonorProfile(session.user);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted && data.session?.user) {
          syncDonorProfile(data.session.user);
        }
      })
      .catch((error) => {
        console.error("Failed to check the signed-in user:", error);
      });

    return () => {
      mounted = false;
      pendingSyncs.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {profileSyncError && (
          <p
            role="alert"
            className="bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            {profileSyncError}
          </p>
        )}

        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/find-donor" element={<FindDonor />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
