import { useState } from "react";
import { supabase } from "../lib/supabase";
import { districts, locations } from "../data/chittagongLocations";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function FindDonor() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [contactDonor, setContactDonor] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactNotice, setContactNotice] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setDonors([]);
    setSearched(true);
    setContactNotice("");

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
        .select("id, full_name, blood_group, district, upazila, availability");

      if (bloodGroup) query = query.eq("blood_group", bloodGroup);
      if (district) query = query.eq("district", district);
      if (upazila) query = query.eq("upazila", upazila);

      const { data, error: searchError } = await query.order("full_name");

      if (searchError) {
        setError(searchError.message);
        return;
      }

      setDonors(data || []);
    } catch {
      setError("Something went wrong while searching for donors.");
    } finally {
      setLoading(false);
    }
  }

  function handleDistrictChange(event) {
    setDistrict(event.target.value);
    setUpazila("");
  }

  async function handleContactSubmit(event) {
    event.preventDefault();

    if (!contactDonor || !message.trim()) {
      setContactNotice("Please write a message first.");
      return;
    }

    setSending(true);
    setContactNotice("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setContactNotice("Please log in again to contact a donor.");
        return;
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        "contact-donor",
        {
          body: {
            donorId: contactDonor.id,
            message: message.trim(),
            senderName: user.user_metadata?.full_name || "",
          },
        },
      );

      if (functionError) {
        let details = "";

        try {
          const response = functionError.context;
          if (response && typeof response.json === "function") {
            const body = await response.json();
            details = body?.error || "";
          }
        } catch {
          // Use the general error below.
        }

        setContactNotice(
          details ||
            "Could not send your message. Please check your connection and try again.",
        );
        return;
      }

      if (data?.error) {
        setContactNotice(data.error);
        return;
      }

      setContactNotice(
        "Your message was sent successfully. The donor can reply to your email.",
      );
      setMessage("");
      setContactDonor(null);
    } catch {
      setContactNotice("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">Find a Blood Donor</h1>

        <p className="mt-3 text-gray-600">
          Search for available donors by blood group and location.
        </p>

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

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {contactNotice && (
          <div
            role="status"
            className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-800"
          >
            {contactNotice}
          </div>
        )}

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
                {donors.map((donor) => (
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
                          {donor.upazila}, {donor.district}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700">
                        {donor.blood_group || "Not specified"}
                      </span>
                    </div>

                    <p className="mt-4 font-medium text-green-700">Available</p>

                    <button
                      type="button"
                      onClick={() => {
                        setContactDonor(donor);
                        setMessage("");
                        setContactNotice("");
                      }}
                      className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                    >
                      Contact Donor
                    </button>

                    {contactDonor?.id === donor.id && (
                      <form
                        onSubmit={handleContactSubmit}
                        className="mt-4 space-y-3"
                      >
                        <label
                          htmlFor="contactMessage"
                          className="block font-medium text-gray-700"
                        >
                          Your message
                        </label>
                        <textarea
                          id="contactMessage"
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          maxLength={2000}
                          rows={5}
                          required
                          placeholder="Explain your blood donation request and how the donor can help."
                          className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                        />
                        <p className="text-sm text-gray-500">
                          Your logged-in email will be used for replies. The
                          donor's email remains private.
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="flex-1 rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                          >
                            {sending ? "Sending..." : "Send Message"}
                          </button>
                          <button
                            type="button"
                            disabled={sending}
                            onClick={() => {
                              setContactDonor(null);
                              setMessage("");
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-3 text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default FindDonor;
