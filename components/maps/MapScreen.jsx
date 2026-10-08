import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useDeviceLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/ThemeContext';
import useTaskTracking from '../../hooks/useTaskTracking';
import { hasCoordinates } from '../../lib/geo';
import useRoadRoute from '../../hooks/useRoadRoute';
import RoadRouteSummary from './RoadRouteSummary';
import { STATUS_LABELS } from '../../data/suyoRequests';
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
  const { mutate, requests } = useSuyos();
  const { position: devicePosition } = useDeviceLocation();
  const {
    task,
    position,
    consent,
    sharing,
    error,
    busy,
    start,
    stop,
    refresh,
  } = useTaskTracking(id, user?.id);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const own = task?.providerId === user?.id;
  const active = ['assigned', 'in_progress'].includes(task?.status);
  const destination = task && {
    latitude: task.exactLatitude ?? task.latitude,
    longitude: task.exactLongitude ?? task.longitude,
  };
  const hasDestination = hasCoordinates(destination);
  const fresh =
    position && Date.now() - Date.parse(position.updated_at) < 30000;
  const routing = useRoadRoute(fresh ? position : null, destination);
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
        title="Task location"
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
        {error || actionError ? (
          <ThemedText
            tone="danger"
            accessibilityRole="alert"
          >
            {actionError || error}
          </ThemedText>
        ) : null}
        {!id ? (
          <>
            <ThemedText>Select a task pin to view its location.</ThemedText>
            <TaskMap
              center={hasCoordinates(devicePosition) ? devicePosition : null}
              markers={requests.filter(hasCoordinates).map((request) => ({
                id: request.id,
                latitude: request.latitude,
                longitude: request.longitude,
                title: request.title,
              }))}
              onSelect={(requestId) =>
                router.push({ pathname: '/map', params: { requestId } })
              }
              height={400}
            />
            {!requests.some(hasCoordinates) ? (
              <ThemedText tone="muted">
                No tasks with map locations are available.
              </ThemedText>
            ) : null}
          </>
        ) : !task ? (
          <>
            <ThemedText>
              {error ? 'Task unavailable.' : 'Loading task...'}
            </ThemedText>
            {error ? (
              <ThemedButton
                title="Retry"
                onPress={refresh}
              />
            ) : null}
          </>
        ) : (
          <>
            <ThemedText style={{ fontSize: 22, fontWeight: '700' }}>
              {task.title}
            </ThemedText>
            <ThemedText>{STATUS_LABELS[task.status]}</ThemedText>
            <ThemedText>
              {task.exactAddress || task.location}
              {task.exactAddress ? '' : ' (approximate area)'}
            </ThemedText>
            <TaskMap
              center={hasDestination ? destination : null}
              routeCoordinates={routing.route?.points}
              markers={[
                ...(hasDestination
                  ? [
                      {
                        ...destination,
                        id: 'destination',
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
                        title: own ? 'Your position' : 'Doer',
                        isMe: true,
                      },
                    ]
                  : []),
              ]}
              height={360}
            />
            <RoadRouteSummary routing={routing} />
            {!active || consent?.revoked_at ? (
              <ThemedText>Location sharing has stopped</ThemedText>
            ) : fresh ? (
              <>
                <ThemedText>
                  {position.arrived
                    ? 'Doer is near the destination'
                    : 'Receiving live location'}
                </ThemedText>
              </>
            ) : (
              <ThemedText>
                {position
                  ? 'Location update is stale. Waiting for a fresh position.'
                  : 'Waiting for the doer to share location.'}
              </ThemedText>
            )}
            {own && active ? (
              <View style={{ gap: 12 }}>
                {sharing ? (
                  <>
                    <ThemedText>Location sharing is on</ThemedText>
                    <ThemedButton
                      title="Stop sharing"
                      variant="secondary"
                      onPress={stop}
                    />
                  </>
                ) : (
                  <>
                    <ThemedText>
                      Share your live position with this requester while this
                      screen is open. The doer and task coordinates are sent to
                      the routing service to find a driving route. Sharing stops
                      when you leave, put the app in the background, submit
                      proof, or end the task.
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
