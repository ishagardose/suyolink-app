import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, authConfigError } from '../lib/supabase';
import { createRequest } from '../data/suyoRequests';
import {
  listRequests as apiListRequests,
  getRequestDetails as apiGetRequestDetails,
  postRequest as apiPostRequest,
  listTransactions as apiListTransactions,
} from '../data/suyoApi';
import { hasCoordinates } from '../lib/geo';
import { AppState } from 'react-native';

const SuyoContext = createContext(null);

export function SuyoProvider({ children }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & sorting state
  const [listFilters, setListFilters] = useState({
    query: '',
    category: null,
    status: null,
    scope: 'browse',
    sort: 'newest',
    origin: null,
  });

  // Details cache & loading state
  const [detailsById, setDetailsById] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [workflow, setWorkflow] = useState({
    applications: [],
    proofs: [],
    ratings: [],
    notifications: [],
    events: [],
  });
  const [workflowError, setWorkflowError] = useState('');
  const [workflowLoading, setWorkflowLoading] = useState(true);

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');
  const transactionRevision = useRef(0);

  const workflowRevision = useRef(0);
  const saving = useRef(false);
  const revision = useRef(0);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;

  const reload = useCallback(async () => {
    if (saving.current) return;
    const run = ++revision.current;
    setError('');
    if (!user?.id) {
      setRequests([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (!supabase) throw new Error(authConfigError);
      // Safe listing RPC - no direct unrestricted select('*') on suyo_requests
      const promises = [
        apiListRequests({
          query: listFilters.query,
          category: listFilters.category,
          status: listFilters.status,
          scope: listFilters.scope,
          sort: listFilters.sort,
          origin: listFilters.origin,
        }),
      ];
      if (listFilters.scope === 'browse') {
        promises.push(
          apiListRequests({ scope: 'posted' }).catch(() => []),
          apiListRequests({ scope: 'assigned' }).catch(() => [])
        );
      }
      const [data, postedData = [], assignedData = []] = await Promise.all(promises);
      if (run === revision.current && currentUser.current === user.id) {
        const mergedMap = new Map();
        [...data, ...postedData, ...assignedData].forEach((item) => {
          if (item?.id) mergedMap.set(item.id, item);
        });
        setRequests(Array.from(mergedMap.values()));
      }
    } catch (err) {
      if (run === revision.current) {
        setError('Could not load requests. Check your connection and retry.');
      }
    } finally {
      if (run === revision.current) setIsLoading(false);
    }
  }, [user?.id, listFilters]);

  useEffect(() => {
    setRequests([]);
    saving.current = false;
    reload();
    return () => {
      revision.current++;
    };
  }, [reload]);

  const loadDetails = useCallback(
    async (requestId, { force = false } = {}) => {
      if (!requestId) return null;
      if (!force && detailsById[requestId]) {
        return detailsById[requestId];
      }
      setDetailsLoading(true);
      setDetailsError('');
      try {
        const details = await apiGetRequestDetails(requestId);
        setDetailsById((prev) => ({ ...prev, [requestId]: details }));
        return details;
      } catch (err) {
        setDetailsError(err.message || 'Failed to load task details.');
        return null;
      } finally {
        setDetailsLoading(false);
      }
    },
    [detailsById]
  );

  const reloadWorkflow = useCallback(async () => {
    const id = user?.id;
    const run = ++workflowRevision.current;
    if (!id || !supabase) return;
    try {
      const results = await Promise.all([
        supabase
          .from('applications')
          .select('*, applicant:profiles!applicant_id(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('proofs').select('*').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*'),
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', id)
          .order('created_at', { ascending: false }),
        supabase.from('request_events').select('*').order('created_at', { ascending: false }),
      ]);
      if (currentUser.current !== id || run !== workflowRevision.current) return;
      if (results.some((result) => result.error)) {
        throw new Error('Could not load task activity. Please refresh to retry.');
      }
      setWorkflow(
        Object.fromEntries(
          ['applications', 'proofs', 'ratings', 'notifications', 'events'].map(
            (key, index) => [key, results[index].data]
          )
        )
      );
      setWorkflowError('');
    } catch (err) {
      if (currentUser.current === id && run === workflowRevision.current) {
        setWorkflowError(err.message);
      }
    } finally {
      if (currentUser.current === id && run === workflowRevision.current) {
        setWorkflowLoading(false);
      }
    }
  }, [user?.id]);

  const reloadTransactions = useCallback(async () => {
    const id = user?.id;
    const run = ++transactionRevision.current;
    if (!id || !supabase) {
      setTransactions([]);
      setTransactionsLoading(false);
      return;
    }
    setTransactionsLoading(true);
    setTransactionsError('');
    try {
      const data = await apiListTransactions();
      if (currentUser.current === id && run === transactionRevision.current) {
        setTransactions(data);
      }
    } catch (err) {
      if (currentUser.current === id && run === transactionRevision.current) {
        setTransactionsError(err.message || 'Could not load transactions.');
      }
    } finally {
      if (currentUser.current === id && run === transactionRevision.current) {
        setTransactionsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    setWorkflow({ applications: [], proofs: [], ratings: [], notifications: [], events: [] });
    setWorkflowError('');
    setWorkflowLoading(!!user?.id);
    reloadWorkflow();
    setTransactions([]);
    setTransactionsError('');
    reloadTransactions();
    if (!user?.id) return;
    const refreshData = () => {
      if (AppState.currentState === 'active') {
        reload();
        reloadWorkflow();
        reloadTransactions();
      }
    };
    const timer = setInterval(refreshData, 30000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshData();
    });
    return () => {
      workflowRevision.current++;
      transactionRevision.current++;
      clearInterval(timer);
      listener.remove();
    };
  }, [reload, reloadWorkflow, reloadTransactions, user?.id]);

  const refresh = async () => {
    await Promise.all([reload(), reloadWorkflow(), reloadTransactions()]);
  };

  const mutate = async (name, args) => {
    if (!user?.id || !supabase) throw new Error('Please sign in.');
    const { data, error: actionError } = await supabase.rpc(name, args);
    if (actionError) {
      await refresh();
      throw new Error(actionError.message);
    }
    await refresh();
    return data;
  };

  const markRead = async (id) => {
    const { error: readError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_id', user.id);
    if (readError) throw new Error(readError.message);
    await reloadWorkflow();
  };

  const postRequest = async (draft) => {
    if (!user?.id) throw new Error('Please log in before posting a suyo.');
    if (saving.current) throw new Error('A request is already being saved.');
    if (isLoading || error) throw new Error('Retry loading requests before posting.');
    const validated = createRequest(draft, user);
    if (!hasCoordinates(draft.coordinates)) {
      throw new Error('Choose a task location pin on the map.');
    }
    saving.current = true;
    revision.current++;
    try {
      const created = await apiPostRequest({
        ...validated,
        clientReference: draft.clientReference,
        publicLocation: validated.publicLocation || validated.location,
        exactAddress: draft.exactAddress || validated.location,
        phone: draft.phone || 'N/A',
        coordinates: draft.coordinates,
      });
      const request = {
        ...created,
        requesterName: user.name,
        attachments: validated.attachments || created.attachments || [],
      };
      if (currentUser.current === user.id) {
        setRequests((previous) => [
          request,
          ...previous.filter((item) => item.id !== request.id),
        ]);
      }
      return request;
    } finally {
      if (currentUser.current === user.id) saving.current = false;
    }
  };

  return (
    <SuyoContext.Provider
      value={{
        requests,
        isLoading,
        error,
        reload,
        postRequest,
        listFilters,
        setListFilters,
        detailsById,
        detailsLoading,
        detailsError,
        loadDetails,
        ...workflow,
        workflowError,
        workflowLoading,
        transactions,
        transactionsLoading,
        transactionsError,
        reloadTransactions,
        refresh,
        mutate,
        markRead,
      }}
    >
      {children}
    </SuyoContext.Provider>
  );
}

export function useSuyos() {
  const value = useContext(SuyoContext);
  if (!value) throw new Error('useSuyos must be used inside SuyoProvider');
  return value;
}
