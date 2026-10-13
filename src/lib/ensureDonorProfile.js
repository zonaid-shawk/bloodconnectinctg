import { supabase } from "./supabase";

export async function ensureDonorProfile(user) {
  const metadata = user.user_metadata || {};

  if (
    !metadata.full_name ||
    !metadata.blood_group ||
    !metadata.district ||
    !metadata.upazila
  ) {
    return;
  }

  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingProfile) {
    return;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: metadata.full_name,
      phone: metadata.phone || metadata.whatsapp_number || null,
      blood_group: metadata.blood_group,
      district: metadata.district,
      upazila: metadata.upazila,
      address: metadata.address || null,
      date_of_birth: metadata.date_of_birth || null,
      gender: metadata.gender || null,
      whatsapp_contact_consent: metadata.whatsapp_contact_consent || false,
      last_donation_date: metadata.last_donation_date || null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw error;
  }
}
