import { useEffect, useState } from 'react';
import { getRequestStatusLabel } from '../data/suyoRequests';

export default function useRequestStatusLabel(request) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const remaining = Date.parse(request?.deadline) - Date.now();
    if (
      request?.status !== 'open' ||
      !Number.isFinite(remaining) ||
      remaining <= 0
    )
      return;
    // Update even when the screen stays open as the deadline passes.
    const timer = setTimeout(
      () => setRevision((value) => value + 1),
      Math.min(remaining + 1, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [request?.status, request?.deadline, revision]);
  return request ? getRequestStatusLabel(request) : '';
}
