import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

const initialDonors = [
  {
    id: "donor-1",
    full_name: "Tanvir Hasan",
    phone: "01711223344",
    blood_group: "A+",
    district: "Chattogram",
    upazila: "Kotwali",
    availability: true,
  },
  {
    id: "donor-2",
    full_name: "Nusrat Jahan",
    phone: "01819876543",
    blood_group: "O+",
    district: "Chattogram",
    upazila: "Panchlaish",
    availability: true,
  },
  {
    id: "donor-3",
    full_name: "Rafiqul Islam",
    phone: "01912345678",
    blood_group: "B+",
    district: "Chattogram",
    upazila: "Halishahar",
    availability: true,
  },
  {
    id: "donor-4",
    full_name: "Ayesha Siddiqua",
    phone: "01611223344",
    blood_group: "AB+",
    district: "Cox's Bazar",
    upazila: "Cox's Bazar Sadar",
    availability: true,
  },
  {
    id: "donor-5",
    full_name: "Mahmudur Rahman",
    phone: "01755667788",
    blood_group: "O-",
    district: "Cumilla",
    upazila: "Cumilla Adarsha Sadar",
    availability: true,
  },
  {
    id: "donor-6",
    full_name: "Farhana Akter",
    phone: "01844332211",
    blood_group: "A-",
    district: "Chattogram",
    upazila: "Hathazari",
    availability: true,
  },
  {
    id: "donor-7",
    full_name: "Shahadat Hossain",
    phone: "01722889900",
    blood_group: "B-",
    district: "Chattogram Metropolitan Area",
    upazila: "Double Mooring",
    availability: true,
  },
  {
    id: "donor-8",
    full_name: "Tasnim Ahmed",
    phone: "01855667788",
    blood_group: "AB-",
    district: "Chattogram Metropolitan Area",
    upazila: "Chawkbazar",
    availability: true,
  },
  {
    id: "donor-9",
    full_name: "Mohammad Zillur",
    phone: "01933445566",
    blood_group: "O+",
    district: "Chattogram Metropolitan Area",
    upazila: "Agrabad",
    availability: true,
  },
  {
    id: "donor-10",
    full_name: "Sadia Chowdhury",
    phone: "01677889900",
    blood_group: "B+",
    district: "Chattogram Metropolitan Area",
    upazila: "Chandgaon",
    availability: true,
  },
  {
    id: "donor-11",
    full_name: "Kamrul Hassan",
    phone: "01799001122",
    blood_group: "A+",
    district: "Chattogram",
    upazila: "Sitakunda",
    availability: true,
  },
  {
    id: "donor-12",
    full_name: "Nahid Parvez",
    phone: "01811223399",
    blood_group: "O+",
    district: "Chattogram Metropolitan Area",
    upazila: "Bakolia",
    availability: true,
  },
  {
    id: "donor-13",
    full_name: "Taslima Nasreen",
    phone: "01922334455",
    blood_group: "B+",
    district: "Chattogram",
    upazila: "Anwara",
    availability: false,
  },
  {
    id: "donor-14",
    full_name: "Jubair Ahmed",
    phone: "01633445566",
    blood_group: "AB+",
    district: "Chattogram",
    upazila: "Mirsharai",
    availability: true,
  },
  {
    id: "donor-15",
    full_name: "Mehedi Hasan",
    phone: "01744556677",
    blood_group: "A-",
    district: "Chattogram",
    upazila: "Patiya",
    availability: false,
  },
  {
    id: "donor-16",
    full_name: "Sharmin Sultana",
    phone: "01888990011",
    blood_group: "O-",
    district: "Chattogram Metropolitan Area",
    upazila: "Bayezid Bostami",
    availability: true,
  },
];

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

