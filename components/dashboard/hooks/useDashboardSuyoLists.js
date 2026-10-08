import { getTodayFormatted } from '../utils/dashboardHelpers';
import { useState, useEffect } from 'react';
import { getRequestTiming } from '../../../lib/requestTiming';

export default function useDashboardSuyoLists({ requests, user, now }) {
  const [postedSuyos, setPostedSuyos] = useState([]);

  const [acceptedSuyos, setAcceptedSuyos] = useState([]);

  const [completedSuyos, setCompletedSuyos] = useState([]);

  const [cancelledSuyos, setCancelledSuyos] = useState([]);

  const [doerAcceptedSuyos, setDoerAcceptedSuyos] = useState([]);

  const [doerCompletedSuyos, setDoerCompletedSuyos] = useState([]);

  const [doerCancelledSuyos, setDoerCancelledSuyos] = useState([]);

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
        rawRequest: r,
      }));

    const myCompleted = requests
      .filter((r) => r.requesterId === user?.id && r.status === 'completed')
      .map((r) => ({
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
        rawRequest: r,
      }));

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
        rawRequest: r,
      }));

    const myDoerCompleted = requests
      .filter((r) => r.providerId === user?.id && r.status === 'completed')
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        location: r.location || 'Nearby',
        earnedAmount: (r.offerCentavos || 0) / 100,
        date: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString()
          : 'Completed',
        requesterName: r.requesterName || 'Requester',
        icon:
          r.category === 'Groceries'
            ? 'cart'
            : r.category === 'Medicine'
              ? 'medkit'
              : r.category === 'Delivery'
                ? 'bicycle'
                : 'document-text',
        rawRequest: r,
      }));

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
  }, [requests, user?.id, now]);
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
