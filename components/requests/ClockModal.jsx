import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { createClockModalStyles } from './ClockModal.styles';

import { CLOCK_SIZE, RADIUS, CENTER } from './clockGeometry';

// Hours 1 to 12
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// Minute marks: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const parseInitialTime = (timeStr) => {
  if (timeStr && /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour: h, minute: m, period };
  }
  // Default to 12:00 PM (or next rounded hour)
  const now = new Date();
  let h = now.getHours();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return { hour: h, minute: 0, period };
};

export default function ClockModal({
  visible,
  onClose,
  onSelectTime,
  currentTime,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createClockModalStyles(colors), [colors]);
  const initial = useMemo(() => parseInitialTime(currentTime), [currentTime]);

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'

  // Sync state whenever modal opens
  React.useEffect(() => {
    if (visible) {
      const parsed = parseInitialTime(currentTime);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
      setMode('hour');
    }
  }, [visible, currentTime]);

  // Convert 12h + period to 24h string "HH:mm"
  const formatted24 = useMemo(() => {
    let h24 = hour % 12;
    if (period === 'PM') h24 += 12;
    const hh = String(h24).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [hour, minute, period]);

  // Display 12h string "hh:mm AM/PM"
  const formatted12 = useMemo(() => {
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm} ${period}`;
  }, [hour, minute, period]);

  // Handle hour selection: automatically move to minute selection for ultra fast flow
  const handleSelectHour = (h) => {
    setHour(h);
    setMode('minute');
  };

  const handleSelectMinute = (m) => {
    setMinute(m);
  };

  const handleConfirm = () => {
    onSelectTime(formatted24);
    onClose();
  };

  // Clock Hand Angle calculation (in degrees)
  const handAngle = useMemo(() => {
    if (mode === 'hour') {
      return (hour % 12) * 30; // 360 / 12 = 30 deg per hour
    }
    return minute * 6; // 360 / 60 = 6 deg per minute
  }, [mode, hour, minute]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Ionicons
                name="time"
                size={20}
                color={colors.link}
              />
              <Text style={styles.headerTitle}>Clock Time Setter</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close clock"
            >
              <Ionicons
                name="close"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Digital Time & Mode Switcher */}
          <View style={styles.digitalDisplayRow}>
            <View style={styles.timeSegmentsWrap}>
              <TouchableOpacity
                style={[
                  styles.timeSegmentBtn,
                  mode === 'hour' && styles.timeSegmentBtnActive,
                ]}
                onPress={() => setMode('hour')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeSegmentText,
                    mode === 'hour' && styles.timeSegmentTextActive,
                  ]}
                >
                  {String(hour).padStart(2, '0')}
                </Text>
                <Text style={styles.segmentLabel}>Hour</Text>
              </TouchableOpacity>

              <Text style={styles.timeColon}>:</Text>

              <TouchableOpacity
                style={[
                  styles.timeSegmentBtn,
                  mode === 'minute' && styles.timeSegmentBtnActive,
                ]}
                onPress={() => setMode('minute')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeSegmentText,
                    mode === 'minute' && styles.timeSegmentTextActive,
                  ]}
                >
                  {String(minute).padStart(2, '0')}
                </Text>
                <Text style={styles.segmentLabel}>Min</Text>
              </TouchableOpacity>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.periodToggleWrap}>
              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  period === 'AM' && styles.periodBtnActive,
                ]}
                onPress={() => setPeriod('AM')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    period === 'AM' && styles.periodBtnTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  period === 'PM' && styles.periodBtnActive,
                ]}
                onPress={() => setPeriod('PM')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    period === 'PM' && styles.periodBtnTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode Subtitle */}
          <Text style={styles.modeHintText}>
            {mode === 'hour'
              ? 'Tap an hour on the clock face'
              : 'Tap a minute position on the clock face'}
          </Text>

          {/* Analog Clock Face Lookalike */}
          <View style={styles.clockContainer}>
            <View style={styles.clockFace}>
              {/* Outer decorative ring */}
              <View style={styles.clockOuterRing} />

              {/* Clock Hand Pointer */}
              <View
                style={[
                  styles.clockHandContainer,
                  {
                    transform: [{ rotate: `${handAngle}deg` }],
                  },
                ]}
              >
                <View style={styles.clockHandLine} />
                <View style={styles.clockHandTip} />
              </View>

              {/* Center Pin */}
              <View style={styles.clockCenterPin} />

              {/* Numbers on the dial */}
              {mode === 'hour'
                ? HOURS.map((h, i) => {
                    // Position at angle = (i * 30 - 90) deg
                    const angleRad = (i * 30 - 90) * (Math.PI / 180);
                    const x = CENTER + RADIUS * Math.cos(angleRad);
                    const y = CENTER + RADIUS * Math.sin(angleRad);
                    const isSelected = h === hour;

                    return (
                      <TouchableOpacity
                        key={`hour-${h}`}
                        style={[
                          styles.dialNumberBtn,
                          { left: x - 17, top: y - 17 },
                          isSelected && styles.dialNumberBtnSelected,
                        ]}
                        onPress={() => handleSelectHour(h)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dialNumberText,
                            isSelected && styles.dialNumberTextSelected,
                          ]}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : MINUTES.map((m, i) => {
                    const angleRad = (i * 30 - 90) * (Math.PI / 180);
                    const x = CENTER + RADIUS * Math.cos(angleRad);
                    const y = CENTER + RADIUS * Math.sin(angleRad);
                    // Match either exact minute or closest 5-minute bucket
                    const isSelected =
                      m === minute ||
                      (Math.abs(minute - m) < 3 && minute % 5 !== 0);

                    return (
                      <TouchableOpacity
                        key={`min-${m}`}
                        style={[
                          styles.dialNumberBtn,
                          { left: x - 17, top: y - 17 },
                          isSelected && styles.dialNumberBtnSelected,
                        ]}
                        onPress={() => handleSelectMinute(m)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dialNumberText,
                            styles.dialMinuteText,
                            isSelected && styles.dialNumberTextSelected,
                          ]}
                        >
                          {String(m).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
            </View>
          </View>

          {/* Quick Minute Presets */}
          <View style={styles.quickMinutesRow}>
            {[0, 15, 30, 45].map((m) => (
              <TouchableOpacity
                key={`preset-${m}`}
                style={[
                  styles.minutePresetBtn,
                  minute === m && styles.minutePresetBtnActive,
                ]}
                onPress={() => {
                  setMinute(m);
                  setMode('minute');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.minutePresetText,
                    minute === m && styles.minutePresetTextActive,
                  ]}
                >
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer with Summary and Confirm Button */}
          <View style={styles.footerRow}>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeLabel}>Target Time</Text>
              <Text style={styles.selectedBadgeValue}>
                {formatted12}{' '}
                <Text style={styles.selectedBadge24}>({formatted24})</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
