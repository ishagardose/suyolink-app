import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function ApplicationsPanel({
  request,
  applications = [],
  ratings = [],
  userId,
  busy = false,
  disabled = false,
  onApply,
  onWithdraw,
  onDecide,
}) {
  const { colors } = useTheme();
  if (!request) return null;

  const own = request.requesterId === userId;
  const eligible = request.status === 'open' && Date.parse(request.deadline) > Date.now();
  const requestApplications = applications.filter((app) => app.request_id === request.id);
  const mine = requestApplications.find((app) => app.applicant_id === userId);

  if (!own) {
    if (mine) {
      return (
        <View style={{ gap: 8, padding: 14, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
          <ThemedText style={{ fontWeight: '700' }}>Your application: {mine.status}</ThemedText>
          {mine.status === 'pending' ? (
            <ThemedButton
              title="Withdraw application"
              variant="secondary"
              disabled={busy || disabled}
              onPress={() => onWithdraw(mine.id)}
            />
          ) : null}
        </View>
      );
    }
    if (eligible) {
      return (
        <ThemedButton
          title="Apply to this Suyo"
          disabled={busy || disabled}
          onPress={onApply}
        />
      );
    }
    return null;
  }

  return (
    <View style={{ gap: 12 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Applicants</ThemedText>
      {!requestApplications.length ? (
        <ThemedText>No applications yet.</ThemedText>
      ) : (
        requestApplications.map((application) => {
          const reviews = ratings.filter((item) => item.provider_id === application.applicant_id);
          const avgScore = reviews.length
            ? (reviews.reduce((sum, item) => sum + item.score, 0) / reviews.length).toFixed(1)
            : null;
          return (
            <View
              key={application.id}
              style={{
                padding: 14,
                gap: 10,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ThemedText style={{ fontWeight: '600' }}>
                {application.applicant?.full_name || 'Provider'} · {application.status}
              </ThemedText>
              <ThemedText tone="textMuted">
                {avgScore ? `${avgScore} / 5 (${reviews.length} reviews)` : 'No ratings yet'}
              </ThemedText>
              {application.status === 'pending' && eligible ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedButton
                      title={'Accept ' + (application.applicant?.full_name || 'provider')}
                      disabled={busy || disabled}
                      onPress={() => onDecide(application.id, true)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedButton
                      title={'Reject ' + (application.applicant?.full_name || 'provider')}
                      variant="secondary"
                      disabled={busy || disabled}
                      onPress={() => onDecide(application.id, false)}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
