import { Link } from "react-router-dom";
import { districts } from "../data/chittagongLocations";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Register with your name, email, and WhatsApp number, then complete your donor profile.",
    icon: (
      <path
        d="M16 19h5v-1a4 4 0 0 0-5.2-3.8M16 19H8m8 0v-1c0-.7-.2-1.3-.5-1.9M8 19H3v-1a4 4 0 0 1 5.2-3.8M8 19v-1c0-.7.2-1.3.5-1.9m0 0a5 5 0 0 1 7 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    number: "02",
    title: "Set your availability",
    description:
      "Add your blood group and location, then mark yourself available whenever you are ready to be contacted.",
    icon: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    number: "03",
    title: "Search and connect",
    description:
      "Signed-in users can look for available donors by blood group and area, then reach out on WhatsApp.",
    icon: (
      <>
        <circle
          cx="10.8"
          cy="10.8"
          r="6.8"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m16 16 4 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

const faqs = [
  {
    question: "How can I appear in donor search results?",
    answer:
      "Create an account, sign in, complete your profile with your blood group and location, and set your availability to Available. Search results only include available donor profiles.",
  },
  {
    question: "Who can search for donors?",
    answer:
      "Donor search is for signed-in users. A donor's WhatsApp number is shared so an authorized user can make contact, in line with the consent given during registration.",
  },
  {
    question: "Does BloodConnect confirm a donor's medical eligibility?",
    answer:
      "No. BloodConnect helps people discover and contact donors; it does not assess medical eligibility, arrange transfusions, or replace professional medical advice. Confirm suitability and donation arrangements with qualified healthcare staff.",
  },
  {
    question: "What areas does the project cover?",
    answer:
      `The location filters currently cover ${districts.length} districts in the Chattogram division, with upazila and thana options where available.`,
  },
];

function About() {
  return (
    <main className="bg-[#f8f7f5] text-slate-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <section className="relative isolate overflow-hidden bg-[#8f1732] text-white dark:bg-gradient-to-br dark:from-[#600f22] dark:via-gray-950 dark:to-gray-950">
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-44 -z-10 h-[32rem] w-[32rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 -z-10 h-96 w-96 rounded-full border border-white/10"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
              About BloodConnect
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              When every moment matters,{" "}
              <span className="text-rose-200">connection matters.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-rose-100 sm:text-lg">
              BloodConnect is a student course project designed to make it
              easier to discover available blood donors by blood group and
              location, and reach out when help is needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/find-donor"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#8f1732] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-rose-50"
              >
                Find a donor
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M4 10h12m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-white/25 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Become a donor
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-5 rounded-[2rem] bg-rose-950/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">
                    A simple idea
                  </p>
                  <p className="mt-2 text-xl font-bold">People helping people</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-rose-100">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                  >
                    <path
                      d="M12 21s-7.5-4.35-7.5-11.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 16.65 12 21 12 21Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 12h2l1.2-2.5 1.5 5 1.1-2.5h1.2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-200">
                  From search to connection
                </span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              <div className="space-y-3">
                {[
                  ["A+", "Blood group"],
                  ["Chattogram", "Location"],
                  ["Available", "Donor status"],
                ].map(([value, label], index) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        index === 2
                          ? "bg-emerald-300/15 text-emerald-200"
                          : "bg-rose-200/10 text-rose-100"
                      }`}
                    >
                      {index === 2 ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{value}</span>
                      <span className="mt-0.5 block text-xs text-rose-200/80">
                        {label}
                      </span>
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4 text-rose-200/70"
                    >
                      <path
                        d="m7 4 6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-rose-100/80">
                A clearer way to find and contact a willing donor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
              Why we built it
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Make the first connection easier.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-600 dark:text-gray-300">
            <p>
              Finding a compatible blood group is only part of the challenge.
              People also need a practical way to discover willing donors nearby
              and contact them respectfully.
            </p>
            <p>
              BloodConnect brings donor registration, profile management,
              availability, and location-based search into one straightforward
              experience. The project focuses on the Chattogram division and
              its districts, with local area filters to help narrow a search.
            </p>
            <p className="rounded-r-xl border-l-2 border-rose-300 bg-white py-3 pl-5 pr-4 text-sm leading-7 text-slate-600 shadow-sm dark:border-rose-500 dark:bg-gray-900 dark:text-gray-300">
              Our goal is to support the connection—not to replace hospitals,
              blood banks, emergency services, or medical professionals.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-16 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/60 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Three steps to a meaningful connection
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-gray-400">
              Donors stay in control of their availability. People searching
              can narrow results by blood group and area.
            </p>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="group rounded-2xl border border-slate-200 bg-[#fcfbfa] p-6 transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:bg-white hover:shadow-[0_18px_45px_-28px_rgba(143,23,50,0.4)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-rose-500/50 dark:hover:bg-gray-800/80 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition group-hover:bg-rose-700 group-hover:text-white dark:bg-rose-950/60 dark:text-rose-400">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                    >
                      {step.icon}
                    </svg>
                  </span>
                  <span className="text-sm font-bold tracking-wider text-rose-300 dark:text-rose-400">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
            Thoughtful by design
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Connection with care.
          </h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-gray-400">
            A useful donor directory depends on trust, clear communication, and
            respecting each donor’s choice.
          </p>
          <Link
            to="/register"
            className="mt-7 inline-flex items-center gap-2 font-semibold text-rose-700 transition hover:gap-3 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
          >
            Join the donor community
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M12 3 5 6v5c0 4.6 2.9 8.6 7 10 4.1-1.4 7-5.4 7-10V6l-7-3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Donor choice comes first</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">
              Donors can update their profile and choose when to be listed as
              available.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Search with context</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">
              Blood group and area filters help people focus on relevant
              available donors.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9.2c.3 2.2 2 3.9 4.2 4.2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">Direct, respectful contact</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">
              Registration includes consent for WhatsApp contact when a donor
              profile is available.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M12 21s-7.5-4.35-7.5-11.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 16.65 12 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12h7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">A helpful first step</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">
              The platform supports discovery and communication; care decisions
              remain with donors and healthcare professionals.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-16 transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/60 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
              Good to know
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-gray-400">
              A few helpful details about using the donor directory.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-gray-800 dark:border-gray-800">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600 dark:text-white [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 text-xs font-bold tracking-wider text-rose-500 dark:text-rose-400">
                      0{index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-45 group-open:bg-rose-50 group-open:text-rose-700 dark:bg-gray-800 dark:text-gray-300 dark:group-open:bg-rose-950/60 dark:group-open:text-rose-400">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4"
                    >
                      <path
                        d="M10 4v12M4 10h12"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="ml-8 mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-[#971a37] to-[#bd2547] px-7 py-9 text-white shadow-[0_24px_70px_-35px_rgba(143,23,50,0.8)] sm:px-10 sm:py-11 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">
              Your next step
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Be the connection someone needs.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-rose-100">
              Search for an available donor or register to make it easier for
              someone nearby to find you.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/find-donor"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#971a37] transition hover:-translate-y-0.5 hover:bg-rose-50"
            >
              Find a donor
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
