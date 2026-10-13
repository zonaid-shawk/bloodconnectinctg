import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { locations } from "../data/chittagongLocations";

const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Blood compatibility reference
const COMPATIBILITY_INFO = {
  "O-": {
    canGiveTo: ["Everyone (Universal Red Cell Donor)"],
    canReceiveFrom: ["O-"],
    rarity: "Very Rare (~1.5% in BD)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  "O+": {
    canGiveTo: ["O+", "A+", "B+", "AB+"],
    canReceiveFrom: ["O+", "O-"],
    rarity: "Most Common (~32% in BD)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  "A-": {
    canGiveTo: ["A-", "A+", "AB-", "AB+"],
    canReceiveFrom: ["A-", "O-"],
    rarity: "Rare (~2% in BD)",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  "A+": {
    canGiveTo: ["A+", "AB+"],
    canReceiveFrom: ["A+", "A-", "O+", "O-"],
    rarity: "Common (~24% in BD)",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
  },
  "B-": {
    canGiveTo: ["B-", "B+", "AB-", "AB+"],
    canReceiveFrom: ["B-", "O-"],
    rarity: "Rare (~2.5% in BD)",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  "B+": {
    canGiveTo: ["B+", "AB+"],
    canReceiveFrom: ["B+", "B-", "O+", "O-"],
    rarity: "Very Common (~34% in BD)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  "AB-": {
    canGiveTo: ["AB-", "AB+"],
    canReceiveFrom: ["AB-", "A-", "B-", "O-"],
    rarity: "Extremely Rare (<1% in BD)",
    badgeColor: "bg-pink-100 text-pink-800 border-pink-300",
  },
  "AB+": {
    canGiveTo: ["AB+ only"],
    canReceiveFrom: ["Everyone (Universal Recipient)"],
    rarity: "Less Common (~6% in BD)",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
  },
};

export default function DonorDashboard({
  title = "Chittagong Blood Donor Analytics",
  subtitle = "Real-time distribution of registered life-savers across blood types and Chittagong regions",
  showActionLinks = true,
  className = "",
}) {
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter & view states
  const [districtFilter, setDistrictFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // 'all', 'available', 'unavailable'
  const [chartLayout, setChartLayout] = useState("vertical"); // 'vertical' or 'horizontal'
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [metricMode, setMetricMode] = useState("count"); // 'count' or 'percent'

  // Manual refresh handler
  async function handleManualRefresh() {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("*");

      if (fetchErr) throw fetchErr;
      setDonors(data || []);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load latest donor statistics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const { data, error: fetchErr } = await supabase
          .from("profiles")
          .select("*");

        if (!active) return;
        if (fetchErr) throw fetchErr;
        setDonors(data || []);
        setError("");
        setLastUpdated(new Date());
      } catch (err) {
        if (!active) return;
        console.error("Dashboard fetch error:", err);
        setError("Unable to load latest donor statistics.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Listen to window storage events if registration happened in another tab
    const handleStorage = (e) => {
      if (e.key === "bloodconnect_profiles") {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Filtered dataset
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      if (districtFilter !== "all" && d.district !== districtFilter) {
        return false;
      }
      if (availabilityFilter === "available" && !d.availability) {
        return false;
      }
      if (availabilityFilter === "unavailable" && d.availability) {
        return false;
      }
      return true;
    });
  }, [donors, districtFilter, availabilityFilter]);

  // Aggregated data per blood group
  const bloodTypeStats = useMemo(() => {
    const total = filteredDonors.length;
    const counts = {};

    ALL_BLOOD_GROUPS.forEach((bg) => {
      counts[bg] = {
        total: 0,
        available: 0,
        unavailable: 0,
        percent: 0,
      };
    });

    filteredDonors.forEach((d) => {
      const bg = d.blood_group;
      if (counts[bg]) {
        counts[bg].total += 1;
        if (d.availability) {
          counts[bg].available += 1;
        } else {
          counts[bg].unavailable += 1;
        }
      }
    });

    ALL_BLOOD_GROUPS.forEach((bg) => {
      counts[bg].percent = total > 0 ? (counts[bg].total / total) * 100 : 0;
    });

    const maxCount = Math.max(
      1,
      ...ALL_BLOOD_GROUPS.map((bg) => counts[bg].total)
    );

    return {
      total,
      counts,
      maxCount,
    };
  }, [filteredDonors]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredDonors.length;
    const available = filteredDonors.filter((d) => d.availability).length;
    const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;

    // Rh factor split
    const rhNegativeCount = filteredDonors.filter((d) =>
      d.blood_group?.endsWith("-")
    ).length;
    const rhNegativePct =
      total > 0 ? Math.round((rhNegativeCount / total) * 100) : 0;

    // Most populated group
    let topGroup = null;
    let topCount = -1;
    ALL_BLOOD_GROUPS.forEach((bg) => {
      const c = bloodTypeStats.counts[bg]?.total || 0;
      if (c > topCount) {
        topCount = c;
        topGroup = bg;
      }
    });

    // Unique Chittagong locations represented
    const uniqueLocations = new Set(
      filteredDonors.map((d) => `${d.district}-${d.upazila || ""}`).filter(Boolean)
    ).size;

    return {
      total,
      available,
      availablePct,
      rhNegativeCount,
      rhNegativePct,
      topGroup,
      topCount,
      uniqueLocations,
    };
  }, [filteredDonors, bloodTypeStats]);

  // Active highlighted group (either clicked or hovered)
  const activeFocusGroup = selectedGroup || hoveredGroup || "O+";
  const activeFocusData = bloodTypeStats.counts[activeFocusGroup] || {
    total: 0,
    available: 0,
    unavailable: 0,
    percent: 0,
  };
  const activeFocusCompat = COMPATIBILITY_INFO[activeFocusGroup] || {};

  const chittagongDistricts = useMemo(() => {
    return Object.keys(locations);
  }, []);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 sm:p-8 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 dark:border-gray-800 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {title}
            </h2>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Action / Refresh controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Refresh statistics"
          >
            <svg
              className={`h-3.5 w-3.5 text-gray-500 dark:text-gray-400 ${loading ? "animate-spin text-red-600 dark:text-red-400" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh Stats"}
          </button>

          {showActionLinks && (
            <Link
              to="/find-donor"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search Donors
            </Link>
          )}
        </div>
      </div>


      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Card 1: Total Registered Donors */}
        <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-red-50/40 p-4 dark:border-rose-950/50 dark:from-rose-950/40 dark:to-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Total Donors
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
              🩸
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {summaryMetrics.total}
          </p>
          <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">
            Registered Chittagong donors
          </p>
        </div>

        {/* Card 2: Available Right Now */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50/40 p-4 dark:border-emerald-950/50 dark:from-emerald-950/40 dark:to-green-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Available Now
            </span>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
            {summaryMetrics.available}
          </p>
          <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-300/80">
            {summaryMetrics.availablePct}% ready for emergency call
          </p>
        </div>

        {/* Card 3: Rare Blood Donors (Rh-Negative) */}
        <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50/40 p-4 dark:border-purple-950/50 dark:from-purple-950/40 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Rare (Rh -)
            </span>
            <span className="rounded bg-purple-200/70 px-1.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
              A-, B-, AB-, O-
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-purple-900 dark:text-purple-200">
            {summaryMetrics.rhNegativeCount}
          </p>
          <p className="mt-1 text-xs text-purple-700/90 dark:text-purple-300/80">
            {summaryMetrics.rhNegativePct}% of registered pool
          </p>
        </div>

        {/* Card 4: Most Stocked Blood Type */}
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50/40 p-4 dark:border-blue-950/50 dark:from-blue-950/40 dark:to-sky-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Leading Group
            </span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {summaryMetrics.topCount} Donors
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-blue-900 dark:text-blue-200">
            {summaryMetrics.topGroup || "—"}
          </p>
          <p className="mt-1 text-xs text-blue-700/90 dark:text-blue-300/80">
            Highest donor readiness
          </p>
        </div>
      </div>

      {/* Filter and View toolbar */}
      <div className="mt-8 flex flex-col gap-3 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Location filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="dashboard-district-filter"
              className="text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Region:
            </label>
            <select
              id="dashboard-district-filter"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Chittagong Regions</option>
              {chittagongDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="dashboard-avail-filter"
              className="text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              Status:
            </label>
            <select
              id="dashboard-avail-filter"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Registered Donors</option>
              <option value="available">Available Now Only</option>
              <option value="unavailable">Unavailable / In Cooldown</option>
            </select>
          </div>
        </div>

        {/* View Mode & Metric toggles */}
        <div className="flex items-center gap-2">
          {/* Metric toggle: Count vs Percent */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-850">
            <button
              type="button"
              onClick={() => setMetricMode("count")}
              className={`rounded-md px-2.5 py-1 transition ${
                metricMode === "count"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              Counts
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("percent")}
              className={`rounded-md px-2.5 py-1 transition ${
                metricMode === "percent"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              Percent %
            </button>
          </div>

          {/* Orientation toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-850">
            <button
              type="button"
              onClick={() => setChartLayout("vertical")}
              title="Vertical column chart"
              className={`rounded-md p-1.5 transition ${
                chartLayout === "vertical"
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setChartLayout("horizontal")}
              title="Horizontal distribution bars"
              className={`rounded-md p-1.5 transition ${
                chartLayout === "horizontal"
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h10a1 1 0 100-2H3zM3 13a1 1 0 100 2h6a1 1 0 100-2H3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Registered Donors by Blood Group
            </h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/70 dark:text-red-300">
              8 Types Categorized
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Click any bar for details & matching
          </span>
        </div>


        {/* Vertical Column Bar Chart */}
        {chartLayout === "vertical" ? (
          <div className="relative mt-6 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors dark:border-gray-800 dark:bg-gray-950/60 sm:p-6">
            {/* Grid lines and background marks */}
            <div className="relative h-64 w-full">
              {/* Horizontal Reference Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                  const val =
                    metricMode === "count"
                      ? Math.round(bloodTypeStats.maxCount * ratio)
                      : Math.round(100 * ratio) + "%";
                  return (
                    <div
                      key={ratio}
                      className="flex items-center text-[10px] text-gray-400 border-b border-gray-200/70 dark:text-gray-500 dark:border-gray-800/80"
                    >
                      <span className="w-8 shrink-0 text-right pr-2">
                        {val}
                      </span>
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>

              {/* Bars container */}
              <div className="absolute inset-0 ml-8 flex items-end justify-around gap-2 pb-1 pt-4 sm:gap-4">
                {ALL_BLOOD_GROUPS.map((group) => {
                  const stats = bloodTypeStats.counts[group];
                  const total = stats.total;
                  const available = stats.available;
                  const unavailable = stats.unavailable;
                  const percent = stats.percent;

                  // Height calculation
                  const heightPercent =
                    bloodTypeStats.maxCount > 0
                      ? Math.max(
                          total > 0 ? 8 : 2,
                          (total / bloodTypeStats.maxCount) * 100
                        )
                      : 0;

                  const isSelected = selectedGroup === group;
                  const isHovered = hoveredGroup === group;
                  const isRhNeg = group.endsWith("-");

                  return (
                    <div
                      key={group}
                      className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
                      onClick={() =>
                        setSelectedGroup(isSelected ? null : group)
                      }
                      onMouseEnter={() => setHoveredGroup(group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedGroup(isSelected ? null : group);
                        }
                      }}
                      aria-label={`${group}: ${total} donors`}
                    >
                      {/* Tooltip on hover/focus */}
                      {(isHovered || isSelected) && (
                        <div className="pointer-events-none absolute -top-12 z-20 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-center text-xs font-semibold text-white shadow-lg ring-1 ring-white/10 transition-transform dark:bg-gray-800">
                          <span className="font-bold text-red-300 dark:text-red-400">{group}:</span>{" "}
                          {total} {total === 1 ? "donor" : "donors"} (
                          {percent.toFixed(1)}%)
                          <div className="text-[10px] text-gray-300 dark:text-gray-400">
                            {available} ready • {unavailable} cooldown
                          </div>
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-800" />
                        </div>
                      )}

                      {/* Value label directly above bar */}
                      <div className="mb-1.5 flex flex-col items-center text-center">
                        <span
                          className={`text-xs font-bold transition-all ${
                            isSelected || isHovered
                              ? "scale-110 text-red-600 font-extrabold dark:text-red-400"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {metricMode === "count"
                            ? total
                            : `${Math.round(percent)}%`}
                        </span>
                      </div>

                      {/* The Bar */}
                      <div
                        className="relative w-full max-w-[48px] rounded-t-lg transition-all duration-300 flex flex-col justify-end overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Background bar base */}
                        <div
                          className={`w-full h-full rounded-t-lg transition-all shadow-xs ${
                            isSelected
                              ? "ring-2 ring-red-500 ring-offset-2 bg-gradient-to-t from-red-700 via-red-600 to-rose-500 dark:ring-offset-gray-900"
                              : isHovered
                              ? "bg-gradient-to-t from-red-600 via-rose-500 to-rose-400"
                              : isRhNeg
                              ? "bg-gradient-to-t from-purple-700 via-purple-600 to-rose-500"
                              : "bg-gradient-to-t from-red-600 via-red-500 to-rose-400"
                          }`}
                        >
                          {/* Segment showing unavailable/cooldown if any */}
                          {unavailable > 0 && total > 0 && (
                            <div
                              className="w-full bg-black/25 border-b border-white/20 transition-all"
                              style={{
                                height: `${(unavailable / total) * 100}%`,
                              }}
                              title={`${unavailable} donors in 90-day cooldown`}
                            />
                          )}
                        </div>
                      </div>

                      {/* X-axis Blood Group Label */}
                      <div className="mt-2.5 flex flex-col items-center">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs font-bold transition-colors ${
                            isSelected
                              ? "bg-red-600 text-white"
                              : isHovered
                              ? "bg-gray-800 text-white dark:bg-gray-700"
                              : "bg-white text-gray-800 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {group}
                        </span>
                        {isRhNeg && (
                          <span className="mt-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-400">
                            Rh-
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-between border-t border-gray-200/80 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-gradient-to-r from-red-600 to-rose-500" />
                  Rh+ Donors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-gradient-to-r from-purple-700 to-rose-500" />
                  Rh- Rare Donors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-gray-400/60 dark:bg-gray-600" />
                  Cooldown / Inactive Portion
                </span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          /* Horizontal Distribution Bar Chart */
          <div className="mt-6 space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors dark:border-gray-800 dark:bg-gray-950/60 sm:p-6">
            {ALL_BLOOD_GROUPS.map((group) => {
              const stats = bloodTypeStats.counts[group];
              const total = stats.total;
              const available = stats.available;
              const unavailable = stats.unavailable;
              const percent = stats.percent;
              const barWidth =
                bloodTypeStats.maxCount > 0
                  ? Math.max(
                      total > 0 ? 6 : 1,
                      (total / bloodTypeStats.maxCount) * 100
                    )
                  : 0;

              const isSelected = selectedGroup === group;
              const isRhNeg = group.endsWith("-");

              return (
                <div
                  key={group}
                  onClick={() => setSelectedGroup(isSelected ? null : group)}
                  className={`group flex items-center gap-3 rounded-lg p-2 transition cursor-pointer ${
                    isSelected
                      ? "bg-red-50/80 ring-1 ring-red-300 dark:bg-red-950/40 dark:ring-red-900"
                      : "hover:bg-white dark:hover:bg-gray-850"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  {/* Blood Group Tag */}
                  <div className="w-14 shrink-0 text-left">
                    <span
                      className={`inline-block min-w-[36px] rounded-md px-2 py-0.5 text-center text-xs font-bold ${
                        isSelected
                          ? "bg-red-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {group}
                    </span>
                    {isRhNeg && (
                      <span className="ml-1 text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                        Rh-
                      </span>
                    )}
                  </div>

                  {/* Horizontal Bar Track */}
                  <div className="relative h-7 flex-1 rounded-md bg-gray-200/70 overflow-hidden dark:bg-gray-800">
                    <div
                      className={`h-full rounded-md transition-all duration-300 flex items-center justify-between px-2.5 ${
                        isRhNeg
                          ? "bg-gradient-to-r from-purple-700 to-rose-500"
                          : "bg-gradient-to-r from-red-600 to-rose-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 20 && (
                        <span className="text-[11px] font-bold text-white drop-shadow-xs">
                          {available} ready{unavailable > 0 ? ` • ${unavailable} resting` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value / Percentage */}
                  <div className="w-24 shrink-0 text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {total} {total === 1 ? "donor" : "donors"}
                    </span>
                    <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                      {percent.toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Blood Group Deep-Dive Card */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5 transition-colors dark:border-gray-800 dark:from-gray-850 dark:to-gray-900 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-xl font-black text-white shadow-md">
              {activeFocusGroup}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  Blood Group {activeFocusGroup} Overview
                </h4>
                {activeFocusCompat.badgeColor && (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${activeFocusCompat.badgeColor}`}
                  >
                    {activeFocusCompat.rarity}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeFocusData.total} registered in Chittagong (
                {activeFocusData.available} currently available •{" "}
                {activeFocusData.unavailable} in rest period)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/find-donor?bloodGroup=${encodeURIComponent(activeFocusGroup)}`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              View All {activeFocusGroup} Donors
            </button>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              + Register as {activeFocusGroup}
            </Link>
          </div>
        </div>

        {/* Compatibility Matrix Pills */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-3 border border-gray-100 dark:border-gray-750 dark:bg-gray-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Can Donate Red Cells To:
            </span>
            <p className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-200">
              {activeFocusCompat.canGiveTo?.join(", ") || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-gray-100 dark:border-gray-750 dark:bg-gray-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Can Receive Blood From:
            </span>
            <p className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-200">
              {activeFocusCompat.canReceiveFrom?.join(", ") || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

