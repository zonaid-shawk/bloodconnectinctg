import { districts, locations } from "../data/chittagongLocations";

/**
 * Identify Bangladesh mobile operator by prefix
 */
export function getBdOperator(prefix) {
  if (["017", "013"].includes(prefix)) return "Grameenphone";
  if (["018"].includes(prefix)) return "Robi";
  if (["016"].includes(prefix)) return "Airtel";
  if (["019", "014"].includes(prefix)) return "Banglalink";
  if (["015"].includes(prefix)) return "Teletalk";
  return null;
}

/**
 * Validates a Bangladesh mobile number
 * Supported formats: 01712345678, +8801712345678, 8801712345678, 01712-345678
 */
export function validateBdPhone(phone, { required = true, fieldName = "Phone number" } = {}) {
  if (!phone || !String(phone).trim()) {
    if (!required) return { isValid: true, error: "", normalized: "", operator: null };
    return {
      isValid: false,
      error: `${fieldName} is required.`,
      normalized: "",
      operator: null,
    };
  }

  const raw = String(phone).trim();
  const digitsOnly = raw.replace(/\D/g, "");

  let normalized;

  if (raw.startsWith("+880") || (digitsOnly.startsWith("880") && digitsOnly.length === 13)) {
    normalized = digitsOnly.slice(2);
  } else {
    normalized = digitsOnly;
  }

  // Check prefix
  if (!normalized.startsWith("01")) {
    return {
      isValid: false,
      error: `${fieldName} must start with 01 (e.g. 017XXXXXXXX).`,
      normalized,
      operator: null,
    };
  }

  const prefix = normalized.slice(0, 3);
  const operator = getBdOperator(prefix);

  if (!operator) {
    return {
      isValid: false,
      error: `Invalid operator prefix "${prefix}". Valid Bangladesh mobile prefixes are 013, 014, 015, 016, 017, 018, 019.`,
      normalized,
      operator: null,
    };
  }

  if (normalized.length < 11) {
    return {
      isValid: false,
      error: `${fieldName} is incomplete (${normalized.length}/11 digits).`,
      normalized,
      operator,
    };
  }

  if (normalized.length > 11) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed 11 digits (found ${normalized.length} digits).`,
      normalized,
      operator,
    };
  }

  // Format as 01XXX-XXXXXX for readability
  const formatted = `${normalized.slice(0, 5)}-${normalized.slice(5)}`;

  return {
    isValid: true,
    error: "",
    normalized,
    formatted,
    operator,
  };
}

/**
 * Validates that district and upazila are within Chittagong division
 */
export function validateChittagongLocation(district, upazila) {
  let districtError = "";
  let upazilaError = "";

  if (!district || !district.trim()) {
    districtError = "Please select a Chittagong district or area.";
  } else if (!districts.includes(district.trim())) {
    districtError = `"${district}" is not a recognized Chittagong location. Please choose from the official list.`;
  }

  const validUpazilas = locations[district] || [];

  if (!upazila || !upazila.trim()) {
    upazilaError = "Please select an Upazila / Thana.";
  } else if (!validUpazilas.includes(upazila.trim())) {
    upazilaError = `"${upazila}" is not a recognized Upazila / Thana in ${district}.`;
  }

  return {
    isValid: !districtError && !upazilaError,
    districtError,
    upazilaError,
    availableUpazilas: validUpazilas,
  };
}
