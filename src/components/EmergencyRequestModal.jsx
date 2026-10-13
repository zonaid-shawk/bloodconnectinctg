import { useState, useId, useEffect } from "react";
import { districts, locations } from "../data/chittagongLocations";
import { supabase } from "../lib/supabase";
import {
  validateBdPhone,
  validateChittagongLocation,
} from "../lib/donorValidation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const COMMON_CHITTAGONG_HOSPITALS = [
  "Chittagong Medical College Hospital (CMCH)",
  "Parkview Hospital, Panchlaish",
  "Imperial Hospital, Pahartali",
  "CSCR Hospital, Prabartak Circle",
  "Chattogram General Hospital (Anderkilla)",
  "Max Hospital & Diagnostic, Mehdibag",
  "National Hospital Chittagong",
  "Evercare Hospital Chattogram",
  "Al-Manahil Hospital",
];

export default function EmergencyRequestModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBloodGroup = "O+",
  defaultDistrict = "Chattogram",
}) {
  const formId = useId();

  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: defaultBloodGroup || "O+",
    bagsNeeded: 1,
    hospital: "",
    district: defaultDistrict,
    upazila: locations[defaultDistrict]?.[0] || "",
    phone: "",
    urgent: true,
    reason: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [prevDefaultBloodGroup, setPrevDefaultBloodGroup] = useState(defaultBloodGroup);
  if (defaultBloodGroup !== prevDefaultBloodGroup) {
    setPrevDefaultBloodGroup(defaultBloodGroup);
    setFormData((prev) => ({ ...prev, bloodGroup: defaultBloodGroup || "O+" }));
  }

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === "district") {
        updated.upazila = locations[value]?.[0] || "";
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient or contact person name is required.";
    }

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = "Blood type is required.";
    }

    if (!formData.hospital.trim()) {
      newErrors.hospital = "Please specify hospital or medical clinic.";
    }

    const phoneRes = validateBdPhone(formData.phone, {
      required: true,
      fieldName: "Emergency contact number",
    });
    if (!phoneRes.isValid) {
      newErrors.phone = phoneRes.error;
    }

    const locRes = validateChittagongLocation(
      formData.district,
      formData.upazila
    );
    if (locRes.districtError) newErrors.district = locRes.districtError;
    if (locRes.upazilaError) newErrors.upazila = locRes.upazilaError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) {
      setSubmitError("Please fill in the required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const phoneRes = validateBdPhone(formData.phone, { required: true });

      const requestPayload = {
        patient_name: formData.patientName.trim(),
        blood_group: formData.bloodGroup,
        bags_needed: Number(formData.bagsNeeded) || 1,
        hospital: formData.hospital.trim(),
        district: formData.district,
        upazila: formData.upazila,
        phone: phoneRes.normalized,
        urgent: formData.urgent,
        reason: formData.reason.trim() || (formData.urgent ? "Emergency blood required immediately" : ""),
        notes: formData.notes.trim() || null,
        status: "active",
      };

      const { data, error: insertError } = await supabase
        .from("emergency_requests")
        .insert(requestPayload);

      if (insertError) {
        throw insertError;
      }

      onSuccess?.(data?.[0] || requestPayload);
      onClose();
    } catch (err) {
      console.error("Emergency request submit error:", err);
      setSubmitError(err.message || "Failed to submit emergency request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Urgent header bar */}
        <div className="h-3 w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 animate-pulse" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 text-xl shadow-inner">
              🚨
            </span>
            <div>
              <h2
                id={`${formId}-title`}
                className="text-lg font-extrabold text-gray-900"
              >
                Post Emergency Blood Request
              </h2>
              <p className="text-xs text-gray-500">
                Flag your urgent blood need to donors across Chittagong
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-4.5">
          {submitError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {submitError}
            </div>
          )}

          {/* URGENT TOGGLE CALLOUT */}
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/70 p-4 transition">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="urgent"
                checked={formData.urgent}
                onChange={handleChange}
                className="mt-0.5 h-5 w-5 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-red-800">
                    Flag as 'Urgent' Emergency
                  </span>
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Top Priority
                  </span>
                </div>
                <p className="mt-1 text-xs text-red-700 leading-relaxed">
                  Urgent requests are pinned at the top of Chittagong search results with high-priority emergency alerts.
                </p>
              </div>
            </label>
          </div>

          {/* Blood Group Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Blood Group Needed <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {BLOOD_GROUPS.map((group) => {
                const isSelected = formData.bloodGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, bloodGroup: group }));
                      if (errors.bloodGroup) setErrors((prev) => ({ ...prev, bloodGroup: "" }));
                    }}
                    className={`flex h-11 flex-col items-center justify-center rounded-xl border font-black transition ${
                      isSelected
                        ? "border-red-600 bg-red-600 text-white shadow-sm ring-2 ring-red-600/20"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <span>{group}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-patientName`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Patient / Attendant Name <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-patientName`}
                name="patientName"
                type="text"
                required
                placeholder="e.g. Fatima Begum"
                value={formData.patientName}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
              {errors.patientName && (
                <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-bagsNeeded`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Units / Bags Needed
              </label>
              <select
                id={`${formId}-bagsNeeded`}
                name="bagsNeeded"
                value={formData.bagsNeeded}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Bag (Unit)" : "Bags (Units)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hospital Name & Suggestions */}
          <div>
            <label htmlFor={`${formId}-hospital`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Hospital / Medical Facility <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-hospital`}
              name="hospital"
              type="text"
              required
              placeholder="e.g. Chittagong Medical College Hospital (CMCH)"
              value={formData.hospital}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
            {errors.hospital && (
              <p className="mt-1 text-xs text-red-600">{errors.hospital}</p>
            )}

            {/* Quick hospital chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-gray-400 self-center">Quick pick:</span>
              {COMMON_CHITTAGONG_HOSPITALS.slice(0, 4).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, hospital: h }))}
                  className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
                >
                  {h.split(",")[0].replace(" Hospital", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Location Dropdowns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-district`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Chittagong District <span className="text-red-500">*</span>
              </label>
              <select
                id={`${formId}-district`}
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${formId}-upazila`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Upazila / Thana <span className="text-red-500">*</span>
              </label>
              <select
                id={`${formId}-upazila`}
                name="upazila"
                value={formData.upazila}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                {(locations[formData.district] || []).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Mobile */}
          <div>
            <label htmlFor={`${formId}-phone`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Emergency Contact Mobile <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-medium text-gray-400">
                BD (+88)
              </span>
              <input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                required
                placeholder="01812345678"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 pl-19 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">
                Donors will call or WhatsApp this number directly.
              </p>
            )}
          </div>

          {/* Reason / Urgency Context */}
          <div>
            <label htmlFor={`${formId}-reason`} className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Urgency Reason / Ward <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id={`${formId}-reason`}
              name="reason"
              type="text"
              placeholder="e.g. Surgery at 3:00 PM, ICU Ward 12, Thalassemia emergency"
              value={formData.reason}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Emergency Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
