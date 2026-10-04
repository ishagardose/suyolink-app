import React, { useState } from 'react';
import { View } from 'react-native';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function StatusActions({
  request,
  userId,
  busy = false,
  disabled = false,
  onStartTask,
  onCancelRequest,
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!request) return null;

  const own = request.requesterId === userId;
  const assigned = request.providerId === userId;

  return (
    <View style={{ gap: 10 }}>
      {assigned && request.status === 'assigned' ? (
        <ThemedButton
          title="Start task"
          disabled={busy || disabled}
          onPress={onStartTask}
        />
      ) : null}

      {(own || assigned) && ['open', 'assigned', 'in_progress'].includes(request.status) ? (
        confirmCancel ? (
          <View style={{ gap: 8 }}>
            <ThemedText>Cancel this request? Pending applications will close.</ThemedText>
            <ThemedButton
              title="Confirm cancellation"
              variant="danger"
              disabled={busy || disabled}
              onPress={onCancelRequest}
            />
            <ThemedButton
              title="Keep request"
              variant="secondary"
              disabled={busy || disabled}
              onPress={() => setConfirmCancel(false)}
            />
          </View>
        ) : (
          <ThemedButton
            title="Cancel request"
            variant="secondary"
            disabled={busy || disabled}
            onPress={() => setConfirmCancel(true)}
          />
        )
      ) : null}
    </View>
  );
}