function createMockSupabaseClient() {
  const STORAGE_KEY_PROFILES = "bloodconnect_profiles";
  const STORAGE_KEY_SESSION = "bloodconnect_session";
  const STORAGE_KEY_REQUESTS = "bloodconnect_emergency_requests";
  const authListeners = new Set();

  function loadProfiles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((p) => p.id));
          const missing = initialDonors.filter((d) => !existingIds.has(d.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            saveProfiles(merged);
            return merged;
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [...initialDonors];
  }

  function saveProfiles(profiles) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {
      // ignore
    }
  }

  function loadRequests() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [...initialEmergencyRequests];
  }

  function saveRequests(reqs) {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(reqs));
    } catch {
      // ignore
    }
  }

  function loadSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  }

  function saveSession(session) {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {
      // ignore
    }
  }

  let profilesStore = loadProfiles();
  let currentSession = loadSession();

  function notifyAuth(event, session) {
    currentSession = session;
    saveSession(session);
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
      this.updatePayload = null;
      this.insertPayload = null;
      this.selectFields = "*";
      this.isSingle = false;
      this.sortField = null;
      this.sortAscending = true;
    }

    select(fields = "*") {
      this.selectFields = fields;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    order(field, options = {}) {
      this.sortField = field;
      this.sortAscending = options?.ascending ?? true;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    update(payload) {
      this.updatePayload = payload;
      return this;
    }

    insert(payload) {
      this.insertPayload = Array.isArray(payload) ? payload : [payload];
      return this;
    }

    execute() {
      // Handling emergency_requests
      if (this.tableName === "emergency_requests") {
        let reqsStore = loadRequests();

        if (this.insertPayload) {
          const newItems = this.insertPayload.map((item) => ({
            id: item.id || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            urgent: item.urgent !== false,
            status: item.status || "active",
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          }));
          reqsStore = [...newItems, ...reqsStore];
          saveRequests(reqsStore);
          return { data: newItems, error: null };
        }

        if (this.updatePayload) {
          let updatedItem = null;
          reqsStore = reqsStore.map((item) => {
            const match = this.filters.every((f) => item[f.field] === f.value);
            if (match) {
              updatedItem = { ...item, ...this.updatePayload };
              return updatedItem;
            }
            return item;
          });
          saveRequests(reqsStore);
          if (this.isSingle) return { data: updatedItem || {}, error: null };
          return { data: [updatedItem], error: null };
        }

        let results = [...reqsStore];
        for (const filter of this.filters) {
          if (filter.value !== undefined && filter.value !== "") {
            results = results.filter((item) => item[filter.field] === filter.value);
          }
        }

        // Default sort: urgent first, then newest
        results.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        if (this.isSingle) {
          return { data: results[0] || null, error: results[0] ? null : { message: "Not found" } };
        }
        return { data: results, error: null };
      }

      profilesStore = loadProfiles();

      if (this.updatePayload) {
        let updatedItem = null;
        profilesStore = profilesStore.map((item) => {
          const match = this.filters.every((f) => item[f.field] === f.value);
          if (match) {
            updatedItem = { ...item, ...this.updatePayload };
            return updatedItem;
          }
          return item;
        });

        if (!updatedItem && this.filters.some((f) => f.field === "id")) {
          const idFilter = this.filters.find((f) => f.field === "id");
          updatedItem = {
            id: idFilter.value,
            ...this.updatePayload,
          };
          profilesStore.push(updatedItem);
        }

        saveProfiles(profilesStore);

        if (this.isSingle) {
          return { data: updatedItem || {}, error: null };
        }
        return { data: [updatedItem], error: null };
      }

      let results = [...profilesStore];

      if (this.tableName === "available_donors") {
        results = results.filter((donor) => donor.availability === true);
      }

      for (const filter of this.filters) {
        if (filter.value !== undefined && filter.value !== "") {
          results = results.filter((item) => item[filter.field] === filter.value);
        }
      }

      if (this.sortField) {
        results.sort((a, b) =>
          String(a[this.sortField] || "").localeCompare(
            String(b[this.sortField] || "")
          )
        );
      }

      if (this.isSingle) {
        const item = results[0] || null;
        if (!item && this.tableName === "profiles" && this.filters.length > 0) {
          const idFilter = this.filters.find((f) => f.field === "id");
          const defaultProfile = {
            id: idFilter ? idFilter.value : "user-1",
            full_name: currentSession?.user?.user_metadata?.full_name || "Demo User",
            phone: currentSession?.user?.user_metadata?.phone || "01712345678",
            blood_group: "O+",
            district: "Chattogram",
            upazila: "Kotwali",
            address: "",
            availability: true,
          };
          profilesStore.push(defaultProfile);
          saveProfiles(profilesStore);
          return { data: defaultProfile, error: null };
        }
        return { data: item, error: item ? null : { message: "Not found" } };
      }

      return { data: results, error: null };
    }

    then(resolve, reject) {
      try {
        const result = this.execute();
        resolve(result);
      } catch (err) {
        if (reject) reject(err);
        else resolve({ data: null, error: err });
      }
    }
  }

  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      async getUser() {
        if (currentSession?.user) {
          return { data: { user: currentSession.user }, error: null };
        }
        return { data: { user: null }, error: { message: "Not authenticated" } };
      },
      async signInWithPassword({ email }) {
        const userId = "usr_" + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
        let profile = profilesStore.find((p) => p.email === email || p.id === userId);

        if (!profile) {
          profile = {
            id: userId,
            full_name: email.split("@")[0],
            phone: "01711223344",
            blood_group: "A+",
            district: "Chattogram",
            upazila: "Kotwali",
            availability: true,
          };
          profilesStore.push(profile);
          saveProfiles(profilesStore);
        }

        const session = {
          access_token: "mock_jwt_token_" + Date.now(),
          user: {
            id: userId,
            email,
            user_metadata: {
              full_name: profile.full_name,
              phone: profile.phone,
            },
          },
        };

        notifyAuth("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, options }) {
        const userId = "usr_" + Date.now();
        const metadata = options?.data || {};

        const newProfile = {
          id: userId,
          full_name: metadata.full_name || "",
          phone: metadata.phone || "",
          whatsapp_number: metadata.whatsapp_number || metadata.phone || "",
          whatsapp_contact_consent: metadata.whatsapp_contact_consent ?? true,
          date_of_birth: metadata.date_of_birth || "",
          gender: metadata.gender || "",
          blood_group: metadata.blood_group || "",
          district: metadata.district || "",
          upazila: metadata.upazila || "",
          address: metadata.address || "",
          last_donation_date: metadata.last_donation_date || null,
          availability: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        profilesStore.push(newProfile);
        saveProfiles(profilesStore);

        const session = {
          access_token: "mock_jwt_token_" + Date.now(),
          user: {
            id: userId,
            email,
            user_metadata: metadata,
          },
        };

        notifyAuth("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
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

let client = null;

if (supabaseUrl && supabaseKey) {
  try {
    const parsed = new URL(supabaseUrl);
    if (["http:", "https:"].includes(parsed.protocol)) {
      client = createClient(supabaseUrl, supabaseKey);
    }
  } catch (err) {
    console.warn("[AI Studio] Invalid Supabase URL in environment, using mock client:", err);
  }
}

if (!client) {
  client = createMockSupabaseClient();
}

export const supabase = client;
