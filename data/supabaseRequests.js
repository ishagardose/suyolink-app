export function fromDatabase(row) {
  return fromPublicRow(row);
}

export function fromPublicRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    requesterId: row.requester_id,
    providerId: row.provider_id ?? null,
    requesterName:
      row.requester_name || row.requester?.full_name || 'SuyoLink user',
    title: row.title,
    details: row.details,
    category: row.category,
    offerCentavos: row.offer_centavos,
    currency: row.currency || 'PHP',
    deadline: row.deadline,
    location: row.location,
    notes: row.notes || '',
    status: row.status,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    distanceKm: row.distance_km ?? null,
  };
}

export function fromDetailPayload(payload) {
  if (!payload) return null;
  return {
    id: payload.id,
    requesterId: payload.requester_id,
    providerId: payload.provider_id ?? null,
    requesterName: payload.requester_name || 'SuyoLink user',
    title: payload.title,
    details: payload.details,
    category: payload.category,
    offerCentavos: payload.offer_centavos,
    currency: payload.currency || 'PHP',
    deadline: payload.deadline,
    location: payload.location,
    notes: payload.notes || '',
    status: payload.status,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    viewerRole: payload.viewer_role || 'unrelated',
    exactAddress: payload.exact_address ?? null,
    exactLatitude: payload.exact_latitude ?? null,
    exactLongitude: payload.exact_longitude ?? null,
    contactPhone: payload.contact_phone ?? null,
  };
}

export function fromTransactionRow(row) {
  if (!row) return null;
  return {
    requestId: row.request_id,
    title: row.title,
    role: row.role,
    otherUserId: row.other_user_id,
    otherUserName: row.other_user_name || 'SuyoLink user',
    rewardCentavos: row.reward_centavos,
    currency: row.currency || 'PHP',
    completedAt: row.completed_at,
    ratingScore: row.rating_score ?? null,
    ratingComment: row.rating_comment ?? null,
  };
}
