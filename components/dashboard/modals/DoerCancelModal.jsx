import React from 'react';
import { Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DoerCancelModal({
  doerCancelModalItem,
  resolveColor,
  selectedDoerSuyo,
  setDoerAcceptedSuyos,
  setDoerCancelModalItem,
  setDoerCancelledSuyos,
  setSelectedDoerSuyo,
  styles,
  triggerToast,
}) {
  return (
    doerCancelModalItem && (
      <Modal
        visible={!!doerCancelModalItem}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDoerCancelModalItem(null)}
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
              will be immediately released back to the public available board so
              other couriers can fulfill it.
            </Text>
            <View style={styles.doerCancelActionRow}>
              <TouchableOpacity
                style={styles.doerCancelKeepBtn}
                activeOpacity={0.7}
                onPress={() => setDoerCancelModalItem(null)}
              >
                <Text style={styles.doerCancelKeepBtnText}>Keep Suyo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doerCancelConfirmBtn}
                activeOpacity={0.7}
                onPress={() => {
                  const itemToCancel = doerCancelModalItem;
                  setDoerCancelModalItem(null);
                  if (selectedDoerSuyo?.id === itemToCancel.id) {
                    setSelectedDoerSuyo(null);
                  }
                  // Remove from accepted, add to cancelled
                  setDoerAcceptedSuyos((prev) =>
                    prev.filter((s) => s.id !== itemToCancel.id),
                  );
                  setDoerCancelledSuyos((prev) => [
                    {
                      ...itemToCancel,
                      status: 'Cancelled by Doer',
                      cancelledAt: 'Today · Just now',
                      cancelReason:
                        'Cancelled by Doer · Released back to board',
                    },
                    ...prev,
                  ]);
                  triggerToast(
                    'Suyo cancelled and returned to public board',
                    'alert',
                  );
                }}
              >
                <Text style={styles.doerCancelConfirmBtnText}>
                  Yes, Cancel Suyo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  );
}
