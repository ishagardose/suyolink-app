import React, { useRef, useState } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import { STATUS_LABELS } from '../../data/suyoRequests';
import { uploadProof } from '../../lib/proofUpload';
import ScreenHeader from '../ScreenHeader';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';
import ProofImage from '../requests/ProofImage';
import SuyoSummary from './SuyoSummary';
import PrivateTaskDetails from './PrivateTaskDetails';
import ApplicationsPanel from './ApplicationsPanel';
import StatusActions from './StatusActions';

export default function SuyoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    requests,
    applications,
    proofs,
    ratings,
    events,
    isLoading,
    error: loadError,
    workflowError,
    workflowLoading,
    refresh,
    mutate,
    detailsById,
    loadDetails,
    detailsLoading,
  } = useSuyos();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [asset, setAsset] = useState(null);
  const uploaded = useRef(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  React.useEffect(() => {
    if (id) loadDetails(id);
  }, [id, loadDetails]);

  const request = detailsById[id] || requests.find((item) => item.id === id);
  const act = async (action) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      if (id) await loadDetails(id, { force: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please retry.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const button = (title, action, disabled = false) => (
    <ThemedButton
      title={title}
      disabled={
        busy || disabled || workflowLoading || !!workflowError || !!loadError
      }
      onPress={() => act(action)}
    />
  );
  const input = (label, value, setter) => (
    <ThemedTextInput
      accessibilityLabel={label}
      placeholder={label}
      value={value}
      onChangeText={setter}
      editable={!busy}
      maxLength={1000}
      multiline
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        minHeight: 60,
      }}
    />
  );
  const own = request?.requesterId === user?.id;
  const assigned = request?.providerId === user?.id;
  const requestProofs = proofs.filter((item) => item.request_id === id);
  const rating = ratings.find(
    (item) => item.request_id === id && item.reviewer_id === user?.id,
  );
  const eligible =
    request?.status === 'open' && Date.parse(request.deadline) > Date.now();
  const providerRatings = ratings.filter(
    (item) => item.provider_id === request?.providerId,
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Suyo details"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingBottom: 50,
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
        }}
      >
        <ThemedButton
          title="Refresh task"
          variant="secondary"
          disabled={busy}
          onPress={() => act(refresh)}
        />
        {loadError || workflowError || error ? (
          <ThemedText
            accessibilityRole="alert"
            tone="danger"
          >
            {error || loadError || workflowError}
          </ThemedText>
        ) : null}
        {!request ? (
          <ThemedText>
            {isLoading || detailsLoading
              ? 'Loading task…'
              : 'This task is unavailable or you no longer have access.'}
          </ThemedText>
        ) : (
          <>
            <SuyoSummary details={request} />
            <ThemedButton
              title="Requester profile"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/profile',
                  params: { userId: request.requesterId },
                })
              }
            />
            <PrivateTaskDetails details={request} />
            {request.providerId ? (
              <ThemedText>
                Provider rating:{' '}
                {providerRatings.length
                  ? `${(providerRatings.reduce((total, item) => total + item.score, 0) / providerRatings.length).toFixed(1)} / 5 (${providerRatings.length} reviews)`
                  : 'No ratings yet'}
              </ThemedText>
            ) : null}
            {request.latitude != null ? (
              <ThemedButton
                title="View task location"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: '/map', params: { requestId: id } })
                }
              />
            ) : null}
            {request.status === 'open' && !eligible ? (
              <ThemedText tone="danger">
                Deadline passed. This task is no longer accepting applications.
              </ThemedText>
            ) : null}
            {eligible && !own ? (
              <ThemedButton
                title="Accept task"
                disabled={busy}
                onPress={() =>
                  act(() => mutate('accept_suyo', { p_request_id: id }))
                }
              />
            ) : null}
            <ApplicationsPanel
              request={request}
              applications={applications}
              ratings={ratings}
              userId={user?.id}
              busy={busy}
              disabled={workflowLoading || !!workflowError || !!loadError}
              onApply={() =>
                act(() => mutate('apply_to_suyo', { p_request_id: id }))
              }
              onWithdraw={(appId) =>
                act(() =>
                  mutate('withdraw_application', { p_application_id: appId }),
                )
              }
              onDecide={(appId, accept) =>
                act(() =>
                  mutate('decide_application', {
                    p_application_id: appId,
                    p_accept: accept,
                  }),
                )
              }
            />
            <StatusActions
              request={request}
              userId={user?.id}
              busy={busy}
              disabled={workflowLoading || !!workflowError || !!loadError}
              onStartTask={() =>
                act(() =>
                  mutate('change_suyo_status', {
                    p_request_id: id,
                    p_status: 'in_progress',
                  }),
                )
              }
              onCancelRequest={() =>
                act(() =>
                  mutate('change_suyo_status', {
                    p_request_id: id,
                    p_status: 'cancelled',
                  }),
                )
              }
            />
            {assigned && request.status === 'in_progress' ? (
              <>
                <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
                  Completion proof
                </ThemedText>
                <ThemedButton
                  title="Open proof submission screen"
                  variant="secondary"
                  onPress={() =>
                    router.push({ pathname: '/proof', params: { id } })
                  }
                />
                {button('Choose proof photo', async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    setAsset(result.assets[0]);
                    uploaded.current = null;
                  }
                })}
                {asset ? (
                  <Image
                    source={{ uri: asset.uri }}
                    accessibilityLabel="Selected proof photo"
                    style={{ height: 200, width: '100%' }}
                    resizeMode="contain"
                  />
                ) : null}
                {input('Proof note (optional)', note, setNote)}
                {button(
                  'Submit proof',
                  async () => {
                    if (!uploaded.current)
                      uploaded.current = await uploadProof(asset, id, user.id);
                    await mutate('submit_suyo_proof', {
                      p_request_id: id,
                      p_storage_path: uploaded.current,
                      p_note: note,
                    });
                    setAsset(null);
                    uploaded.current = null;
                    setNote('');
                  },
                  !asset,
                )}
              </>
            ) : null}
            {requestProofs.map((proof) => (
              <View
                key={proof.id}
                style={{
                  padding: 14,
                  gap: 12,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                }}
              >
                <ThemedText style={{ fontWeight: '700' }}>
                  Proof · {proof.status}
                </ThemedText>
                <ProofImage path={proof.storage_path} />
                {proof.note ? <ThemedText>{proof.note}</ThemedText> : null}
                {proof.rejection_reason ? (
                  <ThemedText>
                    Requested changes: {proof.rejection_reason}
                  </ThemedText>
                ) : null}
                {own &&
                proof.status === 'submitted' &&
                request.status === 'awaiting_confirmation' ? (
                  <>
                    <ThemedButton
                      title="Open full review screen"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: '/review-proof',
                          params: { id: proof.id, requestId: id },
                        })
                      }
                    />
                    {button('Approve completion', () =>
                      mutate('review_suyo_proof', {
                        p_proof_id: proof.id,
                        p_accept: true,
                      }),
                    )}
                    {input('Reason for requesting changes', reason, setReason)}
                    {button(
                      'Request changes',
                      () =>
                        mutate('review_suyo_proof', {
                          p_proof_id: proof.id,
                          p_accept: false,
                          p_reason: reason.trim(),
                        }),
                      !reason.trim(),
                    )}
                  </>
                ) : null}
              </View>
            ))}
            {request.status === 'completed' ? (
              rating ? (
                <>
                  <ThemedText style={{ fontWeight: '700' }}>
                    Rating: {rating.score} / 5
                  </ThemedText>
                  <ThemedText>{rating.comment}</ThemedText>
                </>
              ) : own || assigned ? (
                <>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
                    Rate your experience
                  </ThemedText>
                  <ThemedButton
                    title="Open rating screen"
                    variant="secondary"
                    onPress={() =>
                      router.push({ pathname: '/rate-suyo', params: { id } })
                    }
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <ThemedButton
                        key={value}
                        title={String(value)}
                        accessibilityLabel={`${value} stars`}
                        accessibilityState={{ selected: score === value }}
                        variant={score === value ? 'primary' : 'secondary'}
                        disabled={busy}
                        onPress={() => setScore(value)}
                      />
                    ))}
                  </View>
                  {input('Review (optional)', comment, setComment)}
                  {button(
                    'Submit rating',
                    () =>
                      mutate('rate_suyo_user', {
                        p_request_id: id,
                        p_score: score,
                        p_comment: comment,
                      }),
                    !score,
                  )}
                </>
              ) : null
            ) : null}
            {own || assigned ? (
              <>
                <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
                  Task history
                </ThemedText>
                {events
                  .filter((event) => event.request_id === id)
                  .map((event) => (
                    <ThemedText key={event.id}>
                      {STATUS_LABELS[event.to_status] || event.to_status} ·{' '}
                      {new Date(event.created_at).toLocaleString()}
                    </ThemedText>
                  ))}
              </>
            ) : null}
            {busy ? (
              <ThemedText accessibilityRole="status">Saving…</ThemedText>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
