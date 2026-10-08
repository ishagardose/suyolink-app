import React from 'react';
import useRequestTheme from '../useRequestTheme';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RequestDeadlineSection({
  DEADLINE_STATUS_OPTIONS,
  PLACEHOLDER_COLOR,
  busy,
  dateInputRef,
  draft,
  fieldErrors,
  handleSelectStatus,
  selectedStatusConfig,
  setDraft,
  setFieldErrors,
  setIsCalendarOpen,
  setIsClockOpen,
  timeInputRef,
}) {
  const { styles, resolveColor } = useRequestTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="time-outline"
          size={18}
          color={resolveColor('#1E4D2B')}
        />
        <Text style={styles.cardTitle}>Completion Deadline</Text>
      </View>

      <Text style={styles.cardSubText}>
        Set the required target date and time when the suyo must be completed.
      </Text>

      {/* Suyo Status / Priority Picker */}
      <View style={styles.deadlineStatusSection}>
        <View style={styles.deadlineStatusHeaderRow}>
          <Text style={styles.fieldLabel}>Suyo Status / Priority *</Text>
          <View
            style={[
              styles.deadlineStatusActiveTag,
              {
                backgroundColor: resolveColor(
                  selectedStatusConfig.bgColor,
                  'backgroundColor',
                ),
                borderColor: resolveColor(
                  selectedStatusConfig.borderColor,
                  'borderColor',
                ),
              },
            ]}
          >
            <Ionicons
              name={selectedStatusConfig.icon}
              size={11}
              color={resolveColor(selectedStatusConfig.color)}
            />
            <Text
              style={[
                styles.deadlineStatusActiveTagText,
                { color: resolveColor(selectedStatusConfig.color) },
              ]}
            >
              {selectedStatusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.deadlineStatusSubtitle}>
          Choose a completion status for couriers to prioritize your task:
        </Text>

        {/* Status Chips */}
        <View style={styles.deadlineStatusChipsGrid}>
          {DEADLINE_STATUS_OPTIONS.map((opt) => {
            const isSelected = (draft.urgency || 'Normal') === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.deadlineStatusChip,
                  isSelected && {
                    backgroundColor: opt.activeBg,
                    borderColor: opt.activeBg,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelectStatus(opt)}
                disabled={busy}
              >
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={
                    isSelected
                      ? resolveColor('#FFFFFF')
                      : resolveColor(opt.color)
                  }
                />
                <Text
                  style={[
                    styles.deadlineStatusChipText,
                    isSelected && styles.deadlineStatusChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Description Box */}
        <View
          style={[
            styles.deadlineStatusExplainer,
            {
              backgroundColor: resolveColor(
                selectedStatusConfig.bgColor,
                'backgroundColor',
              ),
              borderColor: resolveColor(
                selectedStatusConfig.borderColor,
                'borderColor',
              ),
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={15}
            color={resolveColor(selectedStatusConfig.color)}
          />
          <Text
            style={[
              styles.deadlineStatusExplainerText,
              {
                color: resolveColor(
                  selectedStatusConfig.textColor || selectedStatusConfig.color,
                ),
              },
            ]}
          >
            {selectedStatusConfig.description}
          </Text>
        </View>
      </View>

      {/* Separate Date and Time Inputs */}
      <View style={styles.dateTimeRow}>
        {/* Date Input Box with Calendar Icon */}
        <View style={styles.dateTimeCol}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.deadlineDate && styles.fieldLabelError,
            ]}
          >
            Target Date *
          </Text>
          <View
            style={[
              styles.dateTimeInputWrapper,
              fieldErrors.deadlineDate && styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={dateInputRef}
              style={styles.textInputInner}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={resolveColor(PLACEHOLDER_COLOR)}
              value={draft.deadlineDate}
              onChangeText={(val) => {
                setDraft((p) => ({ ...p, deadlineDate: val }));
                if (fieldErrors.deadlineDate)
                  setFieldErrors((p) => ({
                    ...p,
                    deadlineDate: undefined,
                  }));
              }}
              maxLength={10}
              editable={!busy}
            />
            <TouchableOpacity
              style={styles.pickerTrailingButton}
              activeOpacity={0.65}
              onPress={() => setIsCalendarOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open calendar date setter"
            >
              <Ionicons
                name="calendar-outline"
                size={19}
                color={
                  fieldErrors.deadlineDate
                    ? resolveColor('#DC2626')
                    : resolveColor('#1E4D2B')
                }
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.deadlineDate && (
            <Text style={styles.fieldErrorText}>
              {fieldErrors.deadlineDate}
            </Text>
          )}
        </View>

        {/* Time Input Box with Clock Icon on the right */}
        <View style={styles.dateTimeCol}>
          <Text
            style={[
              styles.fieldLabel,
              fieldErrors.deadlineTime && styles.fieldLabelError,
            ]}
          >
            Target Time *
          </Text>
          <View
            style={[
              styles.dateTimeInputWrapper,
              fieldErrors.deadlineTime && styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={timeInputRef}
              style={styles.textInputInner}
              placeholder="HH:mm"
              placeholderTextColor={resolveColor(PLACEHOLDER_COLOR)}
              value={draft.deadlineTime}
              onChangeText={(val) => {
                setDraft((p) => ({ ...p, deadlineTime: val }));
                if (fieldErrors.deadlineTime)
                  setFieldErrors((p) => ({
                    ...p,
                    deadlineTime: undefined,
                  }));
              }}
              maxLength={5}
              editable={!busy}
            />
            <TouchableOpacity
              style={styles.pickerTrailingButton}
              activeOpacity={0.65}
              onPress={() => setIsClockOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Open clock time setter"
            >
              <Ionicons
                name="time-outline"
                size={19}
                color={
                  fieldErrors.deadlineTime
                    ? resolveColor('#DC2626')
                    : resolveColor('#1E4D2B')
                }
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.deadlineTime && (
            <Text style={styles.fieldErrorText}>
              {fieldErrors.deadlineTime}
            </Text>
          )}
        </View>
      </View>

      {draft.deadlineDate && draft.deadlineTime ? (
        <View style={styles.deadlineContainerPill}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={resolveColor('#1E4D2B')}
          />
          <Text style={styles.deadlinePillText}>
            Scheduled Deadline: {draft.deadlineDate} at {draft.deadlineTime}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
