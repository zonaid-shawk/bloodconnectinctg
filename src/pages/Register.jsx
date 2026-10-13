import { Link } from "react-router-dom";
import DonorRegistrationForm from "../components/DonorRegistrationForm";

function Register() {
  return (
    <main className="bg-[#f7f5f2] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_-36px_rgba(73,26,34,0.28)] lg:grid-cols-[0.85fr_1.15fr]">
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
            <span className="text-lg font-bold tracking-tight">
              BloodConnect
            </span>
          </div>

          <div className="relative z-10 mt-10 flex flex-1 flex-col sm:mt-12 lg:mt-16">
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-50">
              Give a little. Save a life.
            </span>
            <h2 className="mt-5 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Someone out there is waiting for a donor like you.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-rose-100 sm:text-base">
              Join a community that brings blood donors and people in need
              closer together. Your first step could mean everything to someone in Chittagong.
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
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#a91436] bg-rose-100 text-[10px] font-bold text-[#a91436]">
                  A
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#b71d3e] bg-amber-100 text-[10px] font-bold text-amber-800">
                  R
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#a91436] bg-orange-100 text-[10px] font-bold text-orange-800">
                  S
                </span>
              </div>
              <p className="text-xs leading-5 text-rose-100 sm:text-sm">
                <span className="font-semibold text-white">Be part of it.</span>{" "}
                Every donor makes a difference in Chittagong.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
          <div className="w-full">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
                Join the community
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
                Become a donor
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Register as a blood donor in Chittagong and take the first step toward saving lives.
              </p>
            </div>

            <DonorRegistrationForm
              hideHeader={true}
              className="border-0 shadow-none p-0 md:p-0 rounded-none bg-transparent"
            />

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
