import React, { useRef, useMemo } from 'react';
import {
  Animated,
  PanResponder,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createDashboardStyles } from './dashboard.styles';
import { useTheme } from '../../theme/ThemeContext';
import { resolvePaletteColor } from '../../theme/paletteAdapter';
import { SCREEN_WIDTH, USE_NATIVE_DRIVER } from './dashboardLayout';

export default function SwipeableNotificationItem({
  item,
  onPress,
  onMarkRead,
  onRemove,
  disabled = false,
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, isDark),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  const translateX = useRef(new Animated.Value(0)).current;

  const removing = useRef(false);
  const latest = useRef({ onRemove, disabled, id: item.id });
  latest.current = { onRemove, disabled, id: item.id };
  const resetPosition = () =>
    Animated.spring(translateX, {
      toValue: 0,
      friction: 7,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  const handleManualDelete = () => {
    if (latest.current.disabled || removing.current) return;
    removing.current = true;
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(async () => {
      try {
        const success = await latest.current.onRemove(latest.current.id);
        if (!success) resetPosition();
      } catch (_) {
        resetPosition();
      } finally {
        removing.current = false;
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !latest.current.disabled &&
          !removing.current &&
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -200));
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -70 || gestureState.vx < -0.45) {
          handleManualDelete();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.notifSwipeContainer}>
      <TouchableOpacity
        style={styles.notifDeleteActionBg}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={handleManualDelete}
      >
        <Ionicons
          name="trash"
          size={20}
          color={resolveColor('#FFFFFF', 'color')}
        />
        <Text style={styles.notifDeleteActionText}>Remove</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.notifCardItem,
          item.unread && styles.notifCardItemUnread,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.notifCardInnerTouch}
          activeOpacity={0.88}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}: ${item.body}`}
          onPress={() => onPress(item)}
        >
          <View style={styles.notifCardLeftCol}>
            <View
              style={[
                styles.notifIconCircle,
                item.category === 'doer'
                  ? styles.notifIconDoer
                  : item.category === 'task'
                    ? styles.notifIconTask
                    : item.category === 'payment'
                      ? styles.notifIconPayment
                      : styles.notifIconNearby,
              ]}
            >
              <Ionicons
                name={item.icon || 'notifications'}
                size={15}
                color={
                  item.category === 'doer'
                    ? resolveColor('#1E4D2B', 'color')
                    : item.category === 'task'
                      ? resolveColor('#059669', 'color')
                      : item.category === 'payment'
                        ? resolveColor('#D97706', 'color')
                        : resolveColor('#0D9488', 'color')
                }
              />
            </View>
          </View>

          <View style={styles.notifCardContentCol}>
            <View style={styles.notifCardTitleRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                }}
              >
                <Text
                  style={styles.notifCardTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </View>
              <Text style={styles.notifCardTime}>{item.time}</Text>
            </View>

            <Text
              style={styles.notifCardBody}
              numberOfLines={2}
            >
              {item.body}
            </Text>

            <View style={styles.notifCardBottomActionRow}>
              {item.targetScreen ? (
                <Text style={styles.notifActionLinkText}>
                  Tap to view request →
                </Text>
              ) : (
                <Text style={styles.notifSwipeHintText}>
                  ⇦ Swipe left to remove
                </Text>
              )}

              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                {item.unread && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onMarkRead(item.id);
                    }}
                    style={styles.notifMarkSingleReadBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel="Mark read"
                  >
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={resolveColor('#1E4D2B', 'color')}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleManualDelete();
                  }}
                  style={styles.notifTrashIconBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel="Remove notification"
                >
                  <Ionicons
                    name="trash-outline"
                    size={12}
                    color={resolveColor('#94A3B8', 'color')}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
