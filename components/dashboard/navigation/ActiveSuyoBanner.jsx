import React from 'react';
import { Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ActiveSuyoBanner({
  activeSuyo,
  bottomInset,
  hasActiveSuyo,
  resolveColor,
  router,
  styles,
}) {
  return (
    hasActiveSuyo && (
      <View
        style={[
          styles.floatingActiveModalWrapper,
          { bottom: 62 + bottomInset },
          Platform.OS === 'web' ? { pointerEvents: 'box-none' } : undefined,
        ]}
        pointerEvents={Platform.OS === 'web' ? undefined : 'box-none'}
      >
        <TouchableOpacity
          style={styles.floatingActiveModalTouchable}
          activeOpacity={0.92}
          onPress={() =>
            router.push({
              pathname: '/map',
              params: { requestId: activeSuyo.id },
            })
          }
        >
          <LinearGradient
            colors={['#E5F4EC', '#F4FAF6'].map((value) =>
              resolveColor(value, 'backgroundColor'),
            )}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingActiveModalGradient}
          >
            <View style={styles.floatingModalTopRow}>
              <View style={styles.floatingActiveBadge}>
                <View style={styles.pulsingGreenDot} />
                <Text style={styles.floatingActiveBadgeText}>ACTIVE SUYO</Text>
              </View>
              <View style={styles.floatingTrackingTag}>
                <Ionicons
                  name="map-outline"
                  size={11.5}
                  color={resolveColor('#1E4D2B', 'color')}
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.floatingTrackingText}>
                  {activeSuyo.trackingNumber}
                </Text>
              </View>
            </View>

            <View style={styles.floatingModalBodyRow}>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text
                  style={styles.floatingModalTitle}
                  numberOfLines={1}
                >
                  {activeSuyo.eta}
                  <Text style={styles.floatingModalSub}>
                    {' '}
                    • {activeSuyo.detail}
                  </Text>
                </Text>
              </View>
              <View style={styles.floatingModalChevronCircle}>
                <Ionicons
                  name="chevron-forward"
                  size={13}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </View>
            </View>

            <View style={styles.floatingProgressTrack}>
              <View
                style={[
                  styles.floatingProgressFill,
                  { width: activeSuyo.progress || '75%' },
                ]}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  );
}
