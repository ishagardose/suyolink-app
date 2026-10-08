export const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const getTomorrowFormatted = () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const y = String(tomorrow.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const parseDistanceKm = (val) => {
  if (val === 'Any' || val === null || val === undefined) return 'Any';
  if (typeof val === 'number') return val;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 'Any' : num;
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'JD';
  const clean = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(atty\.|dr\.|engr\.|mr\.|ms\.|mrs\.)\s+/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'JD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatDateTimeNow = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateStr} · ${timeStr}`;
};
