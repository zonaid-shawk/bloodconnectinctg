import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { districts, locations } from "../data/chittagongLocations";
import { validateBdPhone, validateChittagongLocation } from "../lib/donorValidation";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Profile() {
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    blood_group: "",
    district: "",
    upazila: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to view your profile.");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setError(profileError.message);
          return;
        }

        setProfile(data);

        const savedDistrict = districts.includes(data.district)
          ? data.district
          : "";

        const availableUpazilas = locations[savedDistrict] || [];

        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          blood_group: data.blood_group || "",
          district: savedDistrict,
          upazila: availableUpazilas.includes(data.upazila) ? data.upazila : "",
          address: data.address || "",
        });
      } catch {
        setError("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  function handleDistrictChange(event) {
    const district = event.target.value;

    setForm((previous) => ({
      ...previous,
      district,
      upazila: "",
    }));

    setMessage("");
    setError("");
  }

  async function handleAvailabilityChange() {
    if (!profile || availabilitySaving) return;

    setAvailabilitySaving(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in again.");
        return;
      }

      const newAvailability = !profile.availability;

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          availability: newAvailability,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("availability")
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setProfile((previous) => ({
        ...previous,
        availability: data.availability,
      }));

      setMessage(
        data.availability
          ? "You are now available as a donor!"
          : "You are now unavailable as a donor.",
      );
    } catch {
      setError("Something went wrong while updating availability.");
    } finally {
      setAvailabilitySaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      let normalizedPhone = null;
      if (form.phone && form.phone.trim()) {
        const phoneCheck = validateBdPhone(form.phone, { required: true, fieldName: "Phone number" });
        if (!phoneCheck.isValid) {
          setError(phoneCheck.error);
          return;
        }
        normalizedPhone = phoneCheck.normalized;
      }

      const locCheck = validateChittagongLocation(form.district, form.upazila);
      if (!locCheck.isValid) {
        setError(locCheck.districtError || locCheck.upazilaError);
        return;
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: normalizedPhone,
          blood_group: form.blood_group || null,
          district: form.district,
          upazila: form.upazila,
          address: form.address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setProfile(data);
      setMessage("Profile updated successfully!");
    } catch {
      setError("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-gray-600">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className="p-8 text-center text-red-600">
        {error || "Unable to load your profile. Please log in again."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">My Donor Profile</h1>

        <p className="mt-3 text-gray-600">
          Manage your donor information and availability.
        </p>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-green-50 p-3 text-green-700"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}

        {/* Donor Availability */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Donor Availability
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {profile.availability
                  ? "You are visible to people searching for available donors."
                  : "You are not currently listed as an available donor."}
              </p>

              <p
                className={`mt-2 font-semibold ${
                  profile.availability ? "text-green-700" : "text-gray-500"
                }`}
              >
                Status: {profile.availability ? "Available" : "Unavailable"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAvailabilityChange}
              disabled={availabilitySaving}
              className={`rounded-lg px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                profile.availability
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {availabilitySaving
                ? "Updating..."
                : profile.availability
                  ? "Mark Unavailable"
                  : "Mark Available"}
            </button>
          </div>
        </section>

        {/* Edit Donor Profile */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>

          <div>
            <label
              htmlFor="full_name"
              className="mb-2 block font-medium text-gray-700"
            >
              Full Name
            </label>

            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block font-medium text-gray-700"
            >
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
              placeholder="Enter your phone number"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            {form.phone && (() => {
              const status = validateBdPhone(form.phone, { required: false });
              if (status.isValid && status.operator) {
                return (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
                    <span className="font-semibold rounded-md bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-600/20">
                      ✓ {status.operator}
                    </span>
                    <span className="text-gray-500 font-mono">{status.formatted}</span>
                  </p>
                );
              }
              if (form.phone.trim()) {
                return (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Standard 11 digits starting with 013-019 (e.g. 01712-345678)
                  </p>
                );
              }
              return null;
            })()}
          </div>

          <div>
            <label
              htmlFor="blood_group"
              className="mb-2 block font-medium text-gray-700"
            >
              Blood Group
            </label>

            <select
              id="blood_group"
              name="blood_group"
              value={form.blood_group}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Select blood group</option>

              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="district"
                className="mb-2 block font-medium text-gray-700"
              >
                District
              </label>

              <select
                id="district"
                name="district"
                value={form.district}
                onChange={handleDistrictChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Select district</option>

                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="upazila"
                className="mb-2 block font-medium text-gray-700"
              >
                Upazila / Thana
              </label>

              <select
                id="upazila"
                name="upazila"
                value={form.upazila}
                onChange={handleChange}
                required
                disabled={!form.district}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {form.district
                    ? "Select upazila / thana"
                    : "Select district first"}
                </option>

                {(locations[form.district] || []).map((upazila) => (
                  <option key={upazila} value={upazila}>
                    {upazila}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block font-medium text-gray-700"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              maxLength={500}
              rows={3}
              placeholder="Enter your address (optional)"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Profile;
