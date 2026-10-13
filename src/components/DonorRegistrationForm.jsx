import { useState, useId } from "react";

import { districts, locations } from "../data/chittagongLocations";
import { supabase } from "../lib/supabase";
import {
  validateBdPhone,
  validateChittagongLocation,
} from "../lib/donorValidation";
import RegistrationSuccessModal from "./RegistrationSuccessModal";
import Toast from "./Toast";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

/**
 * Calculates eligibility based on last donation date (minimum 90 days)
 */
function getDonationEligibility(lastDateString) {
  if (!lastDateString) {
    return { isEligible: true, message: "Ready to donate anytime." };
  }
  const lastDate = new Date(lastDateString);
  if (Number.isNaN(lastDate.getTime())) {
    return { isEligible: true, message: "" };
  }
  const now = new Date();
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  if (diffDays < 90) {
    const nextEligible = new Date(lastDate);
    nextEligible.setDate(nextEligible.getDate() + 90);
    return {
      isEligible: false,
      daysRemaining: 90 - diffDays,
      nextDate: nextEligible.toISOString().split("T")[0],
      message: `Next eligible in ${90 - diffDays} days (${nextEligible.toLocaleDateString()})`,
    };
  }
  return {
    isEligible: true,
    message: "Eligible to donate! (More than 90 days since last donation)",
  };
}

