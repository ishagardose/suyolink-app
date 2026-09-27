export function fromDatabase(row) {
  return {
    id: row.id, requesterId: row.requester_id, providerId: row.provider_id,
    requesterName: row.requester?.full_name || 'SuyoLink user',
    title: row.title, details: row.details, category: row.category,
    offerCentavos: row.offer_centavos, deadline: row.deadline,
    location: row.location, notes: row.notes, status: row.status,
    latitude: row.latitude ?? null, longitude: row.longitude ?? null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
