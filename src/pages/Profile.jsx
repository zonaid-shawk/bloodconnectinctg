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
  const [donationHistory, setDonationHistory] = useState([]);
  const [showLogDonation, setShowLogDonation] = useState(false);
  const [logHospital, setLogHospital] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logPatient, setLogPatient] = useState("");
  const [logUnits, setLogUnits] = useState(1);
  const [logNotes, setLogNotes] = useState("");
  const [logSaving, setLogSaving] = useState(false);

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

        let donorData = null;
        let profileError = null;

        // Try querying donors table first
        const donorsRes = await supabase
          .from("donors")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!donorsRes.error && donorsRes.data) {
          donorData = donorsRes.data;
        } else {
          // Fallback to profiles table
          const profRes = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          donorData = profRes.data;
          profileError = profRes.error;
        }

        if (profileError && !donorData) {
          setError(profileError.message);
          return;
        }

        setProfile(donorData);

        // Fetch user donation history
        if (donorData?.id) {
          try {
            const { data: hist } = await supabase
              .from("donation_history")
              .select("*")
              .eq("donor_id", donorData.id)
              .order("donation_date", { ascending: false });
            setDonationHistory(hist || []);
          } catch (histErr) {
            console.warn("Could not load history for profile:", histErr);
          }
        }

        const data = donorData || {};
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

      let updateRes = await supabase
        .from("donors")
        .update({
          availability: newAvailability,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("availability")
        .single();

      if (updateRes.error) {
        updateRes = await supabase
          .from("profiles")
          .update({
            availability: newAvailability,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select("availability")
          .single();
      }

      if (updateRes.error) {
        setError(updateRes.error.message);
        return;
      }

      const updatedAvailability = updateRes.data?.availability ?? newAvailability;

      setProfile((previous) => ({
        ...previous,
        availability: updatedAvailability,
      }));

      setMessage(
        updatedAvailability
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

      const payload = {
        full_name: form.full_name.trim(),
        phone: normalizedPhone,
        blood_group: form.blood_group || null,
        district: form.district,
        upazila: form.upazila,
        address: form.address.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let saveRes = await supabase
        .from("donors")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single();

      if (saveRes.error) {
        saveRes = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", user.id)
          .select()
          .single();
      }

      if (saveRes.error) {
        setError(saveRes.error.message);
        return;
      }

      setProfile((prev) => ({ ...prev, ...(saveRes.data || payload) }));
      setMessage("Profile updated successfully!");
    } catch {
      setError("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogDonation(e) {
    e.preventDefault();
    if (!logHospital.trim()) {
      setError("Please specify hospital or blood bank name.");
      return;
    }

    setLogSaving(true);
    setError("");
    setMessage("");

    try {
      const record = {
        donor_id: profile.id,
        donation_date: logDate,
        hospital: logHospital.trim(),
        patient_name: logPatient.trim() || null,
        units_donated: Number(logUnits) || 1,
        notes: logNotes.trim() || null,
        verified: true,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("donation_history")
        .insert(record)
        .select()
        .single();

      if (insErr) throw insErr;

      const updatedHistory = [inserted || record, ...donationHistory];
      setDonationHistory(updatedHistory);

      // Update donor total donations and last date
      const updatedTotal = updatedHistory.length;
      const updatedDate =
        !profile.last_donation_date || logDate > profile.last_donation_date
          ? logDate
          : profile.last_donation_date;

      await supabase
        .from("donors")
        .update({
          total_donations: updatedTotal,
          last_donation_date: updatedDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      setProfile((prev) => ({
        ...prev,
        total_donations: updatedTotal,
        last_donation_date: updatedDate,
      }));

      setMessage("Donation successfully logged in your profile!");
      setShowLogDonation(false);
      setLogHospital("");
      setLogPatient("");
      setLogNotes("");
    } catch (err) {
      console.error("Donation log error:", err);
      setError(err.message || "Failed to log donation.");
    } finally {
      setLogSaving(false);
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
    <main className="min-h-screen bg-gray-50 px-4 py-10 transition-colors duration-200 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Donor Profile</h1>

        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Manage your donor information and availability.
        </p>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-green-50 p-3 text-green-700 dark:border dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-red-700 dark:border dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {/* Donor Availability */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Donor Availability
              </h2>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {profile.availability
                  ? "You are visible to people searching for available donors."
                  : "You are not currently listed as an available donor."}
              </p>

              <p
                className={`mt-2 font-semibold ${
                  profile.availability ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
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
                  ? "bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
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
          className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-7"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</h2>

          <div>
            <label
              htmlFor="full_name"
              className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            />
            {form.phone && (() => {
              const status = validateBdPhone(form.phone, { required: false });
              if (status.isValid && status.operator) {
                return (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="font-semibold rounded-md bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ {status.operator}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono">{status.formatted}</span>
                  </p>
                );
              }
              if (form.phone.trim()) {
                return (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
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
              className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
            >
              Blood Group
            </label>

            <select
              id="blood_group"
              name="blood_group"
              value={form.blood_group}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
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
                className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
              >
                District
              </label>

              <select
                id="district"
                name="district"
                value={form.district}
                onChange={handleDistrictChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
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
                className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950 dark:disabled:bg-gray-800/40 dark:disabled:text-gray-600"
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
              className="mb-2 block font-medium text-gray-700 dark:text-gray-300"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
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

        {/* My Donation History Section */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  My Donation History
                </h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
                  {donationHistory.length} Recorded
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Track your life-saving whole blood and platelet donations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogDonation((prev) => !prev)}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95 transition"
            >
              <span>{showLogDonation ? "Cancel" : "+ Record a Donation"}</span>
            </button>
          </div>

          {/* Form to log a donation */}
          {showLogDonation && (
            <form
              onSubmit={handleLogDonation}
              className="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-4 dark:border-red-900/40 dark:bg-red-950/20 space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                Add New Donation Record
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Donation Date *
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Hospital / Blood Center *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CMCH, Parkview Hospital, Imperial Hospital"
                    value={logHospital}
                    onChange={(e) => setLogHospital(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Patient / Recipient (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency surgery patient"
                    value={logPatient}
                    onChange={(e) => setLogPatient(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Units / Bags
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={logUnits}
                    onChange={(e) => setLogUnits(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platelet apheresis, replacement donation"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogDonation(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSaving}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
                >
                  {logSaving ? "Saving..." : "Save to Supabase"}
                </button>
              </div>
            </form>
          )}

          {/* Donation Timeline */}
          <div className="mt-5">
            {donationHistory.length > 0 ? (
              <div className="relative border-l-2 border-red-200 pl-4 space-y-4 dark:border-red-900/60 ml-2">
                {donationHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-red-600 ring-4 ring-white dark:ring-gray-900" />
                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {item.hospital || "Blood Center"}
                          </p>
                          {item.patient_name && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300">
                              Patient: {item.patient_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
                            {item.donation_date}
                          </span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.units_donated || 1} Bag (450ml)
                          </p>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/50 pt-1.5 dark:border-gray-700/50">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-800/20">
                <span className="text-2xl">🩸</span>
                <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No recorded donations yet
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Click the &quot;Record a Donation&quot; button above to log your past blood donations.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
