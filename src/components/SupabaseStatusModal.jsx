import { useState, useEffect } from "react";
import {
  getSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SCHEMA_SQL,
  isUsingMock,
} from "../lib/supabase";

export default function SupabaseStatusModal({ isOpen, onClose }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState("status"); // 'status' or 'schema'

  const config = getSupabaseConfig();

  useEffect(() => {
    if (isOpen) {
      handleRunTest();
    }
  }, [isOpen]);

  async function handleRunTest() {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        ok: false,
        message: err.message || "Failed to test connection",
        tables: {},
      });
    } finally {
      setTesting(false);
    }
  }

  function handleCopySql() {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-900 my-8">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/90 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424a.396.396 0 0 0 .319.638H12v8.958a.396.396 0 0 0 .716.233l9.081-12.261a.396.396 0 0 0-.435-.638Z" />
                </svg>
              </span>
              <div>
                <h3
                  id="supabase-modal-title"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  Supabase Backend & Database Status
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dedicated donors & donation history tables with direct persistence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-2 border-t border-gray-200/70 pt-3 dark:border-gray-800/70">
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "status"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              Connection & Tables Diagnostic
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schema")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "schema"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <span>Copyable SQL Schema</span>
              <span className="rounded-md bg-white/20 px-1 text-[10px] font-mono">.sql</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {activeTab === "status" ? (
            <>
              {/* Overall Status Banner */}
              <div
                className={`rounded-2xl border p-4.5 ${
                  testResult?.ok
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-3 w-3 shrink-0 rounded-full ${
                        testResult?.ok ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          testResult?.ok
                            ? "text-emerald-900 dark:text-emerald-200"
                            : "text-amber-900 dark:text-amber-200"
                        }`}
                      >
                        {isUsingMock
                          ? "Active Engine: High-Fidelity Local Supabase Simulation"
                          : testResult?.ok
                          ? "Active Engine: Live Supabase Cloud Project"
                          : "Supabase Connection Needs Attention"}
                      </h4>
                      <p
                        className={`mt-1 text-xs ${
                          testResult?.ok
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {testResult?.message ||
                          (testing ? "Testing database tables..." : "Checking connection status...")}
                      </p>
                      {testResult?.latencyMs > 0 && (
                        <p className="mt-1 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                          Response Latency: {testResult.latencyMs}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunTest}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition"
                  >
                    {testing ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-red-600" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Re-test Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Environment Config Info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-850 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Environment Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-0.5">
                      VITE_SUPABASE_URL
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 break-all select-all">
                      {config.url}
                    </span>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-0.5">
                      VITE_SUPABASE_ANON_KEY
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 select-all">
                      {config.keyPreview}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Tables Verification */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Database Tables Health Check
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Donors Table */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-850">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                        public.donors
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          testResult?.tables?.donors?.ok ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Primary donor records, location & contacts.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {testResult?.tables?.donors?.status || "Checking..."}
                    </p>
                  </div>

                  {/* Donation History Table */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-850">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                        donation_history
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          testResult?.tables?.donation_history?.ok ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Past donation dates, hospitals & units.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {testResult?.tables?.donation_history?.status || "Checking..."}
                    </p>
                  </div>

                  {/* Emergency Requests Table */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-850">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                        emergency_requests
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          testResult?.tables?.emergency_requests?.ok ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Urgent blood appeals & hospital needs.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {testResult?.tables?.emergency_requests?.status || "Checking..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Setup Guidance */}
              <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/60 dark:text-blue-200 space-y-2">
                <h5 className="font-bold flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Quick Setup Instructions:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>Switch to the <strong>Copyable SQL Schema</strong> tab above.</li>
                  <li>Click <strong>Copy SQL Script</strong> to copy the ready-to-run schema.</li>
                  <li>In your Supabase project dashboard, navigate to <strong>SQL Editor</strong>, paste and click <strong>Run</strong>.</li>
                  <li>All tables, triggers, and Row Level Security policies will be immediately created!</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    PostgreSQL / Supabase Table Migration Script
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Includes tables, foreign keys, triggers, views, and anonymous RLS policies
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                >
                  {copiedSql ? (
                    <>
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display */}
              <div className="relative rounded-2xl bg-gray-900 p-4 font-mono text-xs text-gray-200 dark:bg-black/80 overflow-x-auto max-h-[50vh]">
                <pre>{SUPABASE_SCHEMA_SQL}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/90 sm:px-8 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time persistence across devices & sessions
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
