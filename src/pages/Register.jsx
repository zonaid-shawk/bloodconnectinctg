import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordHasVariety =
    /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const passwordStrength = password.length === 0
    ? 0
    : password.length >= 10 && passwordHasVariety
      ? 3
      : password.length >= 8
        ? 2
        : 1;
  const strengthLabels = ["", "Getting started", "Good", "Strong"];
  const strengthColors = [
    "bg-transparent",
    "bg-rose-400",
    "bg-amber-400",
    "bg-emerald-500",
  ];

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

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100";

  return (
    <main className="bg-[#f7f5f2] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_-36px_rgba(73,26,34,0.28)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative flex min-h-[300px] flex-col overflow-hidden bg-gradient-to-br from-[#a91436] via-[#c32143] to-[#7c1531] px-7 py-8 text-white sm:px-10 sm:py-10 lg:min-h-full lg:px-12 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-white/[0.04]"
          />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
                <path
                  d="M12 21s-7.5-4.35-7.5-11.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 16.65 12 21 12 21Z"
                  fill="currentColor"
                />
                <path
                  d="M12 9.2v6.1m-3-3.05h6"
                  stroke="#A91436"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight">BloodConnect</span>
          </div>

          <div className="relative z-10 mt-10 flex flex-1 flex-col sm:mt-12 lg:mt-16">
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-50">
              Give a little. Save a life.
            </span>
            <h1 className="mt-5 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Someone out there is waiting for a donor like you.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-rose-100 sm:text-base">
              Join a community that brings blood donors and people in need
              closer together. Your first step could mean everything to someone.
            </p>

            <div className="relative mx-auto my-6 flex h-40 w-full max-w-sm items-center justify-center sm:my-8 sm:h-48 lg:my-10 lg:h-56">
              <div
                aria-hidden="true"
                className="absolute h-36 w-36 rounded-full border border-white/10 sm:h-44 sm:w-44"
              />
              <div
                aria-hidden="true"
                className="absolute h-28 w-28 rounded-full border border-white/15 sm:h-36 sm:w-36"
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 shadow-[0_20px_50px_-20px_rgba(52,0,15,0.8)] backdrop-blur-sm sm:h-28 sm:w-28">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 76"
                  fill="none"
                  className="h-16 w-14 drop-shadow-lg sm:h-[4.5rem] sm:w-16"
                >
                  <path
                    d="M32 3C26 14 9 32 9 47a23 23 0 0 0 46 0C55 32 38 14 32 3Z"
                    fill="white"
                    fillOpacity=".95"
                  />
                  <path
                    d="M20.5 48.5c.7 5.3 4.5 8.8 9.7 9.5"
                    stroke="#D64A65"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M32 36v16m-8-8h16"
                    stroke="#A91436"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="absolute bottom-1 right-[14%] rounded-2xl border border-white/15 bg-[#7c1531]/75 px-3.5 py-2.5 shadow-lg backdrop-blur-sm sm:right-[16%]">
                <p className="text-[10px] font-medium uppercase tracking-wider text-rose-100">
                  Your impact
                </p>
                <p className="mt-0.5 text-sm font-bold">Starts right here</p>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-3 border-t border-white/15 pt-5">
              <div className="flex -space-x-2" aria-hidden="true">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#a91436] bg-rose-100 text-[10px] font-bold text-[#a91436]">A</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#b71d3e] bg-amber-100 text-[10px] font-bold text-amber-800">R</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#a91436] bg-orange-100 text-[10px] font-bold text-orange-800">S</span>
              </div>
              <p className="text-xs leading-5 text-rose-100 sm:text-sm">
                <span className="font-semibold text-white">Be part of it.</span>{" "}
                Every donor makes a difference.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
                Join the community
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
                Become a donor
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create your account and take the first step toward helping.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4.5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Samira Ahmed"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="whatsapp"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  WhatsApp number
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 8.5c.3 2.2 2.3 4.2 4.5 4.5l1-1 1.8.8-.2 1.7c-.1.5-.5.8-1 .8-4.2-.3-7.5-3.6-7.8-7.8 0-.5.3-.9.8-1l1.7-.2.8 1.8-1.6.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <input
                    id="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="01712345678"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    required
                    className={`${inputClassName} pl-11`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Bangladesh mobile number registered with WhatsApp.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Create a password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                    className={`${inputClassName} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-rose-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2.5" aria-live="polite">
                    <div className="flex gap-1.5" aria-hidden="true">
                      {[1, 2, 3].map((segment) => (
                        <span
                          key={segment}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength >= segment
                              ? strengthColors[passwordStrength]
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Use 6+ characters; a mix of letters and numbers is stronger.
                      </span>
                      <span className="ml-2 shrink-0 font-semibold text-slate-600">
                        {strengthLabels[passwordStrength]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs leading-5 text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(event) => setContactConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-rose-600"
                  required
                />
                <span>
                  I agree that my WhatsApp number may be shared with authorized
                  users seeking blood donors when my donor profile is approved
                  and I am marked available.
                </span>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b51b3d] to-[#d32b4e] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(181,27,61,0.65)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(181,27,61,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Creating your account..." : "Create my account"}
                {!loading && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  >
                    <path
                      d="M4 10h12m-5-5 5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <span>Already have an account?</span>
              <Link
                to="/login"
                className="font-bold text-rose-700 decoration-rose-300 underline-offset-4 transition hover:text-rose-900 hover:underline"
              >
                Log in
              </Link>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                className="h-3.5 w-3.5"
              >
                <path
                  d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2m-8 0h9v7h-9V7Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Your information is only shared as you have agreed.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Register;
