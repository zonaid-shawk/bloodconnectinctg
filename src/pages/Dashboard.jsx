import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DonorDashboard from "../components/DonorDashboard";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [emergencyCount, setEmergencyCount] = useState(0);

  useEffect(() => {
    async function fetchEmergencies() {
      try {
        const { data } = await supabase.from("emergency_requests").select("*");
        if (data) {
          const activeUrgent = data.filter((r) => r.status !== "fulfilled");
          setEmergencyCount(activeUrgent.length);
        }
      } catch (err) {
        console.error("Error fetching emergency requests for dashboard:", err);
      }
    }
    fetchEmergencies();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50/60 pb-16 pt-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
              <Link to="/" className="hover:text-red-600">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Analytics Dashboard</span>
            </nav>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Chittagong Blood Bank & Donor Statistics
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Visualizing registered donors categorized by blood type, regional availability, and emergency needs across Chittagong.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/find-donor"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Search Donors
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register as Donor
            </Link>
          </div>
        </div>

        {/* Emergency Alert Banner if any */}
        {emergencyCount > 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-lg shadow-sm">
                ⚠️
              </span>
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {emergencyCount} Active Blood {emergencyCount === 1 ? "Request" : "Requests"} in Chittagong
                </p>
                <p className="text-xs text-amber-800">
                  Urgent blood requests need fast donor matching at CMCH, Parkview, and local medical facilities.
                </p>
              </div>
            </div>
            <Link
              to="/find-donor"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              View Urgent Requests →
            </Link>
          </div>
        )}

        {/* Core Dashboard Component */}
        <DonorDashboard
          title="Chittagong Donor Registry by Blood Group"
          subtitle="Real-time visual distribution and availability analysis"
          showActionLinks={true}
        />

        {/* Secondary Educational / Info Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              🩸
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              Universal Donors (O Negative)
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              O- blood can be safely given to recipients of ANY blood type during emergency trauma care. Because less than 2% of the Bangladeshi population has Rh-negative blood, registered O- donors are vital lifesavers.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              🕒
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              90-Day Donation Cooldown
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Our registry tracks donation dates to protect donor health. Donors who contributed blood within the last 90 days are automatically marked in recovery mode to ensure safe intervals.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              📍
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              Chittagong Division Network
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Spanning the Chattogram Metropolitan Area (Kotwali, Panchlaish, Agrabad, Halishahar, Chawkbazar) along with Hathazari, Sitakunda, Patiya, Cox’s Bazar, and surrounding districts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
