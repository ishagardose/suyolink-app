import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import useTaskTracking from '../../hooks/useTaskTracking';
import { distanceKm } from '../../lib/geo';
import { getRequestStatusLabel } from '../../data/suyoRequests';
import ScreenHeader from '../ScreenHeader';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import TaskMap from './TaskMap';
export default function MapScreen() {
  const params = useLocalSearchParams();
  const id = params.requestId || params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { mutate } = useSuyos();
  const {
    task,
    position,
    consent,
    sharing,
    error,
    busy,
    loading,
    start,
    stop,
    refresh,
  } = useTaskTracking(id, user?.id);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const own = task?.providerId === user?.id;
  const participant = own || task?.requesterId === user?.id;
  const active = ['assigned', 'in_progress'].includes(task?.status);
  const destination = task && {
    latitude: task.exactLatitude ?? task.latitude,
    longitude: task.exactLongitude ?? task.longitude,
  };
  const hasDestination =
    destination?.latitude != null && destination?.longitude != null;
  const age = position
    ? Math.max(0, Math.floor((now - Date.parse(position.updated_at)) / 1000))
    : null;
  const fresh = Boolean(
    participant &&
    active &&
    consent &&
    !consent.revoked_at &&
    position &&
    Number.isFinite(age) &&
    age < 30,
  );
  const markers = useMemo(
    () => [
      ...(hasDestination
        ? [
            {
              ...destination,
              id: 'destination',
              kind: 'destination',
              title: task.exactAddress
                ? 'Destination'
                : 'Approximate task area',
            },
          ]
        : []),
      ...(fresh
        ? [
            {
              ...position,
              id: 'doer',
              kind: 'doer',
              title: own ? 'Your position' : 'Doer',
              isMe: true,
            },
          ]
        : []),
    ],
    [
      hasDestination,
      destination?.latitude,
      destination?.longitude,
      task?.exactAddress,
      fresh,
      position,
      own,
    ],
  );
  const remaining =
    fresh && hasDestination ? distanceKm(position, destination) : null;
  const connection = useMemo(
    () =>
      markers.length === 2
        ? markers.map(({ latitude, longitude }) => ({ latitude, longitude }))
        : [],
    [markers],
  );
  const eta =
    remaining != null && position.speed > 0.5
      ? Math.ceil((remaining * 1000) / position.speed / 60)
      : null;
  const action = async (name, args) => {
    setActing(true);
    setActionError('');
    try {
      await mutate(name, args);
      await refresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActing(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={
          participant && task?.providerId ? 'Live tracking' : 'Task location'
        }
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          width: '100%',
          maxWidth: 900,
          alignSelf: 'center',
        }}
      >
        <ThemedButton
          title="Refresh map"
          variant="secondary"
          loading={loading}
          onPress={refresh}
        />
        {error || actionError ? (
          <ThemedText
            tone="danger"
            accessibilityRole="alert"
          >
            {actionError || error}
          </ThemedText>
        ) : null}
        {!id ? (
          <ThemedText>Open a task to view its location.</ThemedText>
        ) : !task ? (
          loading ? (
            <ActivityIndicator color={colors.link} />
          ) : (
            <ThemedText>
              This task is unavailable or you no longer have access.
            </ThemedText>
          )
        ) : (
          <>
            <ThemedText style={{ fontSize: 22, fontWeight: '700' }}>
              {task.title}
            </ThemedText>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.link}
              />
              <ThemedText tone="textMuted">
                {getRequestStatusLabel(task, now)}
                {participant && task.providerId
                  ? ' · Only task participants can see live location'
                  : ''}
              </ThemedText>
            </View>
            <ThemedText>
              {task.exactAddress || task.location}
              {task.exactAddress ? '' : ' (approximate area)'}
            </ThemedText>
            <TaskMap
              center={hasDestination ? destination : null}
              markers={markers}
              connection={connection}
              fitMarkers
              height={360}
            />
            <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color="#1E4D2B"
                />
                <ThemedText tone="textMuted">Task destination</ThemedText>
              </View>
              {participant && active ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color="#2563EB"
                  />
                  <ThemedText tone="textMuted">
                    {own ? 'Your live position' : 'Doer’s live position'}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            {connection.length > 1 ? (
              <ThemedText
                tone="textMuted"
                style={{ fontSize: 12 }}
              >
                Dashed line shows the straight-line connection to the
                destination.
              </ThemedText>
            ) : null}
            {participant && task.providerId ? (
              <View
                style={{
                  padding: 18,
                  gap: 10,
                  borderRadius: 18,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {!active || consent?.revoked_at ? (
                  <ThemedText>Location sharing has stopped</ThemedText>
                ) : fresh ? (
                  <>
                    <ThemedText>
                      {position.arrived
                        ? 'Doer is near the destination'
                        : 'Receiving live location'}
                    </ThemedText>
                    <ThemedText tone="textMuted">
                      Updated {age === 0 ? 'just now' : `${age}s ago`}
                      {Number.isFinite(position.accuracy)
                        ? ` · GPS accuracy ±${Math.round(position.accuracy)} m`
                        : ''}
                    </ThemedText>
                    <ThemedText>
                      {remaining != null
                        ? `${remaining.toFixed(2)} km straight-line distance remaining`
                        : ''}
                    </ThemedText>
                    <ThemedText>
                      {eta != null
                        ? `Estimated ${eta} min at current speed (not a road-route ETA)`
                        : 'ETA unavailable until the doer is moving'}
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText>
                    {position
                      ? 'Location update is stale. Waiting for a fresh position.'
                      : 'Waiting for the doer to share location.'}
                  </ThemedText>
                )}
              </View>
            ) : null}
            {own && active ? (
              <View style={{ gap: 12 }}>
                {sharing ? (
                  <>
                    <ThemedText>Location sharing is on</ThemedText>
                    <ThemedButton
                      title="Stop sharing"
                      variant="secondary"
                      loading={busy}
                      onPress={stop}
                    />
                  </>
                ) : (
                  <>
                    <ThemedText>
                      Share your live position with this requester while this
                      screen is open. Sharing stops when you leave, put the app
                      in the background, submit proof, or end the task.
                    </ThemedText>
                    <ThemedButton
                      title="Share location"
                      loading={busy}
                      onPress={start}
                    />
                    <ThemedButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => router.back()}
                    />
                  </>
                )}
                {task.status === 'assigned' ? (
                  <ThemedButton
                    title="Start task"
                    disabled={acting}
                    onPress={() =>
                      action('change_suyo_status', {
                        p_request_id: id,
                        p_status: 'in_progress',
                      })
                    }
                  />
                ) : null}
                {task.status === 'in_progress' ? (
                  <ThemedButton
                    title="I've arrived"
                    disabled={!fresh || !position?.arrived}
                    onPress={() =>
                      router.push({ pathname: '/proof', params: { id } })
                    }
                  />
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
