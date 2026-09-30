import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useSuyos } from '../context/SuyoContext';
import { useTheme } from '../theme/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import ThemedText from '../components/themed/ThemedText';
import ThemedButton from '../components/themed/ThemedButton';
import ThemedTextInput from '../components/themed/ThemedTextInput';
import ProofImage from '../components/requests/ProofImage';
import SuyoSummary from '../components/suyo/SuyoSummary';

export default function ReviewProofScreen() {
  const { id: proofId, requestId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { requests, proofs, detailsById, loadDetails, mutate, refresh } = useSuyos();

  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (requestId) loadDetails(requestId);
  }, [requestId, loadDetails]);

  const request = detailsById[requestId] || requests.find((item) => item.id === requestId);
  const proof = proofs.find((p) => p.id === proofId) || proofs.find((p) => p.request_id === requestId);

  const isRequester = request?.requesterId === user?.id;
  const isAwaitingConfirmation = request?.status === 'awaiting_confirmation';

  const handleDecision = async (accept) => {
    if (!proof?.id) return;
    if (!accept && !reason.trim()) {
      setError('Please provide a reason for requesting changes.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await mutate('review_suyo_proof', {
        p_proof_id: proof.id,
        p_accept: accept,
        p_reason: accept ? '' : reason.trim(),
      });
      if (requestId) await loadDetails(requestId, { force: true });
      await refresh();
      if (accept) {
        router.replace({ pathname: '/rate-suyo', params: { id: requestId } });
      } else {
        router.replace({ pathname: '/suyo', params: { id: requestId } });
      }
    } catch (err) {
      setError(err.message || 'Failed to review proof. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  if (request && (!isRequester || !isAwaitingConfirmation)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title="Review completion proof"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
        />
        <View style={{ padding: 20, gap: 16 }}>
          <ThemedText tone="danger">
            Completion proofs can only be reviewed by the requester while awaiting confirmation.
          </ThemedText>
          <ThemedButton
            title="Return to task"
            onPress={() => router.replace({ pathname: '/suyo', params: { id: requestId } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Review completion proof"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
        {request ? <SuyoSummary details={request} /> : null}

        <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Submitted evidence</ThemedText>

        {error ? (
          <ThemedText accessibilityRole="alert" tone="danger">
            {error}
          </ThemedText>
        ) : null}

        {proof ? (
          <View
            style={{
              padding: 14,
              gap: 12,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ThemedText style={{ fontWeight: '700' }}>Proof · {proof.status}</ThemedText>
            <ProofImage path={proof.storage_path} />
            {proof.note ? <ThemedText>Note from provider: {proof.note}</ThemedText> : null}
          </View>
        ) : (
          <ThemedText>No proof found.</ThemedText>
        )}

        <View style={{ gap: 10, marginTop: 8 }}>
          <ThemedButton
            title={busy ? 'Approving…' : 'Approve completion'}
            disabled={busy || !proof}
            onPress={() => handleDecision(true)}
          />

          <ThemedText style={{ fontSize: 16, fontWeight: '600', marginTop: 12 }}>
            Report an issue or request changes
          </ThemedText>
          <ThemedTextInput
            accessibilityLabel="Reason for requesting changes"
            placeholder="Reason for requesting changes (required)"
            value={reason}
            onChangeText={setReason}
            editable={!busy}
            maxLength={1000}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
              minHeight: 70,
              backgroundColor: colors.card,
            }}
          />
          <ThemedButton
            title={busy ? 'Submitting…' : 'Request changes'}
            variant="secondary"
            disabled={busy || !proof || !reason.trim()}
            onPress={() => handleDecision(false)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
