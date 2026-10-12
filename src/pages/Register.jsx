import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    // Accept a Bangladesh mobile number such as 01712345678
    // or an international-format number such as +8801712345678.
    const normalizedPhone = whatsapp.replace(/[\s()-]/g, "");

    const bangladeshMobile = /^01[3-9]\d{8}$/.test(normalizedPhone);
    const internationalMobile = /^\+8801[3-9]\d{8}$/.test(normalizedPhone);

    if (!bangladeshMobile && !internationalMobile) {
      setError(
        "Enter a valid Bangladesh mobile number, e.g. 01712345678 or +8801712345678.",
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!contactConsent) {
      setError(
        "Please confirm that you agree to share your WhatsApp number with approved users who need to contact you about blood donation.",
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: normalizedPhone,
            whatsapp_number: normalizedPhone,
            whatsapp_contact_consent: contactConsent,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setMessage(
          "Account created successfully! Your donor profile is pending approval.",
        );
      } else {
        setMessage(
          "Registration successful! Please check your email to confirm your account. Your donor profile will remain pending approval until reviewed.",
        );
      }

      setFullName("");
      setEmail("");
      setWhatsapp("");
      setPassword("");
      setContactConsent(false);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Become a Donor</h1>

          <p className="mt-2 text-gray-600">
            Create your BloodConnect account.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block font-medium text-gray-700"
            >
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="mb-2 block font-medium text-gray-700"
            >
              WhatsApp Number
            </label>

            <input
              id="whatsapp"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="01712345678"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />

            <p className="mt-1 text-xs text-gray-500">
              Enter a Bangladesh mobile number registered with WhatsApp.
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(event) => setContactConsent(event.target.checked)}
              className="mt-1"
              required
            />

            <span>
              I agree that my WhatsApp number may be shared with authorized
              users seeking blood donors when my donor profile is approved and I
              am marked available.
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-red-600 hover:text-red-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
