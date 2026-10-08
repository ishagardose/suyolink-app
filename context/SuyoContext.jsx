import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  useEffect(() => {
    setDetailsById({});
    setDetailsError('');
  }, [user?.id]);
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
          radiusKm: listFilters.radiusKm,
        }),
      ];
      if (listFilters.scope === 'browse') {
        promises.push(
          apiListRequests({ scope: 'posted' }).catch(() => []),
          apiListRequests({ scope: 'assigned' }).catch(() => []),
        );
      }
      const [data, postedData = [], assignedData = []] =
        await Promise.all(promises);
      if (run === revision.current && currentUser.current === user.id) {
        const mergedMap = new Map();
        [...data, ...postedData, ...assignedData].forEach((item) => {
          if (item?.id) mergedMap.set(item.id, item);
        });
        setRequests(Array.from(mergedMap.values()));
      }
    } catch (err) {
      if (run === revision.current) {
        setError(
          err.message ||
            'Could not load requests. Check your connection and retry.',
        );
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
      const requestedBy = user?.id;
      setDetailsLoading(true);
      setDetailsError('');
      try {
        const details = await apiGetRequestDetails(requestId);
        if (currentUser.current !== requestedBy) return null;
        setDetailsById((prev) => ({ ...prev, [requestId]: details }));
        return details;
      } catch (err) {
        setDetailsError(err.message || 'Failed to load task details.');
        return null;
      } finally {
        setDetailsLoading(false);
      }
    },
    [detailsById, user?.id],
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
        supabase
          .from('proofs')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('ratings').select('*'),
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('request_events')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);
      if (currentUser.current !== id || run !== workflowRevision.current)
        return;
      if (results.some((result) => result.error)) {
        throw new Error(
          'Could not load task activity. Please refresh to retry.',
        );
      }
      setWorkflow(
        Object.fromEntries(
          ['applications', 'proofs', 'ratings', 'notifications', 'events'].map(
            (key, index) => [key, results[index].data],
          ),
        ),
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

  const recordTransaction = useCallback(
    async (tx) => {
      if (!tx || !tx.requestId) return;
      const normalized = {
        requestId: tx.requestId,
        title: tx.title || 'Completed Suyo',
        role: tx.role || 'provider',
        otherUserId: tx.otherUserId || null,
        otherUserName: tx.otherUserName || (tx.role === 'provider' ? 'Requester' : 'Courier'),
        rewardCentavos: Number(tx.rewardCentavos) || 15000,
        currency: tx.currency || 'PHP',
        completedAt: tx.completedAt || new Date().toISOString(),
        ratingScore: tx.ratingScore ?? null,
        ratingComment: tx.ratingComment ?? null,
        category: tx.category || 'General',
        location: tx.location || 'Tagum City',
      };

      setTransactions((prev) => {
        const key = `${normalized.requestId}_${normalized.role}`;
        const filtered = (prev || []).filter((item) => `${item.requestId}_${item.role}` !== key);
        const next = [normalized, ...filtered];
        const scopeKey = user?.id || 'guest';
        AsyncStorage.setItem(
          `@suyolink_local_transactions_${scopeKey}`,
          JSON.stringify(next)
        ).catch(() => {});
        return next;
      });

      // Broadcast across realtime channels to other devices
      try {
        if (supabase) {
          const ch = supabase.channel('suyo-platform-realtime-feed');
          ch.send({
            type: 'broadcast',
            event: 'transaction_completed',
            payload: normalized,
          });
        }
      } catch (_) {}
    },
    [user?.id]
  );

  const reloadTransactions = useCallback(async () => {
    const id = user?.id;
    const run = ++transactionRevision.current;
    const scopeKey = id || 'guest';
    setTransactionsLoading(true);
    setTransactionsError('');
    try {
      let rpcData = [];
      if (id && supabase) {
        try {
          rpcData = await apiListTransactions();
        } catch (_) {}
      }

      // Read local storage transactions
      let localData = [];
      try {
        const raw = await AsyncStorage.getItem(`@suyolink_local_transactions_${scopeKey}`);
        if (raw) localData = JSON.parse(raw);
      } catch (_) {}

      // Combine with any completed requests from active context
      const fromRequests = (requests || [])
        .filter((r) => r.status === 'completed')
        .map((r) => {
          const isProvider =
            (id && (r.providerId === id || r.provider_id === id)) ||
            r.scope === 'assigned' ||
            r.isAcceptedByMe;
          const isRequester =
            (id && (r.requesterId === id || r.requester_id === id || r.user_id === id)) ||
            r.scope === 'posted' ||
            r.isMine ||
            (user?.email && r.requesterEmail === user.email);
          if (!isProvider && !isRequester) return null;
          return {
            requestId: r.id,
            title: r.title,
            role: isProvider ? 'provider' : 'requester',
            otherUserId: isProvider ? (r.requesterId || null) : (r.providerId || null),
            otherUserName: isProvider
              ? (r.requesterName || 'Requester')
              : (r.providerName || r.doer?.name || 'Courier'),
            rewardCentavos: r.offerCentavos || Math.round((Number(r.rewardAmount) || 0) * 100) || 15000,
            currency: 'PHP',
            completedAt:
              r.completed_at ||
              r.completedAt ||
              r.updated_at ||
              r.createdAt ||
              new Date().toISOString(),
            ratingScore: r.ratingScore ?? null,
            ratingComment: r.ratingComment ?? null,
            category: r.category || 'General',
            location: r.location || 'Nearby',
          };
        })
        .filter(Boolean);

      // Merge and deduplicate by `${requestId}_${role}`
      const map = new Map();
      (rpcData || []).forEach((t) => {
        if (t && t.requestId) map.set(`${t.requestId}_${t.role}`, t);
      });
      (localData || []).forEach((t) => {
        const k = `${t.requestId}_${t.role}`;
        if (!map.has(k)) map.set(k, t);
      });
      fromRequests.forEach((t) => {
        const k = `${t.requestId}_${t.role}`;
        if (!map.has(k)) map.set(k, t);
      });

      const merged = Array.from(map.values()).sort((a, b) => {
        const tA = a.completedAt ? Date.parse(a.completedAt) : 0;
        const tB = b.completedAt ? Date.parse(b.completedAt) : 0;
        return tB - tA;
      });

      if (currentUser.current === id && run === transactionRevision.current) {
        setTransactions(merged);
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
  }, [user?.id, user?.email, requests]);

  useEffect(() => {
    setWorkflow({
      applications: [],
      proofs: [],
      ratings: [],
      notifications: [],
      events: [],
    });
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
    const timer = setInterval(refreshData, 20000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshData();
    });

    // Real-time Supabase subscriptions across all devices
    let realtimeChannel = null;
    if (supabase) {
      realtimeChannel = supabase
        .channel('suyo-platform-realtime-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'suyo_requests' },
          () => {
            reload();
            reloadWorkflow();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            reloadWorkflow();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ratings' },
          () => {
            reloadWorkflow();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'applications' },
          () => {
            reloadWorkflow();
          }
        )
        .on(
          'broadcast',
          { event: 'new_suyo' },
          () => {
            reload();
            reloadWorkflow();
          }
        )
        .on(
          'broadcast',
          { event: 'transaction_completed' },
          () => {
            reloadTransactions();
          }
        )
        .subscribe();
    }

    return () => {
      workflowRevision.current++;
      transactionRevision.current++;
      clearInterval(timer);
      listener.remove();
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
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
    setDetailsById({});
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
    if (isLoading || error)
      throw new Error('Retry loading requests before posting.');
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
        phone: draft.phone,
        coordinates: draft.coordinates,
      });
      const request = {
        ...created,
        requesterName: user.name,
        attachments: validated.attachments || created.attachments || [],
        urgency: draft.urgency || validated.urgency || 'Normal',
        tag: draft.urgency || validated.urgency || 'Normal',
      };
      if (currentUser.current === user.id) {
        setRequests((previous) => [
          request,
          ...previous.filter((item) => item.id !== request.id),
        ]);
      }
      // Broadcast to other devices in real-time
      try {
        if (supabase) {
          const ch = supabase.channel('suyo-platform-realtime-feed');
          ch.send({
            type: 'broadcast',
            event: 'new_suyo',
            payload: request,
          });
        }
      } catch (_) {}
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
        recordTransaction,
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
