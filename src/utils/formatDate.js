// src/utils/formatDate.js

/**
 * Formats an ISO timestamp into a human-readable string, e.g.
 * "Jun 30, 2026 10:31 AM"
 */
export function formatTimestamp(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function truncate(text, maxLength = 50) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
