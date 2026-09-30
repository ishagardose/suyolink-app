import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Geometry constants for the analog clock face
const CLOCK_SIZE = 220;
const RADIUS = 84;
const CENTER = CLOCK_SIZE / 2;

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="time" size={20} color="#1E4D2B" />
              <Text style={styles.headerTitle}>Clock Time Setter</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close clock"
            >
              <Ionicons name="close" size={20} color="#4A6B56" />
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
            {mode === 'hour' ? 'Tap an hour on the clock face' : 'Tap a minute position on the clock face'}
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
                    const isSelected = m === minute || (Math.abs(minute - m) < 3 && minute % 5 !== 0);

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
                {formatted12} <Text style={styles.selectedBadge24}>({formatted24})</Text>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFEA',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F3F8F5',
  },
  digitalDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D4E2DA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  timeSegmentsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeSegmentBtn: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 54,
  },
  timeSegmentBtnActive: {
    backgroundColor: '#1E4D2B',
  },
  timeSegmentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  timeSegmentTextActive: {
    color: '#FFFFFF',
  },
  segmentLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#658071',
    textTransform: 'uppercase',
  },
  timeColon: {
    fontSize: 24,
    fontWeight: '800',
    color: '#163523',
    marginHorizontal: 2,
  },
  periodToggleWrap: {
    flexDirection: 'column',
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#D8E8DF',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3C5C48',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  modeHintText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#658071',
    textAlign: 'center',
    marginBottom: 8,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#F5FAF7',
    borderWidth: 2,
    borderColor: '#D4E2DA',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockOuterRing: {
    position: 'absolute',
    width: CLOCK_SIZE - 20,
    height: CLOCK_SIZE - 20,
    borderRadius: (CLOCK_SIZE - 20) / 2,
    borderWidth: 1,
    borderColor: '#E6EFEA',
    borderStyle: 'dashed',
  },
  clockCenterPin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E4D2B',
    zIndex: 10,
  },
  clockHandContainer: {
    position: 'absolute',
    width: 2,
    height: RADIUS,
    top: CENTER - RADIUS,
    left: CENTER - 1,
    transformOrigin: 'bottom center',
    alignItems: 'center',
    zIndex: 5,
  },
  clockHandLine: {
    width: 2,
    height: RADIUS - 14,
    backgroundColor: '#1E4D2B',
  },
  clockHandTip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  dialNumberBtn: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  dialNumberBtnSelected: {
    backgroundColor: '#1E4D2B',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dialNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#163523',
  },
  dialMinuteText: {
    fontSize: 11.5,
  },
  dialNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  quickMinutesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EFEA',
  },
  minutePresetBtn: {
    flex: 1,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#D8E8DF',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  minutePresetBtnActive: {
    backgroundColor: '#EBF4EF',
    borderColor: '#1E4D2B',
  },
  minutePresetText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2D4E3A',
  },
  minutePresetTextActive: {
    color: '#1E4D2B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  selectedBadge: {
    flex: 1,
  },
  selectedBadgeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#658071',
    textTransform: 'uppercase',
  },
  selectedBadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
  },
  selectedBadge24: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556E60',
  },
  confirmBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
