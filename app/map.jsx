import React, { useMemo, useState } from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useSuyos } from '../context/SuyoContext';
import { useDeviceLocation } from '../context/LocationContext';
import { distanceKm, formatDistance, hasCoordinates } from '../lib/geo';
import { formatOffer } from '../data/suyoRequests';
import TaskMap from '../components/maps/TaskMap';
import ScreenHeader from '../components/ScreenHeader';
import ThemedText from '../components/themed/ThemedText';
import ThemedButton from '../components/themed/ThemedButton';

export default function MapScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const { requests, reload, isLoading, error } = useSuyos();
  const { position, locate, loading, error: locationError } = useDeviceLocation();
  const [radius, setRadius] = useState(null);
  const [selectedId, setSelectedId] = useState(requestId || null);
  const open = requests.filter(request => request.status === 'open' && Date.parse(request.deadline) > Date.now());
  const target = requests.find(request => request.id === requestId && hasCoordinates(request));
  const pinned = [...open, ...(target && !open.some(request => request.id === target.id) ? [target] : [])].filter(hasCoordinates);
  const nearby = pinned.map(request => ({ ...request, distance: distanceKm(position, request) }))
    .filter(request => !position || radius === null || request.distance <= radius)
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  const selected = nearby.find(request => request.id === selectedId);
  const focus = selected || position || pinned[0];
  const markers = useMemo(() => [
    ...nearby.map(request => ({ id: request.id, latitude: request.latitude, longitude: request.longitude, title: request.title })),
    ...(position ? [{ ...position, id: 'my-location', title: 'Your current location', isMe: true }] : []),
  ], [requests, position, radius]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title="Nearby suyos" subtitle="Find tasks around you" onBack={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} />
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <ThemedText tone="textMuted">Green pins are task locations. Blue is your location. Distances are straight-line estimates, not road distances.</ThemedText>
      <ThemedButton title={position ? 'Refresh my location' : 'Show distance from me'} loading={loading} textStyle={{ color: colors.white }}
        onPress={async () => { setSelectedId(null); await locate(); }} />
      {locationError ? <ThemedText accessibilityRole="alert" tone="danger">{locationError}</ThemedText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[null, 1, 3, 5, 10].map(km => <TouchableOpacity key={km ?? 'all'} accessibilityRole="button"
          accessibilityLabel={km === null ? 'All distances' : `Within ${km} km`} disabled={!position && km !== null}
          accessibilityState={{ selected: radius === km, disabled: !position && km !== null }}
          onPress={() => { setRadius(km); setSelectedId(null); }}
          style={{ padding: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
            opacity: !position && km !== null ? 0.4 : 1, backgroundColor: radius === km ? colors.primary : colors.surface }}>
          <ThemedText style={{ color: radius === km ? colors.white : colors.text }}>{km === null ? 'All' : `${km} km`}</ThemedText>
        </TouchableOpacity>)}
      </View>
      <TaskMap center={focus} markers={markers} height={340} onSelect={id => setSelectedId(id === 'my-location' ? null : id)} />
      <ThemedButton title="Refresh requests" onPress={reload} loading={isLoading} textStyle={{ color: colors.white }} />
      {error ? <ThemedText tone="danger" accessibilityRole="alert">{error}</ThemedText> : null}
      {!isLoading && !error ? <>
        <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{nearby.length} requests on map</ThemedText>
        {!position ? <ThemedText tone="textMuted">Tap Show distance from me to sort nearby tasks and use kilometre filters.</ThemedText> : null}
        {open.length > pinned.length ? <ThemedText tone="textMuted">{open.length - pinned.length} older requests have no map pin yet.</ThemedText> : null}
        {!nearby.length ? <ThemedText>No requests in this area yet. Try a wider distance or post a suyo.</ThemedText> : null}
        {nearby.map(request => <TouchableOpacity key={request.id} accessibilityRole="button" accessibilityLabel={`Focus ${request.title}`}
          onPress={() => setSelectedId(request.id)} style={{ gap: 6, padding: 16, borderRadius: 14, borderWidth: selectedId === request.id ? 2 : 1,
            borderColor: selectedId === request.id ? colors.primary : colors.border, backgroundColor: colors.card }}>
          <ThemedText style={{ fontWeight: '700' }}>{request.title}</ThemedText>
          <ThemedText>{request.location}</ThemedText>
          <ThemedText>{formatOffer(request.offerCentavos)}{position ? ` - ${formatDistance(request.distance)}` : ''}</ThemedText>
          {selectedId === request.id ? <><ThemedText>{request.details}</ThemedText>
            <ThemedButton title="Open task" onPress={() => router.push({ pathname: '/suyo', params: { id: request.id } })} /></> : null}
        </TouchableOpacity>)}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
