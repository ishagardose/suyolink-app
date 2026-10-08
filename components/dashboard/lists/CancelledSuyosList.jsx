import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CancelledSuyosList({
  doerCancelledSuyos,
  doerNavTab,
  handleConfirmDeleteDoerCancelled,
  handleToggleDoerCancelledSelect,
  isDoerCancelledEditMode,
  resolveColor,
  selectedDoerCancelledIds,
  setIsDoerCancelledEditMode,
  setSelectedDoerCancelledIds,
  setSelectedDoerSuyo,
  styles,
}) {
  return (
    doerNavTab === 'cancelled' && (
      <View style={styles.doerListContainer}>
        {doerCancelledSuyos.length === 0 ? (
          <View style={styles.doerEmptyCard}>
            <View style={styles.doerEmptyIconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color={resolveColor('#059669', 'color')}
              />
            </View>
            <Text style={styles.doerEmptyTitle}>No Cancelled Suyos</Text>
            <Text style={styles.doerEmptySub}>
              Your completion rate is high! You have not cancelled any accepted
              suyos.
            </Text>
          </View>
        ) : (
          doerCancelledSuyos.map((item) => {
            const isSelected = selectedDoerCancelledIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.doerCancelledCard,
                  isDoerCancelledEditMode &&
                    isSelected &&
                    styles.mySuyoCardItemSelected,
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  if (isDoerCancelledEditMode) {
                    handleToggleDoerCancelledSelect(item.id);
                  } else {
                    setSelectedDoerSuyo(item);
                  }
                }}
              >
                <View style={styles.doerCancelledTopRow}>
                  <Text
                    style={styles.doerCancelledTitle}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <View style={styles.doerCancelledBadge}>
                      <Text style={styles.doerCancelledBadgeText}>
                        Cancelled
                      </Text>
                    </View>
                    {isDoerCancelledEditMode && (
                      <View
                        style={[
                          styles.mySuyoSelectionCircle,
                          isSelected && styles.mySuyoSelectionCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={11}
                            color={resolveColor('#FFFFFF', 'color')}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.doerCancelledSub}>
                  Requester: {item.requesterName} •{' '}
                  {item.cancelledAt || 'Recently'}
                </Text>
                <View style={styles.doerCancelledNotice}>
                  <Ionicons
                    name="return-up-back"
                    size={13}
                    color={resolveColor('#6B7280', 'color')}
                  />
                  <Text style={styles.doerCancelledNoticeText}>
                    Released back to public board for other couriers.
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom Edit Action Bar when in Edit Mode */}
        {isDoerCancelledEditMode && (
          <View style={styles.mySuyoEditFloatingBar}>
            <TouchableOpacity
              style={styles.mySuyoCancelEditBtn}
              onPress={() => {
                setIsDoerCancelledEditMode(false);
                setSelectedDoerCancelledIds([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.mySuyoCancelEditText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mySuyoConfirmDeleteBtn,
                selectedDoerCancelledIds.length === 0 &&
                  styles.mySuyoConfirmDeleteBtnDisabled,
              ]}
              onPress={handleConfirmDeleteDoerCancelled}
              disabled={selectedDoerCancelledIds.length === 0}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={
                  selectedDoerCancelledIds.length > 0
                    ? resolveColor('#FFFFFF', 'color')
                    : resolveColor('#8CA395', 'color')
                }
              />
              <Text
                style={[
                  styles.mySuyoConfirmDeleteBtnText,
                  selectedDoerCancelledIds.length === 0 &&
                    styles.mySuyoConfirmDeleteBtnTextDisabled,
                ]}
              >
                {selectedDoerCancelledIds.length > 0
                  ? `Remove Selected (${selectedDoerCancelledIds.length})`
                  : 'Select items to remove'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  );
}
