export const CATEGORIES = [
  'Delivery',
  'Groceries',
  'Documents',
  'Queuing & Bills',
  'Household',
  'Other',
];
export const REQUEST_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
export const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Accepted',
  in_progress: 'In progress',
  awaiting_confirmation: 'Awaiting confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function parseDeadline(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!match)
    throw new Error('Choose a deadline date and time.');
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    throw new Error('Enter a valid deadline date and time.');
  }
  return date;
}

export function createRequest(draft, user, now = Date.now()) {
  if (!user?.email) throw new Error('Please log in before posting a suyo.');
  const title = draft.title.trim();
  const details = draft.details.trim();
  const location = (draft.publicLocation || draft.location || '').trim();
  const notes = (draft.notes || '').trim();
  if (!title || !details || !location)
    throw new Error('Enter a title, task details, and location.');
  if (
    title.length > 100 ||
    details.length > 2000 ||
    location.length > 250 ||
    notes.length > 1000
  ) {
    throw new Error('Some fields exceed the allowed length.');
  }
  if (!CATEGORIES.includes(draft.category))
    throw new Error('Choose a category.');
  const amount = draft.offerAmount.trim();
  if (
    !/^\d+(\.\d{1,2})?$/.test(amount) ||
    Number(amount) <= 0 ||
    Number(amount) > 1000000
  ) {
    throw new Error(
      'Enter an offer from PHP 0.01 to PHP 1,000,000, with at most two decimal places.'
    );
  }
  const deadline = parseDeadline(draft.deadline);
  if (deadline.getTime() <= now)
    throw new Error('Choose a deadline in the future.');

  // Validate private fields if present or required
  const publicLocation = (draft.publicLocation || draft.location || '').trim();
  const exactAddress = draft.exactAddress !== undefined ? draft.exactAddress.trim() : null;
  const phone = draft.phone !== undefined ? draft.phone.trim() : null;
  const coordinates = draft.coordinates !== undefined ? draft.coordinates : null;

  if (exactAddress !== null && (!exactAddress || exactAddress.length > 500)) {
    throw new Error('Enter an exact address (up to 500 characters).');
  }
  if (phone !== null && (!phone || phone.length > 40)) {
    throw new Error('Enter a contact phone number (up to 40 characters).');
  }
  if (draft.coordinates !== undefined) {
    if (
      !coordinates ||
      typeof coordinates.latitude !== 'number' ||
      typeof coordinates.longitude !== 'number' ||
      isNaN(coordinates.latitude) ||
      isNaN(coordinates.longitude) ||
      coordinates.latitude < -90 ||
      coordinates.latitude > 90 ||
      coordinates.longitude < -180 ||
      coordinates.longitude > 180
    ) {
      throw new Error('Choose a valid task location pin.');
    }
  }

  const result = {
    id:
      'suyo-' +
      now.toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 10),
    requesterEmail: user.email,
    requesterName: user.name,
    title,
    details,
    category: draft.category,
    offerCentavos: Math.round(Number(amount) * 100),
    deadline: deadline.toISOString(),
    location: publicLocation,
    notes,
    publicLocation,
    status: REQUEST_STATUS.OPEN,
    providerEmail: null,
    applicants: [],
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  if (exactAddress) result.exactAddress = exactAddress;
  if (phone) result.phone = phone;
  if (coordinates) result.coordinates = coordinates;
  if (draft.attachments) result.attachments = draft.attachments;

  return result;
}

export function readRequests(raw) {
  if (!raw) return [];
  const records = JSON.parse(raw);
  if (
    !Array.isArray(records) ||
    records.some(
      (r) =>
        !r ||
        typeof r.id !== 'string' ||
        typeof r.requesterEmail !== 'string' ||
        !['title', 'details', 'location', 'notes', 'requesterName'].every(
          (key) => typeof r[key] === 'string'
        ) ||
        !CATEGORIES.includes(r.category) ||
        !STATUS_LABELS[r.status] ||
        !Number.isSafeInteger(r.offerCentavos) ||
        r.offerCentavos <= 0 ||
        !Number.isFinite(Date.parse(r.deadline)) ||
        !Number.isFinite(Date.parse(r.createdAt)) ||
        !Array.isArray(r.applicants)
    )
  )
    throw new Error('Saved requests could not be read.');
  return records;
}

export const formatOffer = (centavos) =>
  '₱' +
  (centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
