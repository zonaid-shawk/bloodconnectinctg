import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function RegistrationSuccessModal({
  isOpen,
  donor,
  onClose,
  onRegisterAnother,
}) {
  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !donor) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop click area */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 dark:border dark:border-gray-800 dark:bg-gray-900 dark:ring-white/10">
        {/* Decorative top accent gradient */}
        <div className="h-3 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Header & Celebration Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner dark:bg-red-950/60 dark:text-red-400">
              <svg
                className="h-9 w-9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <span className="mt-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Registration Successful
            </span>

            <h2
              id="success-modal-title"
              className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl"
            >
              Welcome to BloodConnect!
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 max-w-sm">
              Thank you, <span className="font-semibold text-gray-900 dark:text-white">{donor.full_name}</span>. You are now officially registered as a life-saving donor in Chittagong.
            </p>
          </div>

          {/* Donor Identity Card Preview */}
          <div className="mt-6 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 via-white to-gray-50 p-5 shadow-sm dark:border-red-900/50 dark:bg-gradient-to-br dark:from-red-950/30 dark:via-gray-900 dark:to-gray-900">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200/80 pb-3.5 dark:border-gray-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Registered Donor
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{donor.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{donor.email}</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-red-600 px-3.5 py-2 text-white shadow-sm">
                <span className="text-xl font-black leading-none">{donor.blood_group}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-200">Group</span>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Chittagong Location</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                  {donor.upazila ? `${donor.upazila}, ` : ""}{donor.district || "Chattogram"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">Contact Mobile</span>
                <span className="font-semibold font-mono text-gray-800 dark:text-gray-200 block truncate">
                  {donor.phone}
                </span>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-gray-100 text-xs dark:border-gray-800 dark:bg-gray-800/80">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {donor.availability ? "Available for emergency donation" : "Status: Inactive"}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-[11px]">Chittagong Network</span>
            </div>
          </div>

          {/* Information Notice */}
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Authorized recipients and volunteers in Chittagong can now reach you via WhatsApp or mobile when compatible blood is needed.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/find-donor"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              Browse Chittagong Donors
            </Link>

            <Link
              to="/profile"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Go to My Profile
            </Link>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                onRegisterAnother?.();
                onClose?.();
              }}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition dark:text-gray-400 dark:hover:text-red-400"
            >
              Register Another Donor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
