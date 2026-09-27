import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, authConfigError } from '../lib/supabase';
import { createRequest } from '../data/suyoRequests';
import { fromDatabase } from '../data/supabaseRequests';
import { hasCoordinates } from '../lib/geo';
import { AppState } from 'react-native';

const SuyoContext = createContext(null);
export function SuyoProvider({ children }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [workflow, setWorkflow] = useState({ applications: [], proofs: [], ratings: [], notifications: [], events: [] });
  const [workflowError, setWorkflowError] = useState('');
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const workflowRevision = useRef(0);
  const saving = useRef(false);
  const revision = useRef(0);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const reload = useCallback(async () => {
    if (saving.current) return;
    const run = ++revision.current;
    setError('');
    if (!user?.id) { setRequests([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      if (!supabase) throw new Error(authConfigError);
      const result = await supabase.from('suyo_requests')
        .select('*, requester:profiles!requester_id(full_name)').order('created_at', { ascending: false });
      if (result.error) throw result.error;
      if (run === revision.current && currentUser.current === user.id) setRequests(result.data.map(fromDatabase));
    } catch {
      if (run === revision.current) setError('Could not load requests. Check your connection and retry.');
    } finally { if (run === revision.current) setIsLoading(false); }
  }, [user?.id]);
  useEffect(() => {
    setRequests([]);
    saving.current = false;
    reload();
    return () => { revision.current++; };
  }, [reload]);
  const reloadWorkflow = useCallback(async () => {
    const id = user?.id;
    const run = ++workflowRevision.current;
    if (!id || !supabase) return;
    try {
      const results = await Promise.all([
        supabase.from('applications').select('*, applicant:profiles!applicant_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('proofs').select('*').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*'),
        supabase.from('notifications').select('*').eq('recipient_id', id).order('created_at', { ascending: false }),
        supabase.from('request_events').select('*').order('created_at', { ascending: false }),
      ]);
      if (currentUser.current !== id || run !== workflowRevision.current) return;
      if (results.some(result => result.error)) throw new Error('Could not load task activity. Please refresh to retry.');
      setWorkflow(Object.fromEntries(['applications', 'proofs', 'ratings', 'notifications', 'events'].map((key, index) => [key, results[index].data])));
      setWorkflowError('');
    } catch (err) { if (currentUser.current === id && run === workflowRevision.current) setWorkflowError(err.message); }
    finally { if (currentUser.current === id && run === workflowRevision.current) setWorkflowLoading(false); }
  }, [user?.id]);
  useEffect(() => {
    setWorkflow({ applications: [], proofs: [], ratings: [], notifications: [], events: [] });
    setWorkflowError('');
    setWorkflowLoading(!!user?.id);
    reloadWorkflow();
    if (!user?.id) return;
    const refresh = () => { if (AppState.currentState === 'active') { reload(); reloadWorkflow(); } };
    const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { workflowRevision.current++; clearInterval(timer); listener.remove(); };
  }, [reload, reloadWorkflow, user?.id]);
  const refresh = async () => { await Promise.all([reload(), reloadWorkflow()]); };
  const mutate = async (name, args) => {
    if (!user?.id || !supabase) throw new Error('Please sign in.');
    const { data, error: actionError } = await supabase.rpc(name, args);
    if (actionError) { await refresh(); throw new Error(actionError.message); }
    await refresh();
    return data;
  };
  const markRead = async (id) => {
    const { error: readError } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('recipient_id', user.id);
    if (readError) throw new Error(readError.message);
    await reloadWorkflow();
  };
  const postRequest = async (draft) => {
    if (!user?.id) throw new Error('Please log in before posting a suyo.');
    if (saving.current) throw new Error('A request is already being saved.');
    if (isLoading || error) throw new Error('Retry loading requests before posting.');
    const validated = createRequest(draft, user);
    if (!hasCoordinates(draft.coordinates)) throw new Error('Choose a task location pin on the map.');
    if (!supabase) throw new Error(authConfigError);
    saving.current = true;
    revision.current++;
    try {
      const { data, error: saveError } = await supabase.rpc('create_suyo_request_at_location', {
        p_title: validated.title, p_details: validated.details, p_category: validated.category,
        p_offer_centavos: validated.offerCentavos, p_deadline: validated.deadline,
        p_location: validated.location, p_notes: validated.notes,
        p_latitude: draft.coordinates.latitude, p_longitude: draft.coordinates.longitude,
        p_client_reference: draft.clientReference,
      }).single();
      if (saveError) {
        if (saveError.code === 'PGRST202') throw new Error('The request-location database update is missing. Apply the new migration, then retry.');
        throw new Error(saveError.message || 'Could not save your request. Please retry.');
      }
      const request = fromDatabase({ ...data, requester: { full_name: user.name } });
      if (currentUser.current === user.id) setRequests(previous => [request, ...previous.filter(item => item.id !== request.id)]);
      return request;
    } finally { if (currentUser.current === user.id) saving.current = false; }
  };
  return <SuyoContext.Provider value={{ requests, isLoading, error, reload, postRequest, ...workflow, workflowError, workflowLoading, refresh, mutate, markRead }}>{children}</SuyoContext.Provider>;
}
export function useSuyos() {
  const value = useContext(SuyoContext);
  if (!value) throw new Error('useSuyos must be used inside SuyoProvider');
  return value;
}
