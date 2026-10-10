import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-red-600">
          🩸 BloodConnect
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link to="/" className="font-medium text-gray-700 hover:text-red-600">
            Home
          </Link>

          <Link
            to="/find-donor"
            className="font-medium text-gray-700 hover:text-red-600"
          >
            Find Donor
          </Link>

          <Link
            to="/about"
            className="font-medium text-gray-700 hover:text-red-600"
          >
            About
          </Link>

          <Link
            to="/login"
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
