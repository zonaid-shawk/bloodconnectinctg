function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-red-600">🩸 BloodConnect</h1>

          <nav className="flex gap-6 text-sm font-medium">
            <a href="#" className="text-gray-700 hover:text-red-600">
              Home
            </a>

            <a href="#" className="text-gray-700 hover:text-red-600">
              Find Donor
            </a>

            <a href="#" className="text-gray-700 hover:text-red-600">
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 font-semibold uppercase tracking-wider text-red-600">
            Blood Donor Registration System
          </p>

          <h2 className="text-5xl font-bold leading-tight text-gray-900">
            Give Blood.
            <br />
            <span className="text-red-600">Save Lives.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            BloodConnect helps people find available blood donors quickly based
            on blood group and location.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700">
              Find a Donor
            </button>

            <button className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100">
              Become a Donor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
