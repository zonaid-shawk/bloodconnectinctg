function FindDonor() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-semibold text-red-600">FIND A DONOR</p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Find Blood Donors
          </h1>

          <p className="mt-4 text-gray-600">
            Search for available donors by blood group and location.
          </p>
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Blood Group
              </label>

              <select className="w-full rounded-lg border border-gray-300 px-4 py-3">
                <option>Select blood group</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
                <option>O+</option>
                <option>O-</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                District
              </label>

              <input
                type="text"
                placeholder="Enter district"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div className="flex items-end">
              <button className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
                Search Donors
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default FindDonor;
