import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { COMMUNITY_RATINGS_STORAGE_KEY } from '../account/useProfileData';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import ScreenHeader from '../ScreenHeader';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';
import SuyoSummary from '../suyo/SuyoSummary';

export default function RateSuyoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { requests, ratings, detailsById, loadDetails, mutate, refresh, recordTransaction, reloadTransactions } =
    useSuyos();

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (id) loadDetails(id);
  }, [id, loadDetails]);

  const request = detailsById[id] || requests.find((item) => item.id === id);
  const existingRating = ratings.find(
    (r) => r.request_id === id && r.reviewer_id === user?.id,
  );
  const isParticipant =
    request?.requesterId === user?.id || request?.providerId === user?.id;
  const isAllowedStatus =
    ['completed', 'awaiting_confirmation', 'in_progress', 'assigned'].includes(
      request?.status,
    );

  const handleSubmit = async () => {
    if (!score) return;
    setBusy(true);
    setError('');
    try {
      const recipientId =
        request.requesterId === user?.id
          ? request.providerId
          : request.requesterId;
      const recipientName =
        request.requesterId === user?.id
          ? request.providerName || 'Doer'
          : request.requesterName || 'Requester';

      const reviewItem = {
        id: `rating_${id}_${user?.id || Date.now()}`,
        request_id: id,
        reviewer_id: user?.id,
        provider_id: recipientId,
        recipient_id: recipientId,
        recipientName: recipientName,
        reviewerName:
          user?.user_metadata?.full_name || user?.name || 'Community Member',
        score,
        comment: comment.trim(),
        tags: [],
        created_at: new Date().toISOString(),
      };

      try {
        const rawLocal = await AsyncStorage.getItem(
          COMMUNITY_RATINGS_STORAGE_KEY,
        );
        const list = rawLocal ? JSON.parse(rawLocal) : [];
        const filtered = Array.isArray(list)
          ? list.filter(
              (r) => !(r.request_id === id && r.reviewer_id === user?.id),
            )
          : [];
        filtered.unshift(reviewItem);
        await AsyncStorage.setItem(
          COMMUNITY_RATINGS_STORAGE_KEY,
          JSON.stringify(filtered),
        );
      } catch (_) {}

      await mutate('rate_suyo_user', {
        p_request_id: id,
        p_score: score,
        p_comment: comment.trim(),
      });

      if (typeof recordTransaction === 'function' && request) {
        try {
          await recordTransaction({
            requestId: request.id,
            title: request.title,
            role: request.requesterId === user?.id ? 'requester' : 'provider',
            otherUserName: recipientName,
            rewardCentavos: request.rewardCentavos || 0,
            currency: request.currency || 'PHP',
            ratingScore: score,
            ratingComment: comment.trim(),
            category: request.category || '',
            location: request.location || '',
          });
        } catch (e) {
          console.warn('[RateSuyoScreen] recordTransaction warning:', e);
        }
      }

      try {
        if (supabase) {
          if (recipientId) {
            const ch = supabase.channel(`profile_ratings_live_${recipientId}`);
            ch.send({
              type: 'broadcast',
              event: 'new_rating',
              payload: reviewItem,
            });
          }
          const feedCh = supabase.channel('community_ratings_feed');
          feedCh.send({
            type: 'broadcast',
            event: 'new_rating',
            payload: reviewItem,
          });
        }
      } catch (_) {}

      if (id) await loadDetails(id, { force: true });
      await refresh();
      if (typeof reloadTransactions === 'function') {
        reloadTransactions();
      }
      router.replace({ pathname: '/suyo', params: { id } });
    } catch (err) {
      setError(err.message || 'Failed to submit rating. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  if (request && (!isParticipant || !isAllowedStatus)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title="Rate your experience"
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace('/dashboard')
          }
        />
        <View style={{ padding: 20, gap: 16 }}>
          <ThemedText tone="danger">
            You can only rate participants of active or completed tasks.
          </ThemedText>
          <ThemedButton
            title="Return to task"
            onPress={() =>
              router.replace({ pathname: '/suyo', params: { id } })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Rate your experience"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/dashboard')
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingBottom: 60,
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
        }}
      >
        {request ? <SuyoSummary details={request} /> : null}

        {existingRating ? (
          <View
            style={{
              padding: 16,
              gap: 8,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
              Rating: {existingRating.score} / 5
            </ThemedText>
            {existingRating.comment ? (
              <ThemedText>{existingRating.comment}</ThemedText>
            ) : null}
            <ThemedText tone="textMuted">
              You have already submitted a rating for this task.
            </ThemedText>
            <ThemedButton
              title="Return to task"
              variant="secondary"
              onPress={() =>
                router.replace({ pathname: '/suyo', params: { id } })
              }
            />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
              Rate your experience
            </ThemedText>
            <ThemedText tone="textMuted">
              How was your experience? Tap a star score from 1 to 5.
            </ThemedText>

            {error ? (
              <ThemedText
                accessibilityRole="alert"
                tone="danger"
              >
                {error}
              </ThemedText>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((val) => (
                <View
                  key={val}
                  style={{ flex: 1 }}
                >
                  <ThemedButton
                    title={String(val)}
                    accessibilityLabel={`${val} stars`}
                    accessibilityState={{ selected: score === val }}
                    variant={score === val ? 'primary' : 'secondary'}
                    disabled={busy}
                    onPress={() => setScore(val)}
                  />
                </View>
              ))}
            </View>

            <ThemedTextInput
              accessibilityLabel="Review (optional)"
              placeholder="Review (optional)"
              value={comment}
              onChangeText={setComment}
              editable={!busy}
              maxLength={1000}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                minHeight: 80,
                backgroundColor: colors.card,
              }}
            />

            <ThemedButton
              title={busy ? 'Submitting rating…' : 'Submit rating'}
              disabled={
                busy || !score || !request || !isParticipant || !isAllowedStatus
              }
              onPress={handleSubmit}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
