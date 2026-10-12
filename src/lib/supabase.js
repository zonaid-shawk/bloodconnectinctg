import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL. Add it to your .env file.");
}

if (!supabaseKey) {
  throw new Error(
    "Missing Supabase public key. Set VITE_SUPABASE_PUBLISHABLE_KEY in .env.",
  );
}

let parsedSupabaseUrl;

try {
  parsedSupabaseUrl = new URL(supabaseUrl);
} catch {
  throw new Error("VITE_SUPABASE_URL must be a valid Supabase project URL.");
}

if (!["http:", "https:"].includes(parsedSupabaseUrl.protocol)) {
  throw new Error("VITE_SUPABASE_URL must use HTTP or HTTPS.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
