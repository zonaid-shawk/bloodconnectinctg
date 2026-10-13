import { useState, useEffect, useMemo, useId } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { districts, locations } from "../data/chittagongLocations";
import { supabase } from "../lib/supabase";
import EmergencyRequestModal from "./EmergencyRequestModal";
import Toast from "./Toast";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Format Bangladesh mobile number for WhatsApp link
 */
function getWhatsAppNumber(phone) {
  if (!phone) return "";
  let clean = String(phone).replace(/\D/g, "");
  if (clean.startsWith("01") && clean.length === 11) {
    clean = "88" + clean;
  }
  if (clean.startsWith("880") && clean.length === 13) {
    return clean;
  }
  return "";
}

/**
 * Relative time formatter for emergency requests
 */
function formatTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.floor((now - date) / (1000 * 60)));
  if (diffMinutes < 5) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function SearchableDonorList({
  initialBloodGroup = "",
  initialDistrict = "",
  initialUpazila = "",
  showTitle = true,
  className = "",
}) {
  const componentId = useId();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(
    searchParams.get("bloodGroup") || initialBloodGroup
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    searchParams.get("district") || initialDistrict
  );
  const [selectedUpazila, setSelectedUpazila] = useState(
    searchParams.get("upazila") || initialUpazila
  );
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [sortBy, setSortBy] = useState("name_asc");

  const [donors, setDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Load donors and emergency blood requests
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        let query = supabase.from("available_donors").select("*");

        if (selectedBloodGroup) {
          query = query.eq("blood_group", selectedBloodGroup);
        }
        if (selectedDistrict) {
          query = query.eq("district", selectedDistrict);
        }
        if (selectedUpazila) {
          query = query.eq("upazila", selectedUpazila);
        }

        const [donorsRes, reqsRes] = await Promise.all([
          query.order("full_name"),
          supabase.from("emergency_requests").select("*"),
        ]);

        if (!active) return;

        if (donorsRes.error) {
          setError("Unable to load donors. Please try again.");
        } else {
          setDonors(donorsRes.data || []);
          setError("");
        }

        if (reqsRes.data) {
          setEmergencyRequests(reqsRes.data);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading donors & requests:", err);
        setError("Unable to load donors. Please try again.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [selectedBloodGroup, selectedDistrict, selectedUpazila, refreshCount]);

  function handleDistrictChange(e) {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedUpazila(""); // reset upazila when district changes
  }

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedBloodGroup("");
    setSelectedDistrict("");
    setSelectedUpazila("");
    setOnlyAvailable(true);
  }

  function copyToClipboard(phone) {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => {
      setCopiedPhone(null);
    }, 2000);
  }

  async function handleMarkFulfilled(requestId) {
    try {
      await supabase
        .from("emergency_requests")
        .update({ status: "fulfilled" })
        .eq("id", requestId);

      setEmergencyRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "fulfilled" } : r))
      );
      setToastMessage("Emergency request marked as fulfilled. Thank you!");
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  }

  function handleEmergencyRequestSuccess(newReq) {
    setEmergencyRequests((prev) => [newReq, ...prev]);
    setToastMessage(`Emergency blood request for ${newReq.patient_name} pinned to top of search.`);
  }

  // Filter in-memory for keyword search & availability, and apply sorting
  const filteredDonors = useMemo(() => {
    let result = [...donors];

    if (onlyAvailable) {
      result = result.filter((d) => d.availability !== false);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((d) => {
        const name = (d.full_name || "").toLowerCase();
        const phone = (d.phone || "").toLowerCase();
        const districtName = (d.district || "").toLowerCase();
        const upazilaName = (d.upazila || "").toLowerCase();
        const blood = (d.blood_group || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          districtName.includes(q) ||
          upazilaName.includes(q) ||
          blood.includes(q)
        );
      });
    }

    result.sort((a, b) => {
      if (sortBy === "name_desc") {
        return (b.full_name || "").localeCompare(a.full_name || "");
      }
      if (sortBy === "location") {
        return (a.district || "").localeCompare(b.district || "");
      }
      return (a.full_name || "").localeCompare(b.full_name || "");
    });

    return result;
  }, [donors, searchTerm, onlyAvailable, sortBy]);

  // Filter emergency requests based on blood group, district, upazila, keyword
  const filteredEmergencyRequests = useMemo(() => {
    let list = emergencyRequests.filter((r) => r.status !== "fulfilled");

    if (selectedBloodGroup) {
      list = list.filter((r) => r.blood_group === selectedBloodGroup);
    }
    if (selectedDistrict) {
      list = list.filter((r) => r.district === selectedDistrict);
    }
    if (selectedUpazila) {
      list = list.filter((r) => r.upazila === selectedUpazila);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          (r.patient_name || "").toLowerCase().includes(q) ||
          (r.hospital || "").toLowerCase().includes(q) ||
          (r.reason || "").toLowerCase().includes(q) ||
          (r.blood_group || "").toLowerCase().includes(q)
        );
      });
    }

    // Rank: Urgent requests flagged as 'urgent' ALWAYS on top, then by recency
    list.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [emergencyRequests, selectedBloodGroup, selectedDistrict, selectedUpazila, searchTerm]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedBloodGroup) ||
    Boolean(selectedDistrict) ||
    Boolean(selectedUpazila);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* EMERGENCY REQUEST MODAL */}
      <EmergencyRequestModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSuccess={handleEmergencyRequestSuccess}
        defaultBloodGroup={selectedBloodGroup || "O+"}
        defaultDistrict={selectedDistrict || "Chattogram"}
      />

      {/* TOAST ALERT */}
      <Toast
        message={toastMessage}
        type="success"
        duration={5000}
        onClose={() => setToastMessage("")}
      />

      {/* Header */}
      {showTitle && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Chittagong Blood Donors
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse available donors and live emergency blood requests across Chittagong
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm ring-2 ring-red-600/30 transition hover:bg-red-700 active:scale-95"
            >
              <span>🚨 Request Blood Urgently</span>
            </button>

            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              <span>+ Become a Donor</span>
            </Link>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        {/* Search Input Bar */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400 dark:text-gray-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id={`${componentId}-search`}
            type="text"
            placeholder="Search by donor name, area, hospital, phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-800 dark:focus:ring-red-950"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Blood Group Chips */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Filter by Blood Type
            </label>
            {selectedBloodGroup && (
              <button
                type="button"
                onClick={() => setSelectedBloodGroup("")}
                className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear blood filter
              </button>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedBloodGroup("")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                !selectedBloodGroup
                  ? "bg-red-600 text-white shadow-sm ring-2 ring-red-600/20"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-red-500 dark:hover:bg-red-950/40"
              }`}
            >
              All Types
            </button>
            {BLOOD_GROUPS.map((group) => {
              const isSelected = selectedBloodGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedBloodGroup(isSelected ? "" : group)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    isSelected
                      ? "bg-red-600 text-white shadow-sm ring-2 ring-red-600/20"
                      : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-red-500 dark:hover:bg-red-950/40"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Dropdowns in Chittagong */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor={`${componentId}-district`} className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Chittagong District / Area
            </label>
            <select
              id={`${componentId}-district`}
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            >
              <option value="">All Chittagong Areas</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${componentId}-upazila`} className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Upazila / Thana
            </label>
            <select
              id={`${componentId}-upazila`}
              value={selectedUpazila}
              onChange={(e) => setSelectedUpazila(e.target.value)}
              disabled={!selectedDistrict}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-850 dark:disabled:text-gray-600"
            >
              <option value="">
                {selectedDistrict ? "All Upazilas / Thanas" : "Select district first"}
              </option>
              {(locations[selectedDistrict] || []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${componentId}-sort`} className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Sort Donors By
            </label>
            <select
              id={`${componentId}-sort`}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            >
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="location">Location Area</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span>Show available donors only</span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset all filters</span>
            </button>
          )}
        </div>
      </div>


      {/* ERROR BANNER */}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshCount((c) => c + 1)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* EMERGENCY BLOOD REQUESTS (FLAGGED AS URGENT ON TOP)      */}
      {/* ======================================================== */}
      <section aria-labelledby="urgent-requests-heading" className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-100 text-red-600 text-sm shadow-inner dark:bg-red-950/60 dark:text-red-400">
              🚨
            </span>
            <h3 id="urgent-requests-heading" className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Emergency Blood Requests</span>
              {filteredEmergencyRequests.length > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
                  {filteredEmergencyRequests.length} Active
                </span>
              )}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline inline-flex items-center gap-1"
          >
            <span>+ Post Emergency Need</span>
          </button>
        </div>

        {filteredEmergencyRequests.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredEmergencyRequests.map((req) => {
              const waNumber = getWhatsAppNumber(req.phone);
              const waMessage = `Assalamu Alaikum, I saw your urgent request on BloodConnect for ${req.blood_group} blood at ${req.hospital}. I would like to help donate...`;
              const waLink = waNumber
                ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
                : "";

              return (
                <article
                  key={req.id}
                  className="relative overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50/90 via-rose-50/40 to-white p-5 shadow-sm ring-1 ring-red-400/20 transition hover:border-red-400 hover:shadow-md dark:border-red-900/60 dark:from-red-950/40 dark:via-rose-950/20 dark:to-gray-900"
                >
                  {/* Top Emergency Beacon */}
                  <div className="flex items-center justify-between gap-2 border-b border-red-200/70 pb-3 dark:border-red-900/50">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                        {req.urgent ? "URGENT EMERGENCY" : "Blood Request"}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(req.created_at)}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="mt-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {req.patient_name}
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 truncate">
                        <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{req.hospital}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {req.upazila ? `${req.upazila}, ` : ""}{req.district || "Chattogram"}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 rounded-2xl bg-red-600 px-3.5 py-2 text-white shadow-sm ring-2 ring-red-600/30">
                      <span className="text-xl font-black leading-none">{req.blood_group}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-200">
                        {req.bags_needed || 1} {req.bags_needed === 1 ? "Bag" : "Bags"}
                      </span>
                    </div>
                  </div>

                  {/* Reason / Context */}
                  {req.reason && (
                    <div className="mt-3 rounded-xl bg-white/90 border border-red-200/60 p-2.5 text-xs text-red-900 font-medium dark:bg-gray-800 dark:border-red-900/60 dark:text-red-200">
                      <span className="font-bold text-red-700 dark:text-red-400">Urgency Note:</span> {req.reason}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-red-200/50 dark:border-red-900/50">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.94 11.94 0 0 0 5.78 1.47h.01c6.57 0 11.91-5.35 11.91-11.92 0-3.18-1.24-6.17-3.48-8.42ZM12.09 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98.99-3.65-.24-.37a9.83 9.83 0 0 1-1.51-5.26c0-5.47 4.45-9.91 9.92-9.91a9.84 9.84 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.47-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.53.07-.81.38-.28.3-1.06 1.03-1.06 2.51 0 1.48 1.09 2.91 1.24 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.73 2.02-1.43.25-.71.25-1.31.17-1.43-.07-.13-.27-.2-.57-.35Z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <a
                      href={`tel:${req.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Call Now</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleMarkFulfilled(req.id)}
                      className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
                      title="Mark as fulfilled"
                    >
                      Fulfilled
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4 text-center dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No active emergency requests
              {selectedBloodGroup ? ` for blood group ${selectedBloodGroup}` : ""}{" "}
              at this moment.
            </p>
          </div>
        )}
      </section>

      {/* RESULTS COUNT */}
      <div className="flex items-center justify-between px-1 pt-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {loading ? (
            "Searching donors in Chittagong..."
          ) : (
            <>
              Available Donors:{" "}
              <span className="font-bold text-red-600 dark:text-red-400">{filteredDonors.length}</span>{" "}
              {filteredDonors.length === 1 ? "donor" : "donors"}
              {selectedDistrict ? ` in ${selectedDistrict}` : " in Chittagong"}
              {selectedBloodGroup ? ` (${selectedBloodGroup})` : ""}
            </>
          )}
        </p>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="h-10 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-9 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredDonors.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
            No donors found matching criteria
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {hasActiveFilters
              ? "Try adjusting your blood type or location filters to see more registered donors in Chittagong."
              : "No donors are currently available. Be the first to register in your area!"}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
              >
                Clear all filters
              </button>
            )}
            <Link
              to="/register"
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95"
            >
              Register as a donor
            </Link>
          </div>
        </div>
      )}

      {/* DONOR CARDS GRID */}
      {!loading && filteredDonors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDonors.map((donor) => {
            const waNumber = getWhatsAppNumber(donor.phone);
            const waMessage = `Assalamu Alaikum ${donor.full_name || "Donor"}, I found your profile on BloodConnect for ${donor.blood_group || "blood"} donation in ${donor.district || "Chittagong"}. Are you currently available to help?`;
            const waLink = waNumber
              ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
              : "";

            const isCopied = copiedPhone === donor.phone;

            return (
              <article
                key={donor.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-red-900/60"
              >
                <div>
                  {/* Top Bar: Name & Blood Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-gray-900 group-hover:text-red-700 dark:text-white dark:group-hover:text-red-400">
                        {donor.full_name || "Anonymous Donor"}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <svg className="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {donor.upazila ? `${donor.upazila}, ` : ""}
                          {donor.district || "Chittagong"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 rounded-xl bg-red-50 px-3 py-1.5 text-red-700 ring-1 ring-red-600/10 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900/30">
                      <span className="text-base font-black leading-none">{donor.blood_group}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Group</span>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="mt-3.5 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Available to Donate
                    </span>
                  </div>

                  {/* Mobile phone display */}
                  {donor.phone && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800">
                      <span className="font-mono text-gray-700 dark:text-gray-200">{donor.phone}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(donor.phone)}
                        className="font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Copy phone number"
                      >
                        {isCopied ? (
                          <span className="font-bold text-green-600 dark:text-green-400">Copied!</span>
                        ) : (
                          "Copy"
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.94 11.94 0 0 0 5.78 1.47h.01c6.57 0 11.91-5.35 11.91-11.92 0-3.18-1.24-6.17-3.48-8.42ZM12.09 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98.99-3.65-.24-.37a9.83 9.83 0 0 1-1.51-5.26c0-5.47 4.45-9.91 9.92-9.91a9.84 9.84 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.47-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.53.07-.81.38-.28.3-1.06 1.03-1.06 2.51 0 1.48 1.09 2.91 1.24 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.73 2.02-1.43.25-.71.25-1.31.17-1.43-.07-.13-.27-.2-.57-.35Z" />
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  {donor.phone && (
                    <a
                      href={`tel:${donor.phone}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                      title="Call donor"
                    >
                      <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

