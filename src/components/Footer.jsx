import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-white transition-colors duration-200 dark:border-gray-800 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-bold text-red-500">🩸 BloodConnect</h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Connecting blood donors with people who need them. Give blood.
              Save lives.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white">Quick Links</h3>

            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>

              <Link to="/find-donor" className="hover:text-white transition-colors">
                Find Donor
              </Link>

              <Link to="/dashboard" className="hover:text-white transition-colors">
                Donor Analytics Dashboard
              </Link>

              <Link to="/about" className="hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white">Contact</h3>

            <p className="mt-3 text-sm text-gray-400">
              Email: support@bloodconnect.com
            </p>

            <p className="mt-2 text-sm text-gray-400">Chittagong, Bangladesh</p>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          © 2026 BloodConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
