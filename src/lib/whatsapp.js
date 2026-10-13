/**
 * Open WhatsApp chat with a pre-filled message
 */
export const sendWhatsAppMessage = (phone, message) => {
  // 1. Clean phone number — remove everything except digits
  const cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone || cleanPhone.length < 10) {
    alert("Invalid phone number for this donor.");
    return;
  }

  // 2. Encode the message so it works in a URL
  const encodedMessage = encodeURIComponent(message);

  // 3. Build the WhatsApp link
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // 4. Open in new tab
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Build a nice pre-filled message for a blood request
 */
export const buildBloodRequestMessage = (donor, currentUser = null) => {
  const requesterName = currentUser?.name || "Someone";
  return `Assalamu Alaikum ${donor.name},

I found your profile on BloodConnect. I urgently need ${donor.bloodGroup} blood.

📍 Location: ${donor.location || "N/A"}
👤 Requested by: ${requesterName}

Could you please help? JazakAllah Khair.`;
};
