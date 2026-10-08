import React from 'react';
import { styles } from '../styles/requesterFulfill.styles.js';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RequesterTrackingTimeline({
  currentStepIndex,
  liveDistanceText,
  task,
  timelineTimes,
}) {
  return (
    <View style={styles.trackTraceSection}>
      <View style={styles.trackTraceHeader}>
        <Ionicons
          name="git-network-outline"
          size={18}
          color="#1E4D2B"
        />
        <Text style={styles.trackTraceTitle}>TRACK & TRACE</Text>
      </View>

      <View style={styles.timelineList}>
        {/* Step 4: Drop-off & Completed */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeftColumn}>
            <View
              style={[
                styles.timelineDotCircle,
                currentStepIndex >= 3
                  ? styles.timelineDotCircleCompleted
                  : styles.timelineDotCirclePending,
              ]}
            >
              {currentStepIndex >= 3 && (
                <View style={styles.timelineInnerDotCompleted} />
              )}
            </View>
            <View
              style={[
                styles.timelineVerticalLine,
                currentStepIndex >= 3
                  ? styles.timelineVerticalLineActive
                  : styles.timelineVerticalLineInactive,
              ]}
            />
          </View>

          <View style={styles.timelineContentBlock}>
            <Text
              style={[
                styles.timelineItemTitle,
                currentStepIndex < 3 && styles.timelineItemTitleMuted,
              ]}
            >
              4. Drop off & Complete
            </Text>
            <Text style={styles.timelineItemRoute}>
              RECIPIENT CONFIRMATION → RELEASE ESCROW
            </Text>
            <Text style={styles.timelineItemActor}>
              Delivered at {task.location} Doorstep
            </Text>
            <Text style={styles.timelineItemQuote}>
              "Package delivered. Waiting for your confirmation to complete."
            </Text>
            <Text style={styles.timelineItemTime}>
              {timelineTimes.completed}
            </Text>
          </View>
        </View>

        {/* Step 3: Documents secured & verified */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeftColumn}>
            <View
              style={[
                styles.timelineDotCircle,
                currentStepIndex >= 2
                  ? styles.timelineDotCircleCompleted
                  : styles.timelineDotCirclePending,
              ]}
            >
              {currentStepIndex >= 2 && (
                <View style={styles.timelineInnerDotCompleted} />
              )}
            </View>
            <View
              style={[
                styles.timelineVerticalLine,
                currentStepIndex >= 2
                  ? styles.timelineVerticalLineActive
                  : styles.timelineVerticalLineInactive,
              ]}
            />
          </View>

          <View style={styles.timelineContentBlock}>
            <Text
              style={[
                styles.timelineItemTitle,
                currentStepIndex < 2 && styles.timelineItemTitleMuted,
              ]}
            >
              3. Task items handled & in progress
            </Text>
            <Text style={styles.timelineItemRoute}>
              {task.category.toUpperCase()} CHECKED → SECURE TRANSIT
            </Text>
            <Text style={styles.timelineItemActor}>
              By {task.doerName} • Verified safe handling
            </Text>
            <Text style={styles.timelineItemQuote}>
              "All task items secured and transported carefully."
            </Text>
            <Text style={styles.timelineItemTime}>{timelineTimes.working}</Text>
          </View>
        </View>

        {/* Step 2: En Route */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeftColumn}>
            <View
              style={[
                styles.timelineDotCircle,
                currentStepIndex >= 1
                  ? styles.timelineDotCircleCompleted
                  : styles.timelineDotCirclePending,
              ]}
            >
              {currentStepIndex >= 1 && (
                <View style={styles.timelineInnerDotCompleted} />
              )}
            </View>
            <View
              style={[
                styles.timelineVerticalLine,
                currentStepIndex >= 1
                  ? styles.timelineVerticalLineActive
                  : styles.timelineVerticalLineInactive,
              ]}
            />
          </View>

          <View style={styles.timelineContentBlock}>
            <Text
              style={[
                styles.timelineItemTitle,
                currentStepIndex < 1 && styles.timelineItemTitleMuted,
              ]}
            >
              2. Doer en route to location
            </Text>
            <Text style={styles.timelineItemRoute}>
              IN TRANSIT → {task.location.toUpperCase()}
            </Text>
            <Text style={styles.timelineItemActor}>
              Live GPS tracking active • Distance {liveDistanceText}
            </Text>
            <Text style={styles.timelineItemQuote}>
              "Doer is moving towards the destination address."
            </Text>
            <Text style={styles.timelineItemTime}>{timelineTimes.enRoute}</Text>
          </View>
        </View>

        {/* Step 1: Accepted */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineLeftColumn}>
            <View
              style={[
                styles.timelineDotCircle,
                styles.timelineDotCircleCompleted,
              ]}
            >
              <View style={styles.timelineInnerDotCompleted} />
            </View>
          </View>

          <View style={styles.timelineContentBlock}>
            <Text style={styles.timelineItemTitle}>
              1. Suyo request accepted
            </Text>
            <Text style={styles.timelineItemRoute}>
              DOER MATCHED → TASK INITIATED
            </Text>
            <Text style={styles.timelineItemActor}>
              Assigned: {task.doerName} • SuyoLink Dispatch
            </Text>
            <Text style={styles.timelineItemQuote}>
              "Doer accepted your {task.category.toLowerCase()} suyo. Preparing
              route."
            </Text>
            <Text style={styles.timelineItemTime}>
              {timelineTimes.accepted}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
