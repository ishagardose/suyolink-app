import { supabase } from '../lib/supabase';
import {
  fromPublicRow,
  fromDetailPayload,
  fromTransactionRow,
} from './supabaseRequests';

/**
 * Standardized user-safe error message mapper.
 */
function handleApiError(error, defaultMessage) {
  if (!error) return;
  const msg = error.message || String(error);
  // Re-throw concise actionable messages
  throw new Error(msg || defaultMessage);
}

/**
 * Safe list of requests.
 */
export async function listRequests({
  query = '',
  category = null,
  status = null,
  scope = 'browse',
  sort = 'newest',
  origin = null,
  radiusKm = null,
} = {}) {
  if (!supabase) throw new Error('Database client not initialized');

  const { data, error } = await supabase.rpc('list_suyo_requests', {
    p_query: query || '',
    p_category: category || null,
    p_status: status || null,
    p_scope: scope || 'browse',
    p_sort: sort || 'newest',
    p_origin_latitude: origin?.latitude ?? null,
    p_origin_longitude: origin?.longitude ?? null,
    p_radius_km: radiusKm,
  });

  if (error) handleApiError(error, 'Failed to fetch task list.');
  return (data || []).map(fromPublicRow);
}

/**
 * Role-aware task details.
 */
export async function getRequestDetails(requestId) {
  if (!supabase) throw new Error('Database client not initialized');
  if (!requestId) throw new Error('Task ID is required.');

  const { data, error } = await supabase.rpc('get_suyo_details', {
    p_request_id: requestId,
  });

  if (error) handleApiError(error, 'Failed to fetch task details.');
  if (!data) return null;
  return fromDetailPayload(data);
}

/**
 * Atomic creation of request and private details.
 */
export async function postRequest(normalizedDraft) {
  if (!supabase) throw new Error('Database client not initialized');
  if (!normalizedDraft) throw new Error('Task draft is required.');

  const {
    title,
    details,
    category,
    offerCentavos,
    deadline,
    publicLocation,
    exactAddress,
    notes,
    phone,
    coordinates,
    clientReference,
  } = normalizedDraft;

  const { data, error } = await supabase.rpc('create_suyo_request_v2', {
    p_title: title,
    p_details: details,
    p_category: category,
    p_offer_centavos: offerCentavos,
    p_deadline: deadline,
    p_public_location: publicLocation,
    p_exact_address: exactAddress,
    p_notes: notes || '',
    p_contact_phone: phone,
    p_latitude: coordinates?.latitude,
    p_longitude: coordinates?.longitude,
    p_client_reference: clientReference,
  });

  if (error) handleApiError(error, 'Failed to post task.');
  return fromPublicRow(data);
}

/**
 * Get user's saved browsing location.
 */
export async function getLastLocation() {
  if (!supabase) throw new Error('Database client not initialized');

  const { data, error } = await supabase.rpc('get_my_last_location');
  if (error) handleApiError(error, 'Failed to get saved location.');
  if (!data || data.latitude === null) return null;
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    source: data.source,
    updatedAt: data.updated_at,
  };
}

/**
 * Save user's browsing location.
 */
export async function saveLastLocation({
  latitude,
  longitude,
  source = 'manual',
}) {
  if (!supabase) throw new Error('Database client not initialized');

  const { data, error } = await supabase.rpc('save_last_location', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_source: source,
  });

  if (error) handleApiError(error, 'Failed to save location.');
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    source: data.source,
    updatedAt: data.updated_at,
  };
}

/**
 * List completed transactions for current user.
 */
export async function listTransactions() {
  if (!supabase) throw new Error('Database client not initialized');

  const { data, error } = await supabase.rpc('get_my_transactions');
  if (error) handleApiError(error, 'Failed to fetch transactions.');
  return (data || []).map(fromTransactionRow);
}
