import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS_3 = [
  { step: 1, label: 'Code Verification', ratio: 0.18 },
  { step: 2, label: 'ID Verification', ratio: 0.54 },
  { step: 3, label: 'Role Selection', ratio: 0.90 },
];

const STEPS_4 = [
  { step: 1, label: 'Code Verification', ratio: 0.15 },
  { step: 2, label: 'ID Verification', ratio: 0.40 },
  { step: 3, label: 'Account Setup', ratio: 0.65 },
  { step: 4, label: 'Role Selection', ratio: 0.90 },
];

export default function WalkingProgressFooter({ step = 1, totalSteps = 3, label }) {
  const stepsConfig = totalSteps === 4 ? STEPS_4 : STEPS_3;
  const clampedStep = Math.min(Math.max(step, 1), stepsConfig.length);
  const currentConfig = stepsConfig[clampedStep - 1];
  const targetRatio = currentConfig.ratio;
  const displayLabel = label || currentConfig.label;

  // Track progress line animated width
  const progressAnim = useRef(new Animated.Value(targetRatio)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: targetRatio,
      tension: 38,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [clampedStep, targetRatio]);

  const progressPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Step info pill */}
      <View style={styles.stepInfoRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {clampedStep} of {stepsConfig.length}
          </Text>
        </View>
        <Text style={styles.stepTitleText}>{displayLabel}</Text>
      </View>

      {/* Clean Progress Road Track Area */}
      <View style={styles.trackContainer}>
        {/* Road Base Line */}
        <View style={styles.roadBaseLine} />

        {/* Completed Progress Road Line */}
        <Animated.View
          style={[
            styles.roadActiveLine,
            { width: progressPercent },
          ]}
        />

        {/* Milestone Dots */}
        <View style={styles.milestonesRow}>
          {stepsConfig.map((item) => {
            const isCompleted = item.step <= clampedStep;
            const isCurrent = item.step === clampedStep;

            return (
              <View
                key={item.step}
                style={[
                  styles.milestoneDot,
                  isCompleted && styles.milestoneDotCompleted,
                  isCurrent && styles.milestoneDotCurrent,
                ]}
              >
                {isCompleted && (
                  <Ionicons
                    name={item.step < clampedStep ? 'checkmark' : 'ellipse'}
                    size={item.step < clampedStep ? 9 : 6}
                    color="#FFFFFF"
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Destination Flag Icon at the end */}
        <View style={styles.flagContainer}>
          <Ionicons
            name="flag"
            size={14}
            color={clampedStep === stepsConfig.length ? '#1E4D2B' : '#A3C4B1'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBF2EE',
  },
  stepInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepBadge: {
    backgroundColor: '#E8F3ED',
    paddingVertical: 3.5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6DFD1',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4D2B',
    letterSpacing: 0.2,
  },
  stepTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C7667',
  },
  trackContainer: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  roadBaseLine: {
    position: 'absolute',
    left: 0,
    right: 24,
    height: 5,
    backgroundColor: '#E4EDE8',
    borderRadius: 3,
  },
  roadActiveLine: {
    position: 'absolute',
    left: 0,
    height: 5,
    backgroundColor: '#1E4D2B',
    borderRadius: 3,
    maxWidth: '92%',
  },
  milestonesRow: {
    position: 'absolute',
    left: 0,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E4EDE8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDotCompleted: {
    backgroundColor: '#1E4D2B',
  },
  milestoneDotCurrent: {
    transform: [{ scale: 1.2 }],
    backgroundColor: '#1E4D2B',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  flagContainer: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
