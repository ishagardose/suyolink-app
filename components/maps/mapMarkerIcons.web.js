const destinationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" aria-hidden="true">
  <path d="M16 40C12 34 2 24 2 16a14 14 0 0 1 28 0c0 8-10 18-14 24Z" fill="#1E4D2B" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="16" cy="16" r="5" fill="#FFFFFF"/>
</svg>`;

const doerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
  <circle cx="18" cy="18" r="17" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
  <circle cx="18" cy="12" r="5" fill="#2563EB"/>
  <path d="M9 28v-3a9 9 0 0 1 18 0v3Z" fill="#2563EB"/>
</svg>`;

export function taskMarkerIcon(L, kind) {
  if (kind !== 'destination' && kind !== 'doer') return null;
  const destination = kind === 'destination';
  return L.divIcon({
    className: `suyo-map-marker suyo-map-marker-${kind}`,
    html: destination ? destinationSvg : doerSvg,
    iconSize: destination ? [32, 42] : [36, 36],
    iconAnchor: destination ? [16, 40] : [18, 18],
    tooltipAnchor: destination ? [0, -30] : [0, -20],
  });
}
