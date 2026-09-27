# Request maps and distance

## Required database update

The request board now uses Supabase instead of AsyncStorage. Run `supabase/migrations/202609260002_request_locations.sql` once in the Supabase SQL Editor, after the initial schema. Do not rerun the initial schema or delete existing tables.

The new migration adds latitude/longitude and an idempotent posting function. Existing requests stay intact with no pin. New posts require a selected task pin. Ownership comes from the authenticated user, not a client-supplied user ID. Direct table writes remain restricted by the original permissions. A retry from the same open form returns the first post if the response was lost.

Old device-only demo requests remain in local storage but are no longer displayed or automatically uploaded. The shared board reads database requests permitted by RLS. Refresh requests to see posts from another account; this version does not subscribe to Realtime. Distance filtering currently runs on the fetched board (subject to Supabase's API row limit); use a paginated spatial query before scaling beyond that limit.

## Use the map

1. Allow location access after signing in. In Post a Suyo, your device location automatically selects the initial pin. Enter the task address or meeting point and move the pin if the task is somewhere else. You can also tap **Use my current location** to refresh it.
2. Post the request. Its coordinates and details are stored together.
3. Open **Explore request map** on the dashboard, or **View on map** on a request card.
4. Requests sort by distance from your detected position; filter within 1, 3, 5 or 10 km. Refresh your location after moving. If detection failed, use **Show distance from me** to retry.

Distances are great-circle/straight-line estimates, not driving distance or arrival estimates. Open requests past their deadline are excluded from the nearby map. Requests without coordinates remain on the board but are not mapped. This version uses one task/meeting pin; pickup and drop-off routes are future work.

Foreground location permission is requested automatically after signing in. The viewer's position is held in memory and cleared when changing accounts; it is not uploaded or broadcast. Posting shares the selected task pin with people who can view the request. No people tracking or background location is enabled. If location permission is denied, manual map selection still works and distances remain unavailable. The browser/device supplies coordinates through Expo Location; the map tile provider is separate from geolocation.

## Map setup

- **Expo Go:** `react-native-maps` and `expo-location` are included. Restart Expo with `npx expo start --clear` after installing dependencies.
- **Android installed/development build:** enable Maps SDK for Android in Google Cloud, configure the Android package and signing-certificate restrictions, and set `GOOGLE_MAPS_API_KEY` in your build environment. `app.config.js` passes it to `android.config.googleMaps.apiKey`. Rebuild the app; a JS reload cannot add native configuration.
- **iOS:** the map uses Apple Maps by default; rebuild native apps to include the new location permission message.
- **Web:** Leaflet renders OpenStreetMap tiles with attribution. Browser location requires HTTPS or localhost. Tiles need an internet connection. This uses the public OSM tile service for development/low-volume use; choose a suitable tile provider before a large production rollout and follow its usage policy. No address-search/geocoding API is configured yet; type the address and place its matching pin manually.

## Validation

Browser tests use simulated Supabase responses, tile images and device coordinates. SQL checks execute both migrations against local PostgreSQL via PGlite, including invalid coordinates, ownership, access rules and retry handling. Test a real post and map on your phone after applying the migration; automated bundling is not a device test.

References: [Expo SDK 54 maps](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/), [Expo Location](https://docs.expo.dev/versions/v54.0.0/sdk/location/), [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/).
