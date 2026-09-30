/**
 * Deterministic urgency classification.
 * - Urgent: deadline is within 3 hours.
 * - Due soon: deadline is > 3 hours and <= 24 hours.
 * - null: deadline is > 24 hours or expired or invalid.
 *
 * @param {string|Date} deadline
 * @param {number} [now]
 * @returns {null | { key: 'urgent' | 'due_soon', label: string, rank: number }}
 */
export function urgencyFor(deadline, now = Date.now()) {
  if (!deadline) return null;
  const deadlineTime = new Date(deadline).getTime();
  if (isNaN(deadlineTime)) return null;

  const diffMs = deadlineTime - now;
  if (diffMs <= 0) return null;

  const hours = diffMs / (1000 * 60 * 60);

  if (hours <= 3) {
    return { key: 'urgent', label: 'Urgent', rank: 1 };
  }
  if (hours <= 24) {
    return { key: 'due_soon', label: 'Due soon', rank: 2 };
  }
  return null;
}
