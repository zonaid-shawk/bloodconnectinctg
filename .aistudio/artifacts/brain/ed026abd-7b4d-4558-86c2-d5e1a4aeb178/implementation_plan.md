# Implementation Plan: Professional Supabase Backend & Donor History Architecture

Rewrite the Supabase integration professionally, cleanly, and reliably so that donor registrations, donation logs, and emergency requests are saved with exact database schemas to Supabase, paired with an individual donor profile history modal and an in-app Supabase connection & SQL migration tool.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions Based on Clarifications:**
> 1. **Dedicated Tables**: We will standardize on a dedicated `donors` table and a `donation_history` relational table (linked via `donor_id`), along with the `emergency_requests` table.
> 2. **Direct Database Persistence**: Donor registration will insert directly into the `donors` table first, ensuring donor records are immediately persisted in Supabase regardless of whether auth email confirmation is enabled or if the user registers without creating a password. If a password is provided, it will link with Supabase Auth.
> 3. **Resilient Supabase Client**: The Supabase client will seamlessly query real Supabase when credentials exist and automatically fall back to local persistence when credentials are empty or invalid, providing instant visual connection diagnostics.
> 4. **Supabase Schema & Status Modal**: An accessible modal in the navbar will display connection health (Real Supabase Connected vs Local Fallback Mode) and provide a one-click copyable SQL migration script that users can paste into Supabase SQL Editor.

---

## Proposed Changes

### 1. Supabase Client & Backend Architecture
#### `src/lib/supabase.js`
- Cleanly initialize Supabase using `@supabase/supabase-js`.
- Add helper methods and schema definitions for:
  - `donors` (all donor details, availability, last donation date, blood group, location)
  - `donation_history` (donor donation logs with dates, hospitals, bags, notes)
  - `emergency_requests` (patient needs, hospital, urgency, status)
- Update the mock/fallback layer so that it shares the exact same table structure (`donors`, `donation_history`, `emergency_requests`) with realistic sample donation history records.
- Export connection tester helper `checkSupabaseConnection()` that tests live connectivity to Supabase.
- Export raw copyable SQL schema script string for easy inclusion in the app modal.

---

### 2. Database Schema & Connection Status Modal
#### `src/components/SupabaseSetupModal.jsx` (New)
- Build an interactive, modern modal displaying:
  - **Connection Status**: Whether the app is connected to a live Supabase project or running in local development fallback mode.
  - **Environment Variables Helper**: Clear instructions on setting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - **One-Click SQL Schema**: Full production-ready PostgreSQL script creating:
    - `CREATE TABLE IF NOT EXISTS donors (...)`
    - `CREATE TABLE IF NOT EXISTS donation_history (...)`
    - `CREATE TABLE IF NOT EXISTS emergency_requests (...)`
    - `CREATE OR REPLACE VIEW available_donors AS ...` (for backwards compatibility)
    - Row-level security (RLS) policies allowing public read & authenticated/public insert for donor records.
    - Performance indexes on `blood_group`, `district`, `upazila`, `availability`.
  - **Test Connection Button**: Triggers a live check against the Supabase database.

#### `src/components/Navbar.jsx`
- Add a subtle status pill in the navbar (e.g., "Supabase: Live" or "Supabase: Local Mock") that opens the `SupabaseSetupModal`.

---

### 3. Professional Donor Registration Flow
#### `src/components/DonorRegistrationForm.jsx`
- Rewrite submission handler to directly insert the donor record into the `donors` table.
- If the donor filled in a `lastDonationDate`, automatically create their first record in the `donation_history` table linked to their new `donor_id`.
- If the user entered a password, also register/link with `supabase.auth.signUp`, handling both confirmed and pending email states gracefully without failing the database insertion.
- Standardize all field names to snake_case matching the Supabase schema (`full_name`, `phone`, `whatsapp_number`, `blood_group`, `district`, `upazila`, `address`, `date_of_birth`, `gender`, `last_donation_date`, `availability`).
- Display clear success messaging and modal feedback.

---

### 4. Individual Donor Profile & History Modal
#### `src/components/DonorProfileModal.jsx` (New)
- Create a comprehensive donor profile modal view that includes:
  - Full donor identity card (Name, Blood Group badge, District/Upazila, Contact options).
  - Current availability status with last donation date and eligibility calculator (days elapsed since last donation, next eligible donation date).
  - Complete donation history list (`donation_history` entries: date, hospital, patient name, bags donated, notes).
  - Quick actions: Direct call, WhatsApp message, copy phone.
  - Optional "Add Donation Record" capability so donors/admins can log a completed donation.

#### `src/components/SearchableDonorList.jsx`
- Update the donor cards in the directory to include a prominent **"View Profile & History"** button.
- Clicking opens the `DonorProfileModal` for that specific donor.
- Update data query to load from `donors` table (falling back safely if `available_donors` view exists or querying `donors` with `availability = true`).

---

### 5. Harmonize Dashboard, Profile & Emergency Requests
#### `src/components/DonorDashboard.jsx`
- Query from the standard `donors` table instead of legacy `profiles`.
- Keep real-time metric aggregates and blood group distribution charts aligned with current donors.

#### `src/pages/Profile.jsx`
- Support editing profile in the `donors` table (matching on auth user id or donor id).
- Show their personal donation history timeline with ability to add or view past donations.

---

## Verification Plan

### Automated Tests / Builds
- Run `compile_applet` to ensure zero compilation or JSX syntax errors.
- Run `lint_applet` to verify clean ESLint status across all touched files.

### Manual Verification
1. **Supabase Status & Schema Modal**:
   - Click the "Database Status" button in the Navbar.
   - Verify modal shows connection details and complete copyable SQL migration.
   - Click "Test Connection" to check response.
2. **Donor Registration to Supabase**:
   - Fill out the donor registration form at `/register`.
   - Submit with and without an optional account password.
   - Verify that the donor is saved immediately to the database and appears in Find Donors and Dashboard.
3. **Donor Profile & History Modal**:
   - Open Find Donors at `/find-donor`.
   - Click "View Profile & History" on any donor card.
   - Verify the modal shows donor details, calculated eligibility, last donation date, and past donation history timeline.
4. **Emergency Blood Requests**:
   - Post an emergency request via the emergency modal.
   - Confirm it saves cleanly to `emergency_requests` and appears pinned at the top.
