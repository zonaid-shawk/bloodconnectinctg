import { createClient } from "@supabase/supabase-js";

// Clean and normalize Supabase configuration
const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  "https://qucvfyhalpgnukcfzbrr.supabase.co"
)?.trim();

const rawKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_TfjMfffIsTnxAev0fh57Fg_jgPuowak"
)?.trim();

const isConfigured = Boolean(
  rawUrl &&
    rawKey &&
    rawUrl.startsWith("http") &&
    !rawUrl.includes("placeholder") &&
    !rawUrl.includes("your-project")
);

export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- BloodConnect Chittagong - Complete PostgreSQL & Supabase Database Schema
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create 'donors' table
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  whatsapp_number text,
  whatsapp_contact_consent boolean default true,
  blood_group text not null,
  gender text default 'Male',
  date_of_birth date,
  district text not null default 'Chattogram',
  upazila text not null,
  address text,
  availability boolean default true,
  last_donation_date date,
  total_donations integer default 0,
  notes text,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create 'donation_history' table (dedicated donor donation logs)
create table if not exists public.donation_history (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.donors(id) on delete cascade not null,
  donation_date date not null default current_date,
  hospital text not null,
  patient_name text,
  units_donated integer default 1,
  notes text,
  verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create 'emergency_requests' table (urgent blood requests across Chittagong)
create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  blood_group text not null,
  bags_needed integer default 1,
  hospital text not null,
  district text default 'Chattogram',
  upazila text,
  phone text not null,
  urgent boolean default true,
  reason text,
  notes text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Backwards-compatibility views
create or replace view public.profiles as
  select * from public.donors;

create or replace view public.available_donors as
  select * from public.donors where availability = true;

-- 6. Indexes for ultra-fast queries
create index if not exists idx_donors_blood_group on public.donors(blood_group);
create index if not exists idx_donors_district_upazila on public.donors(district, upazila);
create index if not exists idx_donors_availability on public.donors(availability);
create index if not exists idx_donors_phone on public.donors(phone);
create index if not exists idx_donation_history_donor on public.donation_history(donor_id);
create index if not exists idx_emergency_requests_status on public.emergency_requests(status);

-- 7. Trigger to keep last_donation_date and total_donations automatically updated
create or replace function public.handle_new_donation()
returns trigger as $$
begin
  update public.donors
  set 
    last_donation_date = greatest(coalesce(last_donation_date, NEW.donation_date), NEW.donation_date),
    total_donations = (select count(*) from public.donation_history where donor_id = NEW.donor_id),
    updated_at = timezone('utc'::text, now())
  where id = NEW.donor_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_donation_logged on public.donation_history;
create trigger on_donation_logged
  after insert on public.donation_history
  for each row execute function public.handle_new_donation();

-- 8. Row Level Security (RLS) Configuration
alter table public.donors enable row level security;
alter table public.donation_history enable row level security;
alter table public.emergency_requests enable row level security;

-- Policies for donors (read, insert, update, delete open to all)
drop policy if exists "Allow public read of donors" on public.donors;
create policy "Allow public read of donors" on public.donors
  for select using (true);

drop policy if exists "Allow public insert of donors" on public.donors;
create policy "Allow public insert of donors" on public.donors
  for insert with check (true);

drop policy if exists "Allow update donors" on public.donors;
create policy "Allow update donors" on public.donors
  for update using (true);

drop policy if exists "Allow delete donors" on public.donors;
create policy "Allow delete donors" on public.donors
  for delete using (true);

-- Policies for donation_history
drop policy if exists "Allow public read of donation_history" on public.donation_history;
create policy "Allow public read of donation_history" on public.donation_history
  for select using (true);

drop policy if exists "Allow public insert of donation_history" on public.donation_history;
create policy "Allow public insert of donation_history" on public.donation_history
  for insert with check (true);

drop policy if exists "Allow update of donation_history" on public.donation_history;
create policy "Allow update of donation_history" on public.donation_history
  for update using (true);

drop policy if exists "Allow delete of donation_history" on public.donation_history;
create policy "Allow delete of donation_history" on public.donation_history
  for delete using (true);

-- Policies for emergency_requests
drop policy if exists "Allow public read of emergency_requests" on public.emergency_requests;
create policy "Allow public read of emergency_requests" on public.emergency_requests
  for select using (true);

drop policy if exists "Allow public insert of emergency_requests" on public.emergency_requests;
create policy "Allow public insert of emergency_requests" on public.emergency_requests
  for insert with check (true);

drop policy if exists "Allow update of emergency_requests" on public.emergency_requests;
create policy "Allow update of emergency_requests" on public.emergency_requests
  for update using (true);

drop policy if exists "Allow delete of emergency_requests" on public.emergency_requests;
create policy "Allow delete of emergency_requests" on public.emergency_requests
  for delete using (true);

-- 9. Optional: Seed initial verified Chittagong donors (safe to run multiple times)
insert into public.donors (id, full_name, phone, whatsapp_number, blood_group, gender, district, upazila, address, availability, last_donation_date, total_donations, notes)
values
  ('a1111111-1111-1111-1111-111111111111', 'Tanvir Hasan', '01711223344', '01711223344', 'A+', 'Male', 'Chattogram', 'Kotwali', 'Anderkilla, Kotwali, Chattogram', true, '2024-05-18', 4, 'Regular blood donor since 2020. Available for emergency hospital calls.'),
  ('a2222222-2222-2222-2222-222222222222', 'Nusrat Jahan', '01819876543', '01819876543', 'O+', 'Female', 'Chattogram', 'Panchlaish', 'Nasirabad Housing Society, Panchlaish', true, '2024-03-10', 3, 'CMCH volunteer. Prefer WhatsApp messaging before calls during work hours.'),
  ('a3333333-3333-3333-3333-333333333333', 'Rafiqul Islam', '01912345678', '01912345678', 'B+', 'Male', 'Chattogram', 'Halishahar', 'Block H, Halishahar Housing Estate', true, '2024-06-02', 6, 'Platelet and whole blood donor. Always ready for pediatric emergencies.'),
  ('a4444444-4444-4444-4444-444444444444', 'Ayesha Siddiqua', '01611223344', '01611223344', 'AB+', 'Female', 'Cox''s Bazar', 'Cox''s Bazar Sadar', 'Laldighir Par, Cox''s Bazar', true, '2024-01-20', 2, 'University student and community youth wing volunteer.'),
  ('a5555555-5555-5555-5555-555555555555', 'Mahmudur Rahman', '01755667788', '01755667788', 'O-', 'Male', 'Cumilla', 'Cumilla Adarsha Sadar', 'Kandirpar, Cumilla', true, '2024-04-05', 5, 'Universal negative donor. Registered on Red Crescent rapid responder roster.')
on conflict (id) do nothing;

-- 10. Optional: Seed initial active emergency requests
insert into public.emergency_requests (id, patient_name, blood_group, bags_needed, hospital, district, upazila, phone, urgent, reason, status)
values
  ('b1111111-1111-1111-1111-111111111111', 'Fatima Begum', 'O+', 2, 'Chittagong Medical College Hospital (CMCH)', 'Chattogram', 'Panchlaish', '01819876543', true, 'Emergency cardiac surgery, Ward 26', 'active'),
  ('b2222222-2222-2222-2222-222222222222', 'Abdul Karim', 'A-', 1, 'Parkview Hospital, Chittagong', 'Chattogram', 'Panchlaish', '01711223344', true, 'Severe anemia / Thalassemia crisis', 'active')
on conflict (id) do nothing;
`;

// Initial rich mock donor dataset (realistic Chittagong donors)
const initialDonors = [
  {
    id: "donor-1",
    full_name: "Tanvir Hasan",
    phone: "01711223344",
    whatsapp_number: "01711223344",
    whatsapp_contact_consent: true,
    email: "tanvir.cmch@example.com",
    blood_group: "A+",
    gender: "Male",
    date_of_birth: "1996-04-12",
    district: "Chattogram",
    upazila: "Kotwali",
    address: "Anderkilla, Kotwali, Chattogram",
    availability: true,
    last_donation_date: "2024-05-18",
    total_donations: 4,
    notes: "Regular blood donor since 2020. Available for emergency hospital calls.",
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "donor-2",
    full_name: "Nusrat Jahan",
    phone: "01819876543",
    whatsapp_number: "01819876543",
    whatsapp_contact_consent: true,
    email: "nusrat.j@example.com",
    blood_group: "O+",
    gender: "Female",
    date_of_birth: "1998-09-24",
    district: "Chattogram",
    upazila: "Panchlaish",
    address: "Nasirabad Housing Society, Panchlaish",
    availability: true,
    last_donation_date: "2024-03-10",
    total_donations: 3,
    notes: "CMCH volunteer. Prefer WhatsApp messaging before calls during work hours.",
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "donor-3",
    full_name: "Rafiqul Islam",
    phone: "01912345678",
    whatsapp_number: "01912345678",
    whatsapp_contact_consent: true,
    email: "rafiq.islam@example.com",
    blood_group: "B+",
    gender: "Male",
    date_of_birth: "1994-01-15",
    district: "Chattogram",
    upazila: "Halishahar",
    address: "Block H, Halishahar Housing Estate",
    availability: true,
    last_donation_date: "2024-06-02",
    total_donations: 6,
    notes: "Platelet and whole blood donor. Always ready for pediatric emergencies.",
    created_at: new Date(Date.now() - 250 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "donor-4",
    full_name: "Ayesha Siddiqua",
    phone: "01611223344",
    whatsapp_number: "01611223344",
    whatsapp_contact_consent: true,
    email: "ayesha.sid@example.com",
    blood_group: "AB+",
    gender: "Female",
    date_of_birth: "2000-08-30",
    district: "Cox's Bazar",
    upazila: "Cox's Bazar Sadar",
    address: "Laldighir Par, Cox's Bazar",
    availability: true,
    last_donation_date: "2024-01-20",
    total_donations: 2,
    notes: "University student and community youth wing volunteer.",
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: "donor-5",
    full_name: "Mahmudur Rahman",
    phone: "01755667788",
    whatsapp_number: "01755667788",
    whatsapp_contact_consent: true,
    email: "mahmud.r@example.com",
    blood_group: "O-",
    gender: "Male",
    date_of_birth: "1991-11-05",
    district: "Cumilla",
    upazila: "Cumilla Adarsha Sadar",
    address: "Kandirpar, Cumilla",
    availability: true,
    last_donation_date: "2024-04-05",
    total_donations: 5,
    notes: "Universal negative donor. Registered on Red Crescent rapid responder roster.",
    created_at: new Date(Date.now() - 300 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "donor-6",
    full_name: "Farhana Akter",
    phone: "01844332211",
    whatsapp_number: "01844332211",
    whatsapp_contact_consent: true,
    email: "farhana.akter@example.com",
    blood_group: "A-",
    gender: "Female",
    date_of_birth: "1997-03-19",
    district: "Chattogram",
    upazila: "Hathazari",
    address: "College Road, Hathazari",
    availability: true,
    last_donation_date: "2023-11-28",
    total_donations: 3,
    notes: "Available for urgent calls at Parkview and CMCH.",
    created_at: new Date(Date.now() - 210 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: "donor-7",
    full_name: "Shahadat Hossain",
    phone: "01722889900",
    whatsapp_number: "01722889900",
    whatsapp_contact_consent: true,
    email: "shahadat.ctg@example.com",
    blood_group: "B-",
    gender: "Male",
    date_of_birth: "1993-07-08",
    district: "Chattogram Metropolitan Area",
    upazila: "Double Mooring",
    address: "Agrabad Commercial Area",
    availability: true,
    last_donation_date: "2024-02-14",
    total_donations: 4,
    notes: "Rare blood group advocate. Contact anytime for trauma care cases.",
    created_at: new Date(Date.now() - 190 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: "donor-8",
    full_name: "Tasnim Ahmed",
    phone: "01855667788",
    whatsapp_number: "01855667788",
    whatsapp_contact_consent: true,
    email: "tasnim.ahmed@example.com",
    blood_group: "AB-",
    gender: "Male",
    date_of_birth: "1995-12-01",
    district: "Chattogram Metropolitan Area",
    upazila: "Chawkbazar",
    address: "Chawkbazar Medical College Gate",
    availability: true,
    last_donation_date: "2023-10-12",
    total_donations: 2,
    notes: "Living right opposite CMCH. Fast arrival for urgent AB- requests.",
    created_at: new Date(Date.now() - 260 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
];

// Initial mock donation history records for donors
const initialDonationHistory = [
  {
    id: "hist-1",
    donor_id: "donor-1",
    donation_date: "2024-05-18",
    hospital: "Chittagong Medical College Hospital (CMCH)",
    patient_name: "Farid Uddin (Accident Surgery)",
    units_donated: 1,
    notes: "Emergency whole blood transfusion for road traffic victim",
    verified: true,
    created_at: "2024-05-18T10:30:00Z",
  },
  {
    id: "hist-2",
    donor_id: "donor-1",
    donation_date: "2023-12-05",
    hospital: "Parkview Hospital, Panchlaish",
    patient_name: "Baby Alvi (Cardiac surgery)",
    units_donated: 1,
    notes: "Pediatric ward patient",
    verified: true,
    created_at: "2023-12-05T14:15:00Z",
  },
  {
    id: "hist-3",
    donor_id: "donor-1",
    donation_date: "2023-06-20",
    hospital: "Imperial Hospital Chittagong",
    patient_name: "Shafique Ahmed",
    units_donated: 1,
    notes: "Routine replacement donation",
    verified: true,
    created_at: "2023-06-20T09:00:00Z",
  },
  {
    id: "hist-4",
    donor_id: "donor-2",
    donation_date: "2024-03-10",
    hospital: "Evercare Hospital Chattogram",
    patient_name: "Salma Begum (Oncology support)",
    units_donated: 1,
    notes: "Transfusion during chemotherapy cycle",
    verified: true,
    created_at: "2024-03-10T11:45:00Z",
  },
  {
    id: "hist-5",
    donor_id: "donor-2",
    donation_date: "2023-09-14",
    hospital: "Chittagong Medical College Hospital (CMCH)",
    patient_name: "Thalassemia Day-Care Center",
    units_donated: 1,
    notes: "Quarterly Thalassemia support drive",
    verified: true,
    created_at: "2023-09-14T16:00:00Z",
  },
  {
    id: "hist-6",
    donor_id: "donor-3",
    donation_date: "2024-06-02",
    hospital: "CMCH Blood Bank",
    patient_name: "Zubaida Khatun (Maternity C-section)",
    units_donated: 1,
    notes: "Emergency obstetrics call",
    verified: true,
    created_at: "2024-06-02T13:20:00Z",
  },
  {
    id: "hist-7",
    donor_id: "donor-3",
    donation_date: "2024-01-11",
    hospital: "Metropolitan Hospital GEC",
    patient_name: "Kabir Hossain",
    units_donated: 1,
    notes: "Orthopedic surgery donor",
    verified: true,
    created_at: "2024-01-11T10:10:00Z",
  },
  {
    id: "hist-8",
    donor_id: "donor-5",
    donation_date: "2024-04-05",
    hospital: "Cumilla Medical College Hospital",
    patient_name: "Rashidul Hasan (ICU)",
    units_donated: 1,
    notes: "Critical universal negative transfusion",
    verified: true,
    created_at: "2024-04-05T08:30:00Z",
  },
];

// Initial active emergency blood requests
const initialEmergencyRequests = [
  {
    id: "req-1",
    patient_name: "Fatima Begum",
    blood_group: "O+",
    bags_needed: 2,
    hospital: "Chittagong Medical College Hospital (CMCH)",
    district: "Chattogram",
    upazila: "Panchlaish",
    phone: "01819876543",
    urgent: true,
    reason: "Emergency cardiac surgery, Ward 26",
    status: "active",
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "req-2",
    patient_name: "Abdul Karim",
    blood_group: "A-",
    bags_needed: 1,
    hospital: "Parkview Hospital, Chittagong",
    district: "Chattogram",
    upazila: "Panchlaish",
    phone: "01711223344",
    urgent: true,
    reason: "Severe anemia / Thalassemia crisis",
    status: "active",
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: "req-3",
    patient_name: "Rashedul Alam",
    blood_group: "B+",
    bags_needed: 3,
    hospital: "Imperial Hospital Chittagong",
    district: "Chattogram",
    upazila: "Pahartali",
    phone: "01912345678",
    urgent: true,
    reason: "Accident trauma care, ICU Unit",
    status: "active",
    created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
  },
];

/**
 * Creates an in-memory & localStorage mock client that mirrors Supabase PostgREST and Auth APIs.
 * Guarantees zero runtime crashes while providing full persistence in demo/offline mode.
 */
function createMockSupabaseClient() {
  const STORAGE_KEY_DONORS = "bloodconnect_donors_v2";
  const STORAGE_KEY_HISTORY = "bloodconnect_donation_history_v2";
  const STORAGE_KEY_REQUESTS = "bloodconnect_requests_v2";
  const STORAGE_KEY_SESSION = "bloodconnect_session_v2";

  const authListeners = new Set();

  function loadStore(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  function saveStore(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  let donorsStore = loadStore(STORAGE_KEY_DONORS, initialDonors);
  let historyStore = loadStore(STORAGE_KEY_HISTORY, initialDonationHistory);
  let requestsStore = loadStore(STORAGE_KEY_REQUESTS, initialEmergencyRequests);

  let currentSession = null;
  try {
    const s = localStorage.getItem(STORAGE_KEY_SESSION);
    if (s) currentSession = JSON.parse(s);
  } catch {
    currentSession = null;
  }

  function notifyAuth(event, session) {
    currentSession = session;
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {
      // ignore
    }
    authListeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    });
  }

  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.action = "select";
      this.insertData = null;
      this.updateData = null;
      this.sortField = null;
      this.sortAscending = true;
      this.isSingle = false;
      this.limitCount = null;
    }

    select() {
      this.action = "select";
      return this;
    }

    insert(data) {
      this.action = "insert";
      this.insertData = Array.isArray(data) ? data : [data];
      return this;
    }

    update(data) {
      this.action = "update";
      this.updateData = data;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    eq(field, value) {
      this.filters.push({ type: "eq", field, value });
      return this;
    }

    ilike(field, pattern) {
      this.filters.push({ type: "ilike", field, pattern });
      return this;
    }

    in(field, values) {
      this.filters.push({ type: "in", field, values });
      return this;
    }

    order(field, options = {}) {
      this.sortField = field;
      this.sortAscending = options?.ascending !== false;
      return this;
    }

    limit(num) {
      this.limitCount = num;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }

    async execute() {
      await new Promise((r) => setTimeout(r, 40));

      const table = this.tableName.toLowerCase();
      let dataset = [];

      if (table === "donors" || table === "profiles" || table === "available_donors") {
        dataset = donorsStore;
      } else if (table === "donation_history") {
        dataset = historyStore;
      } else if (table === "emergency_requests") {
        dataset = requestsStore;
      } else {
        dataset = [];
      }

      // Handle INSERT
      if (this.action === "insert") {
        const createdItems = [];
        for (const item of this.insertData) {
          const newItem = {
            id: item.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          };

          if (table === "donors" || table === "profiles") {
            if (newItem.availability === undefined) newItem.availability = true;
            if (newItem.total_donations === undefined) newItem.total_donations = 0;
            donorsStore.unshift(newItem);
            saveStore(STORAGE_KEY_DONORS, donorsStore);
          } else if (table === "donation_history") {
            if (newItem.verified === undefined) newItem.verified = true;
            historyStore.unshift(newItem);
            saveStore(STORAGE_KEY_HISTORY, historyStore);

            // Auto-update donor's last_donation_date and total_donations
            if (newItem.donor_id) {
              const matchedDonor = donorsStore.find((d) => d.id === newItem.donor_id);
              if (matchedDonor) {
                matchedDonor.last_donation_date = newItem.donation_date || new Date().toISOString().split("T")[0];
                matchedDonor.total_donations = (matchedDonor.total_donations || 0) + 1;
                matchedDonor.updated_at = new Date().toISOString();
                saveStore(STORAGE_KEY_DONORS, donorsStore);
              }
            }
          } else if (table === "emergency_requests") {
            if (!newItem.status) newItem.status = "active";
            requestsStore.unshift(newItem);
            saveStore(STORAGE_KEY_REQUESTS, requestsStore);
          }
          createdItems.push(newItem);
        }

        return {
          data: this.isSingle ? createdItems[0] : createdItems,
          error: null,
        };
      }

      // Handle UPDATE
      if (this.action === "update") {
        const updatedItems = [];
        dataset.forEach((row, idx) => {
          const matches = this.filters.every((f) => {
            if (f.type === "eq") return String(row[f.field]) === String(f.value);
            return true;
          });
          if (matches) {
            const updated = { ...row, ...this.updateData, updated_at: new Date().toISOString() };
            dataset[idx] = updated;
            updatedItems.push(updated);
          }
        });

        if (table === "donors" || table === "profiles") {
          saveStore(STORAGE_KEY_DONORS, donorsStore);
        } else if (table === "donation_history") {
          saveStore(STORAGE_KEY_HISTORY, historyStore);
        } else if (table === "emergency_requests") {
          saveStore(STORAGE_KEY_REQUESTS, requestsStore);
        }

        return {
          data: this.isSingle ? updatedItems[0] || null : updatedItems,
          error: null,
        };
      }

      // Handle DELETE
      if (this.action === "delete") {
        let remaining = dataset.filter((row) => {
          return !this.filters.every((f) => {
            if (f.type === "eq") return String(row[f.field]) === String(f.value);
            return true;
          });
        });

        if (table === "donors" || table === "profiles") {
          donorsStore = remaining;
          saveStore(STORAGE_KEY_DONORS, donorsStore);
        } else if (table === "donation_history") {
          historyStore = remaining;
          saveStore(STORAGE_KEY_HISTORY, historyStore);
        } else if (table === "emergency_requests") {
          requestsStore = remaining;
          saveStore(STORAGE_KEY_REQUESTS, requestsStore);
        }

        return { data: null, error: null };
      }

      // Handle SELECT
      let results = [...dataset];

      // If querying available_donors view
      if (table === "available_donors") {
        results = results.filter((d) => Boolean(d.availability));
      }

      // Apply Filters
      for (const f of this.filters) {
        if (f.type === "eq") {
          results = results.filter((item) => {
            if (typeof f.value === "boolean") {
              return Boolean(item[f.field]) === f.value;
            }
            return String(item[f.field] || "").toLowerCase() === String(f.value || "").toLowerCase();
          });
        } else if (f.type === "ilike") {
          const cleanPattern = f.pattern.replace(/%/g, "").toLowerCase();
          results = results.filter((item) =>
            String(item[f.field] || "")
              .toLowerCase()
              .includes(cleanPattern)
          );
        } else if (f.type === "in") {
          const set = new Set(f.values.map(String));
          results = results.filter((item) => set.has(String(item[f.field])));
        }
      }

      // Sorting
      if (this.sortField) {
        const field = this.sortField;
        const asc = this.sortAscending;
        results.sort((a, b) => {
          const valA = a[field] ?? "";
          const valB = b[field] ?? "";
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount && this.limitCount > 0) {
        results = results.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        return {
          data: results.length > 0 ? results[0] : null,
          error: results.length === 0 ? { message: "Row not found", code: "PGRST116" } : null,
        };
      }

      return {
        data: results,
        error: null,
      };
    }
  }

  return {
    isMock: true,
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      async getUser() {
        return { data: { user: currentSession?.user || null }, error: null };
      },
      async signInWithPassword({ email }) {
        await new Promise((r) => setTimeout(r, 60));
        const matched = donorsStore.find(
          (d) => d.email && d.email.toLowerCase() === email.toLowerCase()
        );
        const user = {
          id: matched ? matched.id : "usr_" + Date.now(),
          email,
          user_metadata: {
            full_name: matched ? matched.full_name : email.split("@")[0],
            phone: matched ? matched.phone : "",
          },
        };
        const session = {
          access_token: "mock_jwt_token_" + Date.now(),
          user,
        };
        notifyAuth("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signUp({ email, options }) {
        await new Promise((r) => setTimeout(r, 60));
        const userId = "usr_" + Date.now();
        const metadata = options?.data || {};

        const user = {
          id: userId,
          email,
          user_metadata: metadata,
        };
        const session = {
          access_token: "mock_jwt_token_" + Date.now(),
          user,
        };
        notifyAuth("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        notifyAuth("SIGNED_OUT", null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },
    from(tableName) {
      return new MockQueryBuilder(tableName);
    },
  };
}

let activeClient;
let clientIsMock;

if (isConfigured) {
  try {
    activeClient = createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    clientIsMock = false;
  } catch (err) {
    console.warn("[BloodConnect] Failed to initialize Supabase client with env variables, using fallback:", err);
    activeClient = createMockSupabaseClient();
    clientIsMock = true;
  }
} else {
  activeClient = createMockSupabaseClient();
  clientIsMock = true;
}

export const supabase = activeClient;
export const isUsingMock = clientIsMock;

/**
 * Returns diagnostic configuration info about Supabase integration.
 */
export function getSupabaseConfig() {
  return {
    url: rawUrl || "(Not configured)",
    keyPreview: rawKey ? `${rawKey.substring(0, 8)}••••••••${rawKey.substring(rawKey.length - 4)}` : "(Not configured)",
    isConfigured,
    isMock: clientIsMock,
  };
}

/**
 * Tests live connection to Supabase and verifies existence of required tables.
 */
export async function testSupabaseConnection() {
  const start = performance.now();

  if (clientIsMock) {
    return {
      ok: true,
      mode: "mock",
      latencyMs: Math.round(performance.now() - start),
      message: "BloodConnect is running on the local fallback engine. Fully functional with persistent mock data.",
      tables: {
        donors: { ok: true, count: initialDonors.length, status: "Ready (Mock Data Store)" },
        donation_history: { ok: true, count: initialDonationHistory.length, status: "Ready (Mock Data Store)" },
        emergency_requests: { ok: true, count: initialEmergencyRequests.length, status: "Ready (Mock Data Store)" },
      },
    };
  }

  const result = {
    ok: false,
    mode: "live",
    latencyMs: 0,
    message: "",
    tables: {
      donors: { ok: false, status: "Checking...", count: 0 },
      donation_history: { ok: false, status: "Checking...", count: 0 },
      emergency_requests: { ok: false, status: "Checking...", count: 0 },
    },
  };

  try {
    // 1. Test donors table
    const donorsRes = await supabase.from("donors").select("id", { count: "exact" }).limit(1);
    if (donorsRes.error) {
      result.tables.donors = {
        ok: false,
        status: `Missing or RLS blocked: ${donorsRes.error.message}`,
        error: donorsRes.error,
      };
    } else {
      result.tables.donors = {
        ok: true,
        status: "Connected & Active",
        count: donorsRes.count ?? (donorsRes.data?.length || 0),
      };
    }

    // 2. Test donation_history table
    const historyRes = await supabase.from("donation_history").select("id", { count: "exact" }).limit(1);
    if (historyRes.error) {
      result.tables.donation_history = {
        ok: false,
        status: `Missing or RLS blocked: ${historyRes.error.message}`,
        error: historyRes.error,
      };
    } else {
      result.tables.donation_history = {
        ok: true,
        status: "Connected & Active",
        count: historyRes.count ?? (historyRes.data?.length || 0),
      };
    }

    // 3. Test emergency_requests table
    const requestsRes = await supabase.from("emergency_requests").select("id", { count: "exact" }).limit(1);
    if (requestsRes.error) {
      result.tables.emergency_requests = {
        ok: false,
        status: `Missing or RLS blocked: ${requestsRes.error.message}`,
        error: requestsRes.error,
      };
    } else {
      result.tables.emergency_requests = {
        ok: true,
        status: "Connected & Active",
        count: requestsRes.count ?? (requestsRes.data?.length || 0),
      };
    }

    result.latencyMs = Math.round(performance.now() - start);

    const allOk =
      result.tables.donors.ok &&
      result.tables.donation_history.ok &&
      result.tables.emergency_requests.ok;

    result.ok = allOk;
    result.message = allOk
      ? "Successfully connected to live Supabase project! All database tables are online and verified."
      : "Connected to Supabase endpoint, but one or more tables are missing. Run the SQL schema script below in your Supabase SQL Editor.";

    return result;
  } catch (err) {
    result.latencyMs = Math.round(performance.now() - start);
    result.ok = false;
    result.message = `Connection failed: ${err.message || "Network error"}`;
    return result;
  }
}
