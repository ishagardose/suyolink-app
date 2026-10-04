import { useTheme } from '../../../theme/ThemeContext';
import { PLACEHOLDER_COLOR } from '../requestFormConfig';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import useRequestFormStyles from '../requestForm.styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function DeadlineFields({
  fieldErrors,
  dateInputRef,
  draft,
  setDraft,
  setFieldErrors,
  busy,
  setIsCalendarOpen,
  timeInputRef,
  setIsClockOpen,
}) {
  const styles = useRequestFormStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons name="time-outline" size={18} color={colors.link} />
        <Text style={styles.cardTitle}>Completion Deadline</Text>
      </View>

      <Text style={styles.cardSubText}>
        Set the required target date and time when the suyo must be completed.
      </Text>

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
              placeholderTextColor={colors.muted}
              accessibilityLabel="Target date" value={draft.deadlineDate}
              onChangeText={(val) => {
                setDraft((p) => ({ ...p, deadlineDate: val }));
                if (fieldErrors.deadlineDate)
                  setFieldErrors((p) => ({ ...p, deadlineDate: undefined }));
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
                color={fieldErrors.deadlineDate ? colors.danger : colors.link}
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
              placeholderTextColor={colors.muted}
              accessibilityLabel="Target time" value={draft.deadlineTime}
              onChangeText={(val) => {
                setDraft((p) => ({ ...p, deadlineTime: val }));
                if (fieldErrors.deadlineTime)
                  setFieldErrors((p) => ({ ...p, deadlineTime: undefined }));
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
                color={fieldErrors.deadlineTime ? colors.danger : colors.link}
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
          <Ionicons name="checkmark-circle" size={14} color={colors.link} />
          <Text style={styles.deadlinePillText}>
            Scheduled Deadline: {draft.deadlineDate} at {draft.deadlineTime}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
