import React from 'react';

import { USE_NATIVE_DRIVER } from '../utils/dashboardLayout';
import { useState, useRef } from 'react';
import { Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function useDashboardToast({
  bottomInset,
  resolveColor,
  styles,
}) {
  const [toastConfig, setToastConfig] = useState(null);

  const toastAnim = useRef(new Animated.Value(0)).current;

  const toastTimerRef = useRef(null);

  const triggerToast = (message, icon = 'heart') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastAnim.setValue(0);
    setToastConfig({ message, icon });
    Animated.spring(toastAnim, {
      toValue: 1,
      tension: 75,
      friction: 8,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setToastConfig(null);
      });
    }, 2800);
  };

  const renderFooterToast = (overrideStyle = null) => {
    if (!toastConfig) return null;
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.globalPoppingToastWrapper,
          {
            bottom: 74 + bottomInset,
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              {
                scale: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
          overrideStyle,
        ]}
      >
        <View style={styles.poppingToastContent}>
          <View style={styles.poppingToastIconCircle}>
            <Ionicons
              name={
                toastConfig.icon === 'heart'
                  ? 'heart'
                  : toastConfig.icon === 'heart-dislike'
                    ? 'heart-dislike'
                    : toastConfig.icon === 'bookmark'
                      ? 'bookmark'
                      : toastConfig.icon === 'trash-outline' ||
                          toastConfig.icon === 'trash'
                        ? 'trash'
                        : toastConfig.icon === 'paper-plane'
                          ? 'paper-plane'
                          : toastConfig.icon === 'close-circle'
                            ? 'close-circle'
                            : 'checkmark-circle'
              }
              size={15}
              color={resolveColor('#FFFFFF', 'color')}
            />
          </View>
          <Text style={styles.poppingToastText}>{toastConfig.message}</Text>
        </View>
      </Animated.View>
    );
  };
  return { renderFooterToast, setToastConfig, toastConfig, triggerToast };
}
