import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getRequestDetails } from '../../../data/suyoApi';

export default function useRepostDraft(repostId, setDraft) {
  const { user } = useAuth();
  const [state, setState] = useState({ id: null, loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!repostId) return;
    let active = true;
    setState({ id: repostId, loading: true, error: '' });
    (async () => {
      try {
        const request = await getRequestDetails(repostId);
        if (!request || request.requesterId !== user?.id)
          throw new Error('Only your own requests can be reposted.');
        if (!active) return;
        setDraft((previous) => ({
          ...previous,
          title: request.title,
          details: request.details,
          category: request.category,
          offerAmount: String(request.offerCentavos / 100),
          notes: request.notes
            .replace(/\[Status:\s*[^\]\n]+\]\s*/gi, '')
            .trim(),
          publicLocation: request.location,
          location: request.exactAddress || '',
          exactAddress: request.exactAddress || '',
          phone: request.contactPhone || '',
          contactPhone: (request.contactPhone || '')
            .replace(/\D/g, '')
            .replace(/^(?:63|0)(?=9\d{9}$)/, ''),
          coordinates:
            request.exactLatitude != null && request.exactLongitude != null
              ? {
                  latitude: request.exactLatitude,
                  longitude: request.exactLongitude,
                }
              : null,
          // Old deadlines and task assignments must not carry into a new post.
          deadlineDate: '',
          deadlineTime: '',
          urgency: 'Normal',
          attachments: [],
        }));
        setState({ id: repostId, loading: false, error: '' });
      } catch (error) {
        if (active)
          setState({
            id: repostId,
            loading: false,
            error: error.message || 'Could not load the original task.',
          });
      }
    })();
    return () => {
      active = false;
    };
  }, [repostId, user?.id, attempt, setDraft]);

  return {
    loading: !!repostId && (state.id !== repostId || state.loading),
    error: state.id === repostId ? state.error : '',
    retry: () => setAttempt((previous) => previous + 1),
  };
}
