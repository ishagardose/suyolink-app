import { getTodayFormatted } from '../utils/dashboardHelpers';
import { useState, useEffect } from 'react';
import { getRequestTiming } from '../../../lib/requestTiming';
import { supabase } from '../../../lib/supabase';

export default function useDashboardSuyoLists({ requests, user, now, ratings = [] }) {
  const [postedSuyos, setPostedSuyos] = useState([]);
  const [acceptedSuyos, setAcceptedSuyos] = useState([]);
  const [completedSuyos, setCompletedSuyos] = useState([]);
  const [cancelledSuyos, setCancelledSuyos] = useState([]);
  const [doerAcceptedSuyos, setDoerAcceptedSuyos] = useState([]);
  const [doerCompletedSuyos, setDoerCompletedSuyos] = useState([]);
  const [doerCancelledSuyos, setDoerCancelledSuyos] = useState([]);
  const [providerProfiles, setProviderProfiles] = useState({});

  useEffect(() => {
    if (!requests || !supabase) return;
    const providerIds = [
      ...new Set(
        requests
          .map((r) => r.providerId)
          .filter(Boolean),
      ),
    ];
    if (providerIds.length === 0) return;
    let isMounted = true;
    Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', providerIds),
      supabase
        .from('provider_ratings')
        .select('provider_id, average_rating')
        .in('provider_id', providerIds),
    ])
      .then(([profRes, rateRes]) => {
        if (!isMounted) return;
        const map = {};
        (profRes.data || []).forEach((p) => {
          map[p.id] = { id: p.id, full_name: p.full_name };
        });
        (rateRes.data || []).forEach((r) => {
          if (map[r.provider_id]) {
            map[r.provider_id].rating = r.average_rating
              ? `${Number(r.average_rating).toFixed(1)}★`
              : 'No ratings yet';
          }
        });
        setProviderProfiles((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [requests]);

  const resolveUrgencyTag = (item) => {
    if (
      item?.urgency &&
      ['Normal', 'Urgent', 'Due today', 'Due tomorrow'].includes(item.urgency)
    ) {
      return item.urgency;
    }
    const dueStr = `${item?.due || ''} ${item?.dueDate || ''}`.toLowerCase();
    if (dueStr.includes('urgent') || dueStr.includes('asap')) return 'Urgent';
    if (dueStr.includes('tomorrow')) return 'Due tomorrow';
    if (dueStr.includes('today')) return 'Due today';
    return 'Normal';
  };

  useEffect(() => {
    if (!requests) return;
    const myPosted = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'open')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'Nearby',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        currentBoost: (r.rewardBoostCentavos || 0) / 100,
        baseRewardAmount:
          ((r.offerCentavos || 0) - (r.rewardBoostCentavos || 0)) / 100,
        tag: 'Waiting for doer',
        status: getRequestTiming(r, now).overdue
          ? 'Overdue - waiting for a doer'
          : 'Open - waiting for a doer',
        urgency: resolveUrgencyTag(r),
        details: r.details || '',
        notes: r.notes || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
        ...getRequestTiming(r, now),
      }));

    const myAccepted = requests
      .filter(
        (r) =>
          r.requesterId === user?.id &&
          ['assigned', 'in_progress'].includes(r.status),
      )
      .map((r) => {
        const prof = providerProfiles[r.providerId];
        const doerName =
          r.providerName ||
          prof?.full_name ||
          (r.providerId === user?.id
            ? user?.name || user?.user_metadata?.full_name || 'You'
            : null);
        const doerRating =
          prof?.rating || r.providerRating || 'Verified Courier';
        const doerObj = doerName
          ? {
              name: doerName,
              rating: doerRating,
              phone: r.providerPhone || '',
              vehicle: 'Courier',
            }
          : null;

        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distanceText: 'In Progress',
          reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
          status:
            r.status === 'in_progress'
              ? 'In Progress - Courier on the way'
              : 'Accepted - Courier assigned',
          due: r.deadline
            ? `Due ${new Date(r.deadline).toLocaleDateString()}`
            : 'Due today',
          dueDate: r.deadline
            ? new Date(r.deadline).toLocaleDateString()
            : getTodayFormatted(),
          createdAt: Date.parse(r.createdAt || Date.now()),
          formattedDate: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : 'Today',
          details: r.details || '',
          notes: r.notes || '',
          requesterName: r.requesterName || 'You',
          providerId: r.providerId,
          providerName: doerName,
          assignedDoer: doerName,
          doerName: doerName,
          doer: doerObj,
          rawRequest: r,
        };
      });

    const myCompleted = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'completed')
      .map((r) => {
        const prof = providerProfiles[r.providerId];
        const doerName =
          r.providerName ||
          prof?.full_name ||
          (r.providerId === user?.id
            ? user?.name || user?.user_metadata?.full_name || 'You'
            : null);
        const doerRating =
          prof?.rating || r.providerRating || 'Verified Courier';
        const doerObj = doerName
          ? {
              name: doerName,
              rating: doerRating,
              phone: r.providerPhone || '',
              vehicle: 'Courier',
            }
          : null;

        const matchedRating = (ratings || []).find(
          (rt) =>
            rt.request_id === r.id &&
            (rt.reviewer_id === user?.id || !rt.reviewer_id),
        );

        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          distanceText: 'Fulfilled',
          reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
          rewardAmount: (r.offerCentavos || 0) / 100,
          tag: 'Completed',
          status: 'Completed',
          due: 'Completed',
          dueDate: r.deadline
            ? new Date(r.deadline).toLocaleDateString()
            : getTodayFormatted(),
          createdAt: Date.parse(r.createdAt || Date.now()),
          formattedDate: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : 'Recently',
          details: r.details || '',
          notes: r.notes || '',
          requesterName: r.requesterName || 'You',
          providerId: r.providerId,
          providerName: doerName,
          assignedDoer: doerName,
          doerName: doerName,
          doer: doerObj,
          ratingScore: matchedRating?.score ?? null,
          ratingComment: matchedRating?.comment ?? null,
          rawRequest: r,
        };
      });

    const myCancelled = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'cancelled')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'Cancelled',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: 'Cancelled',
        status: 'Cancelled',
        due: 'Cancelled',
        dueDate: getTodayFormatted(),
        createdAt: Date.parse(r.createdAt || Date.now()),
        formattedDate: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Recently',
        details: r.details || '',
        notes: r.notes || '',
        requesterName: r.requesterName || 'You',
        rawRequest: r,
      }));

    const myAssigned = requests
      .filter(
        (r) =>
          r.providerId === user?.id &&
          ['assigned', 'in_progress'].includes(r.status),
      )
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        distanceText: 'In Progress',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        rewardAmount: (r.offerCentavos || 0) / 100,
        tag: r.status === 'in_progress' ? 'In Progress' : 'Assigned',
        status:
          r.status === 'in_progress' ? 'In Progress - On the way' : 'Accepted',
        createdAt: Date.parse(r.createdAt || Date.now()),
        details: r.details || '',
        notes: r.notes || '',
        requesterName: r.requesterName || 'Community Member',
        requesterId: r.requesterId,
        rawRequest: r,
      }));

    const myDoerCompleted = requests
      .filter((r) => r.providerId === user?.id && r.status === 'completed')
      .map((r) => {
        const matchedRating = (ratings || []).find(
          (rt) =>
            rt.request_id === r.id &&
            (rt.provider_id === user?.id || !rt.provider_id),
        );
        return {
          id: r.id,
          title: r.title,
          category: r.category || 'General',
          location: r.location || 'Nearby',
          earnedAmount: (r.offerCentavos || 0) / 100,
          status: 'completed',
          date: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : 'Completed',
          requesterName: r.requesterName || 'Requester',
          requesterId: r.requesterId,
          ratingScore: matchedRating?.score ?? null,
          ratingComment: matchedRating?.comment ?? null,
          icon:
            r.category === 'Groceries'
              ? 'cart'
              : r.category === 'Medicine'
                ? 'medkit'
                : r.category === 'Delivery'
                  ? 'bicycle'
                  : 'document-text',
          rawRequest: r,
        };
      });

    const myDoerCancelled = requests
      .filter((r) => r.providerId === user?.id && r.status === 'cancelled')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        reward: `₱${((r.offerCentavos || 0) / 100).toFixed(0)}`,
        status: 'Cancelled',
        rawRequest: r,
      }));

    setPostedSuyos(myPosted);
    setAcceptedSuyos(myAccepted);
    setCompletedSuyos(myCompleted);
    setCancelledSuyos(myCancelled);
    setDoerAcceptedSuyos(myAssigned);
    setDoerCompletedSuyos(myDoerCompleted);
    setDoerCancelledSuyos(myDoerCancelled);
  }, [requests, user?.id, now, providerProfiles, ratings]);
  return {
    acceptedSuyos,
    cancelledSuyos,
    completedSuyos,
    doerAcceptedSuyos,
    doerCancelledSuyos,
    doerCompletedSuyos,
    postedSuyos,
    resolveUrgencyTag,
    setCancelledSuyos,
    setDoerAcceptedSuyos,
    setDoerCancelledSuyos,
    setPostedSuyos,
  };
}
