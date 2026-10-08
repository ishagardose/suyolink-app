import React from 'react';
import { Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DoerCancelModal({
  doerCancelModalItem,
  resolveColor,
  selectedDoerSuyo,
  busy,
  error,
  onCancel,
  setDoerCancelModalItem,
  setSelectedDoerSuyo,
  styles,
}) {
  return (
    doerCancelModalItem && (
      <Modal
        visible={!!doerCancelModalItem}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (!busy) setDoerCancelModalItem(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.doerCancelModalCard}>
            <View style={styles.doerCancelIconCircle}>
              <Ionicons
                name="warning-outline"
                size={26}
                color={resolveColor('#DC2626', 'color')}
              />
            </View>
            <Text style={styles.doerCancelModalTitle}>
              Cancel Accepted Suyo?
            </Text>
            <Text style={styles.doerCancelModalSub}>
              Are you sure you want to cancel "{doerCancelModalItem.title}"? It
              will be marked cancelled and removed from active tasks. The
              requester can create a new request if it is still needed.
            </Text>
            {error ? (
              <Text
                accessibilityRole="alert"
                style={{
                  color: resolveColor('#DC2626', 'color'),
                  marginBottom: 8,
                }}
              >
                {error}
              </Text>
            ) : null}
            <View style={styles.doerCancelActionRow}>
              <TouchableOpacity
                disabled={busy}
                style={styles.doerCancelKeepBtn}
                activeOpacity={0.7}
                onPress={() => setDoerCancelModalItem(null)}
              >
                <Text style={styles.doerCancelKeepBtnText}>Keep Suyo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                style={styles.doerCancelConfirmBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Confirm cancellation"
                onPress={async () => {
                  const id = doerCancelModalItem.id;
                  const saved = await onCancel(id);
                  if (!saved) return;
                  setDoerCancelModalItem(null);
                  if (selectedDoerSuyo?.id === id) setSelectedDoerSuyo(null);
                }}
              >
                <Text style={styles.doerCancelConfirmBtnText}>
                  {busy ? 'Cancelling...' : 'Yes, Cancel Suyo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  );
}
