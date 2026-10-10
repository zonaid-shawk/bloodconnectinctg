function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-red-200">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="mb-4 font-semibold uppercase tracking-wider text-red-600">
              Chittagong based Blood Donor Registration Hub
            </p>

            <h1 className="text-5xl font-bold leading-tight text-gray-900">
              Give Blood.
              <br />
              <span className="text-red-600">Save Lives.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Humans are for Humans.{" "}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700">
                Find a Donor
              </button>

              <button className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100">
                Become a Donor
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="overflow-hidden rounded-full shadow-lg">
              <img
                src="/baby1.jpg"
                alt="Baby receiving blood support"
                className="h-96 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blood Groups */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-semibold text-red-600">BLOOD GROUPS</p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Find the Blood You Need
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Search for registered donors according to their blood group and
            location.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8">
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
              <div
                key={group}
                className="rounded-xl border bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-red-300"
              >
                <div className="text-2xl font-bold text-red-600">{group}</div>

                <div className="mt-1 text-xs text-gray-500">Blood Group</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-semibold text-red-600">HOW IT WORKS</p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Three Simple Steps
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
                1
              </div>

              <h3 className="mt-5 text-xl font-bold">Register</h3>

              <p className="mt-3 text-gray-600">
                Create your account and register as a blood donor.
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
                2
              </div>

              <h3 className="mt-5 text-xl font-bold">Find a Donor</h3>

              <p className="mt-3 text-gray-600">
                Search for available donors by blood group and location.
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
                3
              </div>

              <h3 className="mt-5 text-xl font-bold">Save a Life</h3>

              <p className="mt-3 text-gray-600">
                Connect with a suitable donor and help someone in need.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
