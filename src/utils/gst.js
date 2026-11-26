// src/utils/gst.js
//
// Display-only helper — the backend (config/gstConfig.js) is the real
// source of truth for what's actually charged. This just lets the frontend
// show the same GST-inclusive total up front, so there's no surprise
// between what the plan card shows and what Razorpay actually charges.

export const GST_RATE = 0.18; // keep in sync with backend/config/gstConfig.js

// Same unit in, same unit out (paise or rupees).
export const withGst = (baseAmount) =>
  Math.round(Number(baseAmount || 0) * (1 + GST_RATE));
