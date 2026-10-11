const timestamp = (value) => {
  if (value == null || value === '') return null;
  const result = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(result) ? result : null;
};

export function getRequestTiming(request, now = Date.now()) {
  const createdAt = timestamp(request.createdAt);
  const deadline = timestamp(request.deadline);
  const overdue =
    deadline != null &&
    deadline <= now &&
    ['open', 'assigned', 'in_progress'].includes(request.status);
  let postedTime = 'Posting time unavailable';
  if (createdAt != null) {
    const age = now - createdAt;
    if (age < 0) postedTime = `Posted ${new Date(createdAt).toLocaleString()}`;
    else if (age < 60000) postedTime = 'Posted just now';
    else if (age < 3600000) {
      const minutes = Math.floor(age / 60000);
      postedTime = `Posted ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (age < 86400000) {
      const hours = Math.floor(age / 3600000);
      postedTime = `Posted ${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(age / 86400000);
      postedTime = `Posted ${days} day${days === 1 ? '' : 's'} ago`;
    }
  }
  return {
    createdAt,
    postedTime,
    formattedDate:
      createdAt == null
        ? 'Date unavailable'
        : new Date(createdAt).toLocaleString(),
    overdue,
    due:
      deadline == null
        ? 'No deadline set'
        : `${overdue ? 'Overdue' : 'Due'}: ${new Date(deadline).toLocaleString()}`,
    dueDate: deadline == null ? '' : new Date(deadline).toLocaleDateString(),
  };
}

export function formatArrivesAt(deadline) {
  if (!deadline) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `Arrives At ${y}-${m}-${d} - 5:00 PM`;
  }
  const raw = String(deadline).trim();
  // Strip any '+' and anything that looks like +08:00 or +20m
  const strippedPlus = raw.split('+')[0].trim();

  // If raw contains "YYYY-MM-DD HH:MM"
  const match = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)/.exec(strippedPlus);
  if (match) {
    const datePart = match[1];
    const timeParts = match[2].split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `Arrives At ${datePart} - ${hours}:${minutes} ${ampm}`;
  }

  // If ISO string like 2026-10-12T17:00:00
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `Arrives At ${year}-${month}-${day} - ${hours}:${minutes} ${ampm}`;
    }
  } catch {}

  return `Arrives At ${strippedPlus}`;
}
