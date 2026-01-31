// utils/timezoneHelper.js

/**
 * Converts IST datetime-local input to UTC ISO string
 * @param {string} localDateTime - Format: "2026-01-31T12:26" (from datetime-local input)
 * @returns {string} UTC ISO string - Format: "2026-01-31T06:56:00.000Z"
 */
export const convertISTtoUTC = (localDateTime) => {
  if (!localDateTime) return "";
  
  // Create date object from local datetime string (browser assumes local timezone)
  const date = new Date(localDateTime);
  
  // Get IST offset (UTC+5:30 = 330 minutes)
  const ISTOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  
  // Get browser's timezone offset
  const browserOffset = date.getTimezoneOffset() * 60 * 1000;
  
  // Calculate UTC time from IST
  // Remove browser offset, add IST offset, then convert to UTC
  const utcTime = date.getTime() - browserOffset - ISTOffset;
  
  // Create UTC date and return ISO string
  const utcDate = new Date(utcTime);
  return utcDate.toISOString();
};

/**
 * Converts UTC ISO string to IST datetime-local format
 * @param {string} utcISO - Format: "2026-01-31T06:56:00.000Z"
 * @returns {string} Local datetime - Format: "2026-01-31T12:26"
 */
export const convertUTCtoIST = (utcISO) => {
  if (!utcISO) return "";
  
  const date = new Date(utcISO);
  
  // Add IST offset (UTC+5:30)
  const ISTOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + ISTOffset);
  
  // Format to datetime-local format (YYYY-MM-DDTHH:mm)
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats IST datetime for display
 * @param {string} localDateTime - Format: "2026-01-31T12:26"
 * @returns {string} Formatted string - Format: "Jan 31, 2026, 12:26 PM IST"
 */
export const formatISTDateTime = (localDateTime) => {
  if (!localDateTime) return "";
  
  const date = new Date(localDateTime);
  
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' IST';
};

/**
 * Check if datetime is in the future
 * @param {string} localDateTime - Format: "2026-01-31T12:26"
 * @returns {boolean}
 */
export const isFutureDateTime = (localDateTime) => {
  if (!localDateTime) return false;
  
  const selectedDate = new Date(localDateTime);
  const now = new Date();
  
  return selectedDate > now;
};