export default function DonorRegistrationForm({
  onSubmit,
  onSuccess,
  showPassword = true,
  defaultDistrict = "Chattogram",
  hideHeader = false,
  className = "",
}) {
  const formId = useId();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: true,
    bloodGroup: "O+",
    district: defaultDistrict,
    upazila: locations[defaultDistrict]?.[0] || "",
    address: "",
    gender: "Male",
    dateOfBirth: "",
    lastDonationDate: "",
    password: "",
    isAvailable: true,
    consent: true,
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [registeredDonor, setRegisteredDonor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  function validateField(name, value, allData = formData) {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) error = "Full name is required.";
      else if (value.trim().length < 3) error = "Name must be at least 3 characters.";
    }
    if (name === "email") {
      if (!value.trim()) error = "Email address is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Please enter a valid email address.";
    }
    if (name === "phone") {
      const res = validateBdPhone(value, { required: true, fieldName: "Mobile number" });
      if (!res.isValid) error = res.error;
    }
    if (name === "whatsapp") {
      if (!allData.sameAsPhone && value.trim()) {
        const res = validateBdPhone(value, { required: true, fieldName: "WhatsApp number" });
        if (!res.isValid) error = res.error;
      }
    }
    if (name === "bloodGroup") {
      if (!value) error = "Please select a blood type.";
    }
    if (name === "district") {
      const locRes = validateChittagongLocation(value, allData.upazila);
      if (locRes.districtError) error = locRes.districtError;
    }
    if (name === "upazila") {
      const locRes = validateChittagongLocation(allData.district, value);
      if (locRes.upazilaError) error = locRes.upazilaError;
    }
    if (name === "password" && showPassword) {
      if (!value) error = "Password is required.";
      else if (value.length < 6) error = "Password must be at least 6 characters.";
    }
    if (name === "dateOfBirth" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        error = "Donors must be at least 18 years old.";
      }
    }
    return error;
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: fieldValue };
      if (name === "district") {
        updated.upazila = locations[value]?.[0] || "";
      }
      if (name === "sameAsPhone" && checked) {
        updated.whatsapp = updated.phone;
      }
      if (name === "phone" && prev.sameAsPhone) {
        updated.whatsapp = fieldValue;
      }
      return updated;
    });

    if (touched[name]) {
      const err = validateField(name, fieldValue);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }

  function validateAll() {
    const newErrors = {};
    const fieldsToValidate = [
      "fullName",
      "email",
      "phone",
      "bloodGroup",
      "district",
      "upazila",
      ...(showPassword ? ["password"] : []),
    ];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    if (!formData.sameAsPhone && formData.whatsapp) {
      const waErr = validateField("whatsapp", formData.whatsapp);
      if (waErr) newErrors.whatsapp = waErr;
    }

    if (formData.dateOfBirth) {
      const dobErr = validateField("dateOfBirth", formData.dateOfBirth);
      if (dobErr) newErrors.dateOfBirth = dobErr;
    }

    if (!formData.consent) {
      newErrors.consent = "You must agree to be contacted for blood donation.";
    }

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce((acc, curr) => ({ ...acc, [curr]: true }), {
        consent: true,
      })
    );

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!validateAll()) {
      setSubmitError("Please correct the highlighted fields before submitting.");
      return;
    }

    setLoading(true);

    try {
      const phoneRes = validateBdPhone(formData.phone, { required: true, fieldName: "Mobile number" });
      if (!phoneRes.isValid) {
        setSubmitError(phoneRes.error);
        setLoading(false);
        return;
      }

      const waRes = formData.sameAsPhone
        ? phoneRes
        : validateBdPhone(formData.whatsapp, { required: false, fieldName: "WhatsApp number" });

      const locRes = validateChittagongLocation(formData.district, formData.upazila);
      if (!locRes.isValid) {
        setSubmitError(locRes.districtError || locRes.upazilaError);
        setLoading(false);
        return;
      }

      const donorPayload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: phoneRes.normalized,
        whatsapp_number: formData.sameAsPhone
          ? phoneRes.normalized
          : (waRes.normalized || phoneRes.normalized),
        blood_group: formData.bloodGroup,
        district: formData.district,
        upazila: formData.upazila,
        address: formData.address.trim() || null,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth || null,
        last_donation_date: formData.lastDonationDate || null,
        availability: formData.isAvailable,
        whatsapp_contact_consent: formData.consent,
      };

      if (onSubmit) {
        await onSubmit(donorPayload);
      } else {
        // Register using Supabase client
        const passwordToUse = showPassword ? formData.password : "DonorPass123!";
        const { error: signUpError } = await supabase.auth.signUp({
          email: donorPayload.email,
          password: passwordToUse,
          options: {
            data: donorPayload,
          },
        });

        if (signUpError) {
          throw signUpError;
        }
      }

      setRegisteredDonor(donorPayload);
      setSubmitSuccess(true);
      setIsModalOpen(true);
      setToastMessage(`Registration successful! Welcome ${donorPayload.full_name} to BloodConnect Chittagong.`);
      if (onSuccess) {
        onSuccess(donorPayload);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setSubmitError(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleResetForm() {
    setSubmitSuccess(false);
    setIsModalOpen(false);
    setRegisteredDonor(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      whatsapp: "",
      sameAsPhone: true,
      bloodGroup: "O+",
      district: defaultDistrict,
      upazila: locations[defaultDistrict]?.[0] || "",
      address: "",
      gender: "Male",
      dateOfBirth: "",
      lastDonationDate: "",
      password: "",
      isAvailable: true,
      consent: true,
    });
    setTouched({});
    setErrors({});
    setSubmitError("");
  }

  const eligibility = getDonationEligibility(formData.lastDonationDate);

  if (submitSuccess && registeredDonor) {
    return (
      <>
        <RegistrationSuccessModal
          isOpen={isModalOpen}
          donor={registeredDonor}
          onClose={() => setIsModalOpen(false)}
          onRegisterAnother={handleResetForm}
        />

        <Toast
          message={toastMessage}
          type="success"
          duration={5000}
          onClose={() => setToastMessage("")}
        />

        <div className={`rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8 ${className}`}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Chittagong Donor
            </span>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-md">
              Thank you, <span className="font-semibold text-gray-800">{registeredDonor.full_name}</span>.
              Your donor profile is active and discoverable by patients across Chittagong.
            </p>

            <div className="mt-6 w-full max-w-md rounded-2xl border border-gray-100 bg-gray-50/80 p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3.5 dark:border-gray-800">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Blood Type</p>
                  <p className="text-2xl font-extrabold text-red-600 dark:text-red-500">{registeredDonor.blood_group}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {registeredDonor.availability ? "Available to Donate" : "Inactive"}
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-800 truncate dark:text-gray-200">{registeredDonor.upazila}, {registeredDonor.district}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                  <p className="font-medium font-mono text-gray-800 truncate dark:text-gray-200">{registeredDonor.phone}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
              >
                View Full Confirmation
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                Register Another Donor
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <RegistrationSuccessModal
        isOpen={isModalOpen}
        donor={registeredDonor}
        onClose={() => setIsModalOpen(false)}
        onRegisterAnother={handleResetForm}
      />

      <Toast
        message={toastMessage}
        type="success"
        duration={5000}
        onClose={() => setToastMessage("")}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 md:p-8 ${className}`}
      >
      {!hideHeader && (
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              🩸
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Blood Donor Registration</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Join the Chittagong donor network and help save lives in emergencies
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* SECTION 1: Personal & Blood Group */}
      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${formId}-fullName`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-fullName`}
            name="fullName"
            type="text"
            required
            placeholder="e.g. Tanvir Hasan"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
              errors.fullName && touched.fullName
                ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            }`}
          />
          {errors.fullName && touched.fullName && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>
          )}
        </div>

        {/* Blood Group Chips */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Blood Type <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select your ABO and Rh blood group</p>
          <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {BLOOD_GROUPS.map((group) => {
              const isSelected = formData.bloodGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, bloodGroup: group }));
                    setErrors((prev) => ({ ...prev, bloodGroup: "" }));
                  }}
                  className={`flex h-12 flex-col items-center justify-center rounded-xl border font-bold transition ${
                    isSelected
                      ? "border-red-600 bg-red-600 text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-red-500 dark:hover:bg-red-950/40"
                  }`}
                >
                  <span className="text-base">{group}</span>
                </button>
              );
            })}
          </div>
          {errors.bloodGroup && touched.bloodGroup && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.bloodGroup}</p>
          )}
        </div>

        {/* Gender & DOB */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-gender`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Gender
            </label>
            <select
              id={`${formId}-gender`}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${formId}-dateOfBirth`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Date of Birth <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(18+ required)</span>
            </label>
            <input
              id={`${formId}-dateOfBirth`}
              name="dateOfBirth"
              type="date"
              max={todayStr}
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                errors.dateOfBirth && touched.dateOfBirth
                  ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                  : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }`}
            />
            {errors.dateOfBirth && touched.dateOfBirth && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Location in Chittagong */}
      <div className="mt-7 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
          Chittagong Location
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Specify your location within the Chittagong division for nearby matching
        </p>

        <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-district`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              District / Area <span className="text-red-500">*</span>
            </label>
            <select
              id={`${formId}-district`}
              name="district"
              required
              value={formData.district}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                errors.district && touched.district
                  ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                  : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }`}
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && touched.district && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.district}</p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-upazila`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Upazila / Thana <span className="text-red-500">*</span>
            </label>
            <select
              id={`${formId}-upazila`}
              name="upazila"
              required
              value={formData.upazila}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                errors.upazila && touched.upazila
                  ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                  : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }`}
            >
              {(locations[formData.district] || []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {errors.upazila && touched.upazila && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.upazila}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor={`${formId}-address`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Address / Landmark <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
          </label>
          <input
            id={`${formId}-address`}
            name="address"
            type="text"
            placeholder="e.g. Near GEC Circle, O.R. Nizam Road, or Chittagong Medical College"
            value={formData.address}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
          />
        </div>
      </div>

      {/* SECTION 3: Contact Information */}
      <div className="mt-7 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
          Contact Information
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recipients and hospital volunteers will reach out via these details
        </p>

        <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-phone`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                BD (+88)
              </span>
              <input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                required
                placeholder="01712345678"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border pl-19 pr-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                  errors.phone && touched.phone
                    ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                    : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                }`}
              />
            </div>
            {errors.phone && touched.phone ? (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.phone}</span>
              </p>
            ) : (
              (() => {
                const phoneStatus = validateBdPhone(formData.phone, { required: false });
                if (phoneStatus.isValid && phoneStatus.operator) {
                  return (
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {phoneStatus.operator}
                      </span>
                      <span className="text-gray-500 font-mono dark:text-gray-400">
                        Standard: {phoneStatus.formatted}
                      </span>
                    </div>
                  );
                }
                return (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Standard 11 digits starting with 013-019 (e.g. 01712-345678)
                  </p>
                );
              })()
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-email`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                errors.email && touched.email
                  ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                  : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }`}
            />
            {errors.email && touched.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
        </div>

        {/* WhatsApp Checkbox & Field */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="sameAsPhone"
              checked={formData.sameAsPhone}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>WhatsApp number is the same as mobile number</span>
          </label>

          {!formData.sameAsPhone && (
            <div className="mt-3">
              <label htmlFor={`${formId}-whatsapp`} className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Dedicated WhatsApp Number
              </label>
              <input
                id={`${formId}-whatsapp`}
                name="whatsapp"
                type="tel"
                placeholder="01812345678"
                value={formData.whatsapp}
                onChange={handleChange}
                onBlur={handleBlur}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.whatsapp && touched.whatsapp ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.whatsapp}</span>
                </p>
              ) : (
                (() => {
                  const waStatus = validateBdPhone(formData.whatsapp, { required: false });
                  if (waStatus.isValid && waStatus.operator) {
                    return (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                        ✓ {waStatus.operator} ({waStatus.formatted})
                      </p>
                    );
                  }
                  return (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      e.g. 01812345678 (11 digits with Bangladesh operator code)
                    </p>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Last Donation & Availability */}
      <div className="mt-7 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
          Donation Status
        </h3>

        <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-lastDonationDate`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Last Donation Date <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
            </label>
            <input
              id={`${formId}-lastDonationDate`}
              name="lastDonationDate"
              type="date"
              max={todayStr}
              value={formData.lastDonationDate}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            />
            {formData.lastDonationDate && (
              <p
                className={`mt-1.5 text-xs font-medium ${
                  eligibility.isEligible ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {eligibility.message}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Immediate Availability
            </span>
            <label className="mt-2 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mark me as <strong className="text-green-700 dark:text-green-400">Available</strong> in the Chittagong donor directory
              </span>
            </label>
          </div>
        </div>

        {/* Password if enabled */}
        {showPassword && (
          <div className="mt-4">
            <label htmlFor={`${formId}-password`} className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Create Password <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-password`}
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters to manage your profile"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 ${
                errors.password && touched.password
                  ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                  : "border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }`}
            />
            {errors.password && touched.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 shrink-0 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>
              I agree that my contact information may be shared with emergency patients,
              volunteers, and hospitals in Chittagong requiring blood donation.
            </span>
          </label>
          {errors.consent && touched.consent && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.consent}</p>
          )}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            setFormData({
              fullName: "",
              email: "",
              phone: "",
              whatsapp: "",
              sameAsPhone: true,
              bloodGroup: "O+",
              district: defaultDistrict,
              upazila: locations[defaultDistrict]?.[0] || "",
              address: "",
              gender: "Male",
              dateOfBirth: "",
              lastDonationDate: "",
              password: "",
              isAvailable: true,
              consent: true,
            });
            setTouched({});
            setErrors({});
            setSubmitError("");
          }}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <span>Register as Donor</span>
          )}
        </button>
      </div>
    </form>
  </>
);
}

