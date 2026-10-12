import { useState } from "react";
import { supabase } from "../lib/supabase";
import { districts, locations } from "../data/chittagongLocations";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Convert a Bangladeshi mobile number to WhatsApp format.
function getWhatsAppNumber(phone) {
  if (!phone) return "";

  let number = String(phone).replace(/\D/g, "");

  // Example: 01712345678 -> 8801712345678
  if (number.startsWith("01") && number.length === 11) {
    number = "88" + number;
  }

  // Accept numbers already written with Bangladesh's country code.
  if (number.startsWith("880") && number.length === 13) {
    return number;
  }

  return "";
}

function FindDonor() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setDonors([]);
    setSearched(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in to search for donors.");
        return;
      }

      let query = supabase
        .from("available_donors")
        .select(
          "id, full_name, phone, blood_group, district, upazila, availability",
        );

      if (bloodGroup) {
        query = query.eq("blood_group", bloodGroup);
      }

      if (district) {
        query = query.eq("district", district);
      }

      if (upazila) {
        query = query.eq("upazila", upazila);
      }

      const { data, error: searchError } = await query.order("full_name");

      if (searchError) {
        setError(searchError.message);
        return;
      }

      setDonors(data || []);
    } catch (err) {
      console.error("Find donor error:", err);
      setError("Something went wrong while searching for donors.");
    } finally {
      setLoading(false);
    }
  }

  function handleDistrictChange(event) {
    setDistrict(event.target.value);
    setUpazila("");
  }

  function createWhatsAppLink(donor) {
    const phone = getWhatsAppNumber(donor.phone);

    if (!phone) return "";

    const message =
      `Assalamu Alaikum ${donor.full_name || "Donor"}, ` +
      "I found your donor profile on BloodConnect. " +
      "I would like to discuss a blood donation request. " +
      "Are you available to help?";

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Find a Blood Donor</h1>

        <p className="mt-3 text-gray-600">
          Search for available donors by blood group and location.
        </p>

        {/* Search filters */}
        <form
          onSubmit={handleSearch}
          className="mt-8 grid grid-cols-1 gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <div>
            <label
              htmlFor="bloodGroup"
              className="mb-2 block font-medium text-gray-700"
            >
              Blood Group
            </label>

            <select
              id="bloodGroup"
              value={bloodGroup}
              onChange={(event) => setBloodGroup(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            >
              <option value="">All blood groups</option>

              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="district"
              className="mb-2 block font-medium text-gray-700"
            >
              District
            </label>

            <select
              id="district"
              value={district}
              onChange={handleDistrictChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            >
              <option value="">All districts</option>

              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="upazila"
              className="mb-2 block font-medium text-gray-700"
            >
              Upazila / Thana
            </label>

            <select
              id="upazila"
              value={upazila}
              onChange={(event) => setUpazila(event.target.value)}
              disabled={!district}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 disabled:bg-gray-100"
            >
              <option value="">
                {district ? "All upazilas / thanas" : "Select a district first"}
              </option>

              {(locations[district] || []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 sm:col-span-2"
          >
            {loading ? "Searching..." : "Find Donors"}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {/* Search results */}
        {searched && !loading && !error && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Matching Donors ({donors.length})
            </h2>

            {donors.length === 0 ? (
              <p className="mt-4 rounded-lg border bg-white p-5 text-gray-600">
                No available donors match your search. Try different filters.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {donors.map((donor) => {
                  const whatsappLink = createWhatsAppLink(donor);

                  return (
                    <article
                      key={donor.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {donor.full_name || "Unnamed donor"}
                          </h3>

                          <p className="mt-2 text-sm text-gray-600">
                            {donor.upazila || "Location not specified"},{" "}
                            {donor.district || "District not specified"}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700">
                          {donor.blood_group || "Not specified"}
                        </span>
                      </div>

                      <p className="mt-4 font-medium text-green-700">
                        Available
                      </p>

                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.94 11.94 0 0 0 5.78 1.47h.01c6.57 0 11.91-5.35 11.91-11.92 0-3.18-1.24-6.17-3.48-8.42ZM12.09 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98.99-3.65-.24-.37a9.83 9.83 0 0 1-1.51-5.26c0-5.47 4.45-9.91 9.92-9.91a9.84 9.84 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.47-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.53.07-.81.38-.28.3-1.06 1.03-1.06 2.51 0 1.48 1.09 2.91 1.24 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.73 2.02-1.43.25-.71.25-1.31.17-1.43-.07-.13-.27-.2-.57-.35Z" />
                          </svg>
                          Contact on WhatsApp
                        </a>
                      ) : (
                        <p className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-center text-sm text-gray-600">
                          WhatsApp contact unavailable
                        </p>
                      )}

                      <p className="mt-3 text-xs text-gray-500">
                        Please contact donors respectfully and confirm
                        availability before making arrangements.
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default FindDonor;
