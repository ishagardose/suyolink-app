import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../context/AuthContext';
import { useSuyos } from '../../../context/SuyoContext';
import { useTheme } from '../../../theme/ThemeContext';
import useTaskTracking from '../../../hooks/useTaskTracking';
import { STATUS_LABELS } from '../../../data/suyoRequests';
import { hasCoordinates } from '../../../lib/geo';
import useRoadRoute from '../../../hooks/useRoadRoute';
import RoadRouteSummary from '../../maps/RoadRouteSummary';
import ScreenHeader from '../../ScreenHeader';
import ThemedText from '../../themed/ThemedText';
import ThemedButton from '../../themed/ThemedButton';
import TaskMap from '../../maps/TaskMap';

export default function FulfillmentScreen({ role }) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const {
    requests,
    events,
    proofs,
    workflowError,
    workflowLoading,
    mutate,
    refresh: refreshLists,
  } = useSuyos();
  const selectedId = params.id || params.requestId;
  const id =
    selectedId ||
    requests.find(
      (item) =>
        (role === 'requester' ? item.requesterId : item.providerId) ===
          user?.id &&
        ['assigned', 'in_progress', 'awaiting_confirmation'].includes(
          item.status,
        ),
    )?.id;
  const tracking = useTaskTracking(id, user?.id);
  const task = tracking.task;
  const [actionError, setActionError] = useState('');
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [acting, setActing] = useState(false);
  const lock = useRef(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isProvider = !!user?.id && task?.providerId === user.id;
  const isRequester = !!user?.id && task?.requesterId === user.id;
  const participant = isProvider || isRequester;
  const active = ['assigned', 'in_progress'].includes(task?.status);
  const destination = task && {
    latitude: task.exactLatitude ?? task.latitude,
    longitude: task.exactLongitude ?? task.longitude,
  };
  const fresh =
    active &&
    participant &&
    !!tracking.consent &&
    !tracking.consent.revoked_at &&
    tracking.position &&
    now - Date.parse(tracking.position.updated_at) < 30000;
  const routing = useRoadRoute(fresh ? tracking.position : null, destination);
  const taskEvents = events.filter((event) => event.request_id === id);
  const latestProof = proofs
    .filter((proof) => proof.request_id === id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const deadline = task?.deadline && new Date(task.deadline);
  const validDeadline = deadline && Number.isFinite(deadline.getTime());
  const act = async (status) => {
    if (lock.current) return;
    lock.current = true;
    setActing(true);
    setActionError('');
    try {
      await mutate('change_suyo_status', {
        p_request_id: id,
        p_status: status,
      });
      await Promise.all([tracking.refresh(), refreshLists()]);
    } catch (error) {
      setActionError(
        error.message || 'Could not update the task. Please retry.',
      );
    } finally {
      lock.current = false;
      setActing(false);
    }
  };
  const navigate = (pathname, extra = {}) =>
    router.push({ pathname, params: { id, ...extra } });

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader
        title={
          role === 'requester' ? 'Suyo Request Fulfillment' : 'Task Fulfillment'
        }
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {tracking.error || actionError || workflowError ? (
          <View style={styles.card}>
            <ThemedText
              tone="danger"
              accessibilityRole="alert"
            >
              {actionError || tracking.error || workflowError}
            </ThemedText>
            <ThemedButton
              title="Retry task"
              variant="secondary"
              onPress={() => Promise.all([tracking.refresh(), refreshLists()])}
            />
          </View>
        ) : null}
        {!id ? (
          <ThemedText>
            No active task. Open a task from your dashboard.
          </ThemedText>
        ) : !task ? (
          <ThemedText>
            {tracking.error ? 'Task unavailable.' : 'Loading task...'}
          </ThemedText>
        ) : !participant ? (
          <View style={styles.card}>
            <ThemedText>
              {task.status === 'open'
                ? 'Accept this task before starting fulfillment.'
                : 'Only the requester and assigned doer can access fulfillment.'}
            </ThemedText>
            <ThemedButton
              title="View task details"
              onPress={() => navigate('/suyo')}
            />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <ThemedText style={styles.status}>
                {STATUS_LABELS[task.status] || task.status}
              </ThemedText>
              <ThemedText style={styles.title}>{task.title}</ThemedText>
              <ThemedText style={styles.reward}>
                {new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: task.currency || 'PHP',
                }).format((task.offerCentavos || 0) / 100)}
              </ThemedText>
              <View style={styles.deadline}>
                <ThemedText
                  tone="muted"
                  style={styles.label}
                >
                  Completion deadline
                </ThemedText>
                <ThemedText style={styles.deadlineDate}>
                  {validDeadline
                    ? deadline.toLocaleDateString('en-PH', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Deadline unavailable'}
                </ThemedText>
                {validDeadline ? (
                  <ThemedText style={styles.deadlineTime}>
                    {deadline.toLocaleTimeString('en-PH', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText>Requester: {task.requesterName}</ThemedText>
              <ThemedText>
                {task.exactAddress || task.location || 'Location unavailable'}
              </ThemedText>
              <ThemedText>
                {task.details || 'No additional instructions.'}
              </ThemedText>
              {isProvider && task.contactPhone ? (
                <ThemedButton
                  title="Call requester"
                  variant="secondary"
                  onPress={() =>
                    Linking.openURL(
                      `tel:${task.contactPhone.replace(/\s/g, '')}`,
                    ).catch(() =>
                      setActionError('Could not open the phone app.'),
                    )
                  }
                />
              ) : null}
            </View>
            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Task location</ThemedText>
              <TaskMap
                routeCoordinates={routing.route?.points}
                center={hasCoordinates(destination) ? destination : null}
                height={280}
                markers={[
                  ...(hasCoordinates(destination)
                    ? [
                        {
                          ...destination,
                          id: 'destination',
                          title: task.exactAddress
                            ? 'Destination'
                            : 'Approximate area',
                        },
                      ]
                    : []),
                  ...(fresh && hasCoordinates(tracking.position)
                    ? [
                        {
                          ...tracking.position,
                          id: 'doer',
                          title: isProvider ? 'Your location' : 'Doer location',
                          isMe: true,
                        },
                      ]
                    : []),
                ]}
              />
              <ThemedText tone="muted">
                {fresh
                  ? 'Receiving live location'
                  : 'Waiting for a fresh location update.'}
              </ThemedText>
              <RoadRouteSummary routing={routing} />
              {isProvider && active ? (
                <>
                  <ThemedText tone="muted">
                    Share your location with the requester while this screen is
                    open. The doer and task coordinates are sent to the routing
                    service to find a driving route. Sharing stops when you
                    leave or background the app.
                  </ThemedText>
                  <ThemedButton
                    title={tracking.sharing ? 'Stop sharing' : 'Share location'}
                    loading={tracking.busy}
                    variant="secondary"
                    onPress={tracking.sharing ? tracking.stop : tracking.start}
                  />
                </>
              ) : null}
            </View>
            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Task history</ThemedText>
              {taskEvents.length ? (
                taskEvents.map((event) => (
                  <View
                    key={event.id}
                    style={styles.history}
                  >
                    <ThemedText>
                      {STATUS_LABELS[event.to_status] ||
                        event.event_type?.replace(/_/g, ' ') ||
                        'Task updated'}
                    </ThemedText>
                    <ThemedText tone="muted">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString('en-PH')
                        : ''}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText tone="muted">
                  {workflowLoading
                    ? 'Loading task history...'
                    : workflowError
                      ? 'Task history unavailable.'
                      : 'No recorded updates yet.'}
                </ThemedText>
              )}
            </View>
            {isProvider && task.status === 'assigned' ? (
              <ThemedButton
                title="Start task"
                loading={acting}
                onPress={() => act('in_progress')}
              />
            ) : null}
            {isProvider && task.status === 'in_progress' ? (
              <ThemedButton
                title="Upload completion proof"
                onPress={() => navigate('/proof')}
              />
            ) : null}
            {task.status === 'awaiting_confirmation' ? (
              <View style={styles.card}>
                <ThemedText>
                  Proof submitted. Completion and earnings are pending requester
                  confirmation.
                </ThemedText>
                {isRequester && latestProof ? (
                  <ThemedButton
                    title="Review completion proof"
                    onPress={() =>
                      navigate('/review-proof', {
                        id: latestProof.id,
                        requestId: id,
                      })
                    }
                  />
                ) : null}
              </View>
            ) : null}
            <ThemedButton
              title="View task details"
              variant="secondary"
              onPress={() => navigate('/suyo')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: 18,
      paddingBottom: 36,
      gap: 16,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    card: {
      padding: 18,
      gap: 12,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 24, lineHeight: 31, fontWeight: '800', flexShrink: 1 },
    status: { fontSize: 13, fontWeight: '700', color: colors.link },
    reward: { fontSize: 22, fontWeight: '700' },
    deadline: {
      padding: 16,
      gap: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
    },
    label: { fontSize: 13, fontWeight: '600' },
    deadlineDate: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '700',
      flexShrink: 1,
    },
    deadlineTime: { fontSize: 22, lineHeight: 29, fontWeight: '800' },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    history: {
      gap: 4,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });
