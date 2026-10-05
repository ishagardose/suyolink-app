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

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatYMD = (year, month, day) => {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarModal({
  visible,
  onClose,
  onSelectDate,
  currentDate,
}) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(
    () => formatYMD(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  // Initialize selected and view dates
  const initialDate = useMemo(() => {
    if (currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      const [y, m, d] = currentDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [currentDate]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedYMD, setSelectedYMD] = useState(() => currentDate || todayStr);

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      if (currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
        const [y, m, d] = currentDate.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedYMD(currentDate);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setSelectedYMD(todayStr);
      }
    }
  }, [visible, currentDate, todayStr]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar cells computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        ymd: formatYMD(
          viewMonth === 0 ? viewYear - 1 : viewYear,
          viewMonth === 0 ? 11 : viewMonth - 1,
          daysInPrevMonth - i,
        ),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        ymd: formatYMD(viewYear, viewMonth, i),
      });
    }

    // Trailing days from next month to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        ymd: formatYMD(
          viewMonth === 11 ? viewYear + 1 : viewYear,
          viewMonth === 11 ? 0 : viewMonth + 1,
          i,
        ),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (ymd) => {
    setSelectedYMD(ymd);
  };

  const handleConfirm = () => {
    if (selectedYMD) {
      onSelectDate(selectedYMD);
    }
    onClose();
  };

  const setQuickOffset = (offsetDays) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const targetYMD = formatYMD(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
    );
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedYMD(targetYMD);
  };

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
                name="calendar"
                size={20}
                color="#1E4D2B"
              />
              <Text style={styles.headerTitle}>Select Target Date</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close calendar"
            >
              <Ionicons
                name="close"
                size={20}
                color="#4A6B56"
              />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={prevMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
              accessibilityLabel="Previous month"
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color="#1E4D2B"
              />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#1E4D2B"
              />
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  (idx === 0 || idx === 6) && styles.weekendText,
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const isSelected = item.ymd === selectedYMD;
              const isToday = item.ymd === todayStr;
              const isPast = item.ymd < todayStr;

              return (
                <TouchableOpacity
                  key={`${item.ymd}-${index}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() =>
                    item.isCurrentMonth && handleSelectDay(item.ymd)
                  }
                  disabled={!item.isCurrentMonth}
                  activeOpacity={0.65}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !item.isCurrentMonth && styles.dayTextMuted,
                      isPast && item.isCurrentMonth && styles.dayTextPast,
                      isToday && !isSelected && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {item.day}
                  </Text>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.quickShortcutsRow}>
            <TouchableOpacity
              style={[
                styles.shortcutChip,
                selectedYMD === todayStr && styles.shortcutChipActive,
              ]}
              onPress={() => setQuickOffset(0)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.shortcutText,
                  selectedYMD === todayStr && styles.shortcutTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => setQuickOffset(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.shortcutText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => setQuickOffset(2)}
              activeOpacity={0.7}
            >
              <Text style={styles.shortcutText}>+2 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => setQuickOffset(7)}
              activeOpacity={0.7}
            >
              <Text style={styles.shortcutText}>+1 Week</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Date Preview & Confirm */}
          <View style={styles.footerRow}>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeLabel}>Selected Date:</Text>
              <Text style={styles.selectedBadgeValue}>
                {selectedYMD || 'None'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Set Date</Text>
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
    maxWidth: 360,
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
    marginBottom: 14,
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
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#658071',
  },
  weekendText: {
    color: '#95AFA0',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#1E4D2B',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#1E4D2B',
    backgroundColor: '#F2F8F4',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#163523',
  },
  dayTextMuted: {
    color: '#D4E2DA',
  },
  dayTextPast: {
    color: '#A0B4A9',
  },
  dayTextToday: {
    fontWeight: '800',
    color: '#1E4D2B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E4D2B',
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E6EFEA',
  },
  shortcutChip: {
    flex: 1,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#D8E8DF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  shortcutChipActive: {
    backgroundColor: '#EBF4EF',
    borderColor: '#1E4D2B',
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D4E3A',
  },
  shortcutTextActive: {
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
