import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { createCalendarModalStyles } from './CalendarModal.styles';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createCalendarModalStyles(colors), [colors]);
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
                color={colors.link}
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
                color={colors.textMuted}
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
                color={colors.link}
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
                color={colors.link}
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
