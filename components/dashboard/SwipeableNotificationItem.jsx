import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './legacyDashboard.styles';
import { SCREEN_WIDTH, USE_NATIVE_DRIVER } from './legacyDashboardLayout';

export default function SwipeableNotificationItem({
  item,
  onPress,
  onMarkRead,
  onRemove,
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
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
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start(() => {
            onRemove(item.id);
          });
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

  const handleManualDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      onRemove(item.id);
    });
  };

  return (
    <View style={styles.notifSwipeContainer}>
      <TouchableOpacity
        style={styles.notifDeleteActionBg}
        activeOpacity={0.8}
        onPress={handleManualDelete}
      >
        <Ionicons
          name="trash"
          size={20}
          color="#FFFFFF"
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
                    ? '#1E4D2B'
                    : item.category === 'task'
                      ? '#059669'
                      : item.category === 'payment'
                        ? '#D97706'
                        : '#0D9488'
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
                  Tap to view fulfillment →
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
                    accessibilityLabel="Mark read"
                  >
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color="#1E4D2B"
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
                  accessibilityLabel="Remove notification"
                >
                  <Ionicons
                    name="trash-outline"
                    size={12}
                    color="#94A3B8"
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
