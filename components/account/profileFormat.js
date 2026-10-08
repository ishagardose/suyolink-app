export function formatFeedbackDate(dateStr) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (isToday) return `Today · ${timeStr}`;
  if (isYesterday) return `Yesterday · ${timeStr}`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const getInitials = (n) => {
  if (!n) return 'AR';
  const parts = n.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
