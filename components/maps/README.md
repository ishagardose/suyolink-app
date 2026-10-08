# Task maps and live tracking

`app/(main)/map.jsx` is the single map route and renders `MapScreen.jsx`.

- `TaskMap.native.jsx` renders native maps; `TaskMap.web.jsx` renders Leaflet.
- `mapMarkerIcons.web.js` defines destination and doer markers for the web.
- `hooks/useTaskTracking.js` loads task details, consent, and persisted positions from the existing Supabase backend. It starts GPS only after the doer chooses Share location.
- `lib/watchTaskLocation.native.js` and `.web.js` manage platform GPS subscriptions and heartbeats.
- `components/suyo/LiveTrackingCard.jsx` links task details and fulfillment screens to the map.
- `components/fulfillment/hooks/useFulfillmentLocation.js` reads the same consent-gated feed without automatically starting GPS.

Sharing ends when the map loses focus or the app enters the background. Only active task participants see live positions, and positions older than 30 seconds disappear. The dashed connection and distance are straight-line estimates, rather than road navigation.

Task posting uses `components/requests/sections/RequestLocationSection.jsx`, `LocationPicker.jsx`, and `PhilippineAreaPicker.jsx`. The public area stays separate from the exact pin, private directions, and contact phone. Manual area entry remains available when the area directory cannot load.
