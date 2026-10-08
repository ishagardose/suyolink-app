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
