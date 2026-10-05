import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSuyos } from '../../context/SuyoContext';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
export default function Notifications({ showHeading = true, onOpenRequest }) {
  const { notifications, markRead, workflowError, workflowLoading, refresh } =
    useSuyos();
  const { colors } = useTheme();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  return (
    <View style={{ gap: 12 }}>
      {showHeading ? (
        <ThemedText style={{ fontSize: 22, fontWeight: '800' }}>
          Notifications
        </ThemedText>
      ) : null}
      <ThemedText tone="textMuted">
        Application decisions and task updates appear here.
      </ThemedText>
      {error ? (
        <ThemedText
          accessibilityRole="alert"
          tone="danger"
        >
          {error}
        </ThemedText>
      ) : null}
      {workflowError ? (
        <>
          <ThemedText
            tone="danger"
            accessibilityRole="alert"
          >
            {workflowError}
          </ThemedText>
          <ThemedButton
            title="Retry"
            onPress={refresh}
          />
        </>
      ) : null}
      {workflowLoading ? (
        <ThemedText>Loading notifications...</ThemedText>
      ) : !notifications.length ? (
        <ThemedText>No notifications yet.</ThemedText>
      ) : (
        notifications.map((item) => (
          <View
            key={item.id}
            style={{
              padding: 16,
              gap: 10,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: item.read_at ? colors.border : colors.primary,
              backgroundColor: colors.card,
            }}
          >
            {!item.read_at ? (
              <ThemedText style={{ fontWeight: '700' }}>Unread</ThemedText>
            ) : null}
            <ThemedText>{item.body}</ThemedText>
            <ThemedText tone="textMuted">
              {new Date(item.created_at).toLocaleString()}
            </ThemedText>
            <ThemedButton
              title={item.request_id ? 'View request' : 'Mark as read'}
              disabled={busy !== null}
              onPress={async () => {
                setBusy(item.id);
                setError('');
                try {
                  if (!item.read_at) await markRead(item.id);
                  if (item.request_id) {
                    onOpenRequest?.();
                    router.push({
                      pathname: '/suyo',
                      params: { id: item.request_id },
                    });
                  }
                } catch (err) {
                  setError(err.message);
                } finally {
                  setBusy(null);
                }
              }}
            />
          </View>
        ))
      )}
    </View>
  );
}
