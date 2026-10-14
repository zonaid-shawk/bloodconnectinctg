import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function formatDonationDate(dateStr) {
  if (!dateStr) return "No recorded donations yet";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function calculateNextEligibleDate(lastDonationDateStr) {
  if (!lastDonationDateStr) {
    return { isEligible: true, daysRemaining: 0, text: "Eligible to donate today" };
  }
  const lastDate = new Date(lastDonationDateStr);
  if (isNaN(lastDate.getTime())) {
    return { isEligible: true, daysRemaining: 0, text: "Eligible to donate today" };
  }
  // Standard WHO / Red Crescent guideline: 90 days cooldown for whole blood
  const nextEligible = new Date(lastDate);
  nextEligible.setDate(nextEligible.getDate() + 90);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = nextEligible - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { isEligible: true, daysRemaining: 0, text: "Eligible to donate now" };
  }
  return {
    isEligible: false,
    daysRemaining: diffDays,
    text: `Next eligible in ~${diffDays} day${diffDays === 1 ? "" : "s"} (${nextEligible.toLocaleDateString("en-GB", { day: "numeric", month: "short" })})`,
  };
}

export default function DonorProfileModal({
  isOpen,
  donor,
  onClose,
  onUpdateDonor,
}) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form state for logging a new donation
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logHospital, setLogHospital] = useState("");
  const [logPatient, setLogPatient] = useState("");
  const [logUnits, setLogUnits] = useState(1);
  const [logNotes, setLogNotes] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState("");
  const [logError, setLogError] = useState("");

  function handleClose() {
    setShowLogForm(false);
    setLogSuccessMessage("");
    setLogError("");
    onClose?.();
  }

  useEffect(() => {
    if (!isOpen || !donor?.id) {
      return;
    }

    let active = true;

    async function fetchDonationHistory() {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("donation_history")
          .select("*")
          .eq("donor_id", donor.id)
          .order("donation_date", { ascending: false });

        if (!active) return;
        if (error) {
          console.warn("Could not fetch donation history:", error);
          setHistory([]);
        } else {
          setHistory(data || []);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading donor history:", err);
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    fetchDonationHistory();

    return () => {
      active = false;
    };
  }, [isOpen, donor]);

  if (!isOpen || !donor) return null;

  const eligibility = calculateNextEligibleDate(donor.last_donation_date);

  const cleanPhone = donor.phone ? String(donor.phone).replace(/\D/g, "") : "";
  const cleanWa = donor.whatsapp_number
    ? String(donor.whatsapp_number).replace(/\D/g, "")
    : cleanPhone;

  let waIntl = cleanWa;
  if (waIntl.startsWith("0")) {
    waIntl = "880" + waIntl.slice(1);
  } else if (!waIntl.startsWith("880") && waIntl.length === 10) {
    waIntl = "880" + waIntl;
  }

  const waGreeting = `Assalamu Alaikum ${donor.full_name || "Brother/Sister"}, I found your profile on BloodConnect for ${donor.blood_group || "blood"} donation in ${donor.district || "Chittagong"}. Are you currently available to donate?`;
  const waUrl = waIntl ? `https://wa.me/${waIntl}?text=${encodeURIComponent(waGreeting)}` : "";

  function handleCopyPhone() {
    if (!donor.phone) return;
    navigator.clipboard.writeText(donor.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  async function handleLogDonationSubmit(e) {
    e.preventDefault();
    if (!logHospital.trim()) {
      setLogError("Please enter the hospital or medical center name.");
      return;
    }

    setLogSubmitting(true);
    setLogError("");
    setLogSuccessMessage("");

    try {
      const newHistoryRecord = {
        donor_id: donor.id,
        donation_date: logDate,
        hospital: logHospital.trim(),
        patient_name: logPatient.trim() || null,
        units_donated: Number(logUnits) || 1,
        notes: logNotes.trim() || null,
        verified: true,
      };

      const { data: insertedData, error: insertErr } = await supabase
        .from("donation_history")
        .insert(newHistoryRecord)
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      // Update donor record with latest date and updated total
      const updatedTotal = (donor.total_donations || history.length) + 1;
      const updatedLastDate =
        !donor.last_donation_date || logDate > donor.last_donation_date
          ? logDate
          : donor.last_donation_date;

      await supabase
        .from("donors")
        .update({
          last_donation_date: updatedLastDate,
          total_donations: updatedTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", donor.id);

      const recordToDisplay = insertedData || newHistoryRecord;
      setHistory((prev) => [recordToDisplay, ...prev]);

      const updatedDonor = {
        ...donor,
        last_donation_date: updatedLastDate,
        total_donations: updatedTotal,
      };

      onUpdateDonor?.(updatedDonor);

      setLogSuccessMessage("Donation successfully logged in the database!");
      setShowLogForm(false);
      setLogHospital("");
      setLogPatient("");
      setLogNotes("");
    } catch (err) {
      console.error("Failed to log donation:", err);
      setLogError(err.message || "Failed to save donation log. Please try again.");
    } finally {
      setLogSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-donor-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-900 my-8">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-6 text-white sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close profile modal"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white/90 hover:bg-black/40 hover:text-white transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              {/* Blood Group Badge */}
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-red-600 shadow-md ring-4 ring-white/20">
                <span className="text-2xl font-black leading-none">{donor.blood_group}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Blood
                </span>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-rose-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  Registered Life Saver
                </span>
                <h2
                  id="modal-donor-name"
                  className="mt-1 text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  {donor.full_name || "Blood Donor"}
                </h2>
                <p className="text-xs text-rose-100">
                  {donor.upazila ? `${donor.upazila}, ` : ""}
                  {donor.district || "Chattogram"}
                </p>
              </div>
            </div>

            {/* Availability Indicator */}
            <div className="self-start sm:self-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs ${
                  donor.availability
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    donor.availability ? "bg-white" : "bg-gray-400"
                  }`}
                />
                {donor.availability ? "Available to Donate" : "Currently Resting"}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {/* Direct Contact Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {donor.phone && (
              <a
                href={`tel:${donor.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call ({donor.phone})</span>
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.94 11.94 0 0 0 5.78 1.47h.01c6.57 0 11.91-5.35 11.91-11.92 0-3.18-1.24-6.17-3.48-8.42ZM12.09 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98.99-3.65-.24-.37a9.83 9.83 0 0 1-1.51-5.26c0-5.47 4.45-9.91 9.92-9.91a9.84 9.84 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.47-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.53.07-.81.38-.28.3-1.06 1.03-1.06 2.51 0 1.48 1.09 2.91 1.24 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.73 2.02-1.43.25-.71.25-1.31.17-1.43-.07-.13-.27-.2-.57-.35Z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}

            {donor.phone && (
              <button
                type="button"
                onClick={handleCopyPhone}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition"
              >
                {copiedPhone ? (
                  <span className="font-bold text-green-600 dark:text-green-400">Copied!</span>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy Phone</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Donations
              </span>
              <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                {donor.total_donations || history.length || 0}
                <span className="ml-1 text-xs font-semibold text-gray-500">times</span>
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Last Donated
              </span>
              <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">
                {formatDonationDate(donor.last_donation_date)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/50 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Donation Eligibility
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    eligibility.isEligible ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {eligibility.text}
                </p>
              </div>
            </div>
          </div>

          {/* Donor Details Card */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 text-xs dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
              <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Donor Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
              <div>
                <span className="text-gray-400 dark:text-gray-500">Location:</span>{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {donor.upazila ? `${donor.upazila}, ` : ""}
                  {donor.district || "Chattogram"}
                </span>
              </div>

              {donor.address && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Address:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {donor.address}
                  </span>
                </div>
              )}

              {donor.gender && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Gender:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {donor.gender}
                  </span>
                </div>
              )}

              {donor.email && (
                <div className="truncate">
                  <span className="text-gray-400 dark:text-gray-500">Email:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {donor.email}
                  </span>
                </div>
              )}
            </div>

            {donor.notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Notes: </span>
                {donor.notes}
              </div>
            )}
          </div>

          {/* Donation History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Donation History
                </h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/80 dark:text-red-300">
                  {history.length} {history.length === 1 ? "Record" : "Records"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowLogForm((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <span>{showLogForm ? "Cancel" : "+ Log Donation"}</span>
              </button>
            </div>

            {logSuccessMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                {logSuccessMessage}
              </div>
            )}

            {/* Toggleable Log Donation Form */}
            {showLogForm && (
              <form
                onSubmit={handleLogDonationSubmit}
                className="rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    Record New Blood Donation
                  </h4>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Saves to Supabase donation_history
                  </span>
                </div>

                {logError && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {logError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Donation Date *
                    </label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Units / Bags Donated
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={logUnits}
                      onChange={(e) => setLogUnits(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Hospital / Blood Center *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CMCH, Parkview Hospital, Imperial"
                      value={logHospital}
                      onChange={(e) => setLogHospital(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Recipient / Patient Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency Cardiac Ward patient"
                      value={logPatient}
                      onChange={(e) => setLogPatient(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notes / Verification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Replacement blood for surgery, platelet donation"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logSubmitting}
                    className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    {logSubmitting ? "Saving..." : "Save Donation Record"}
                  </button>
                </div>
              </form>
            )}

            {/* Timeline of previous donations */}
            {loadingHistory ? (
              <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                Loading donation history...
              </div>
            ) : history.length > 0 ? (
              <div className="relative border-l-2 border-red-200 pl-4 space-y-4 dark:border-red-900/60 ml-2">
                {history.map((record, index) => (
                  <div key={record.id || index} className="relative group">
                    {/* Timeline bullet */}
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-red-600 ring-4 ring-white dark:ring-gray-900" />

                    <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {record.hospital || "Blood Donation"}
                          </span>
                          {record.patient_name && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300">
                              For: {record.patient_name}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
                            {formatDonationDate(record.donation_date)}
                          </span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {record.units_donated || 1} {record.units_donated === 1 ? "Bag" : "Bags"} (450ml)
                          </p>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/50 pt-1.5 dark:border-gray-700/50">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/40">
                <span className="text-2xl">🩸</span>
                <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No recorded donations yet on BloodConnect
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {donor.last_donation_date
                    ? `Self-reported last donation: ${formatDonationDate(donor.last_donation_date)}`
                    : "Log a donation using the button above to start their donation timeline."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/90 sm:px-8 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Donor ID: <span className="font-mono text-gray-700 dark:text-gray-300">{donor.id}</span>
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
