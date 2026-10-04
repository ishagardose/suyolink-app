import { EMPTY } from './requestFormConfig';
import ContactFields from './fields/ContactFields';
import LocationFields from './fields/LocationFields';
import DeadlineFields from './fields/DeadlineFields';
import RewardFields from './fields/RewardFields';
import TaskOverviewFields from './fields/TaskOverviewFields';
import RequestSuccessModal from './RequestSuccessModal';
import useRequestFormStyles from './requestForm.styles';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';

import CalendarModal from './CalendarModal';
import ClockModal from './ClockModal';

export default function RequestForm({ onPosted }) {
  const styles = useRequestFormStyles();
  const { colors } = useTheme();
  const { postRequest, isLoading, error: loadError, reload } = useSuyos();

  const [draft, setDraft] = useState(() => ({
    ...EMPTY,
    deadlineDate: '',
    deadlineTime: '',
    clientReference:
      'post-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2),
  }));

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);

  const scrollViewRef = useRef(null);
  const contactInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const submitting = useRef(false);

  const validateForm = () => {
    const errors = {};

    // 1. Task Title
    if (!draft.title.trim()) {
      errors.title = 'Task title is required';
    }
    if (!draft.category) errors.category = 'Choose a category';
    // 2. Reward Offer
    if (
      !draft.offerAmount ||
      isNaN(parseFloat(draft.offerAmount)) ||
      parseFloat(draft.offerAmount) <= 0
    ) {
      errors.offerAmount = 'Enter a valid reward offer amount';
    }
    // 3. Time and Date Setter
    if (!draft.deadlineDate) {
      errors.deadlineDate = 'Target date is required';
    }
    if (!draft.deadlineTime) {
      errors.deadlineTime = 'Target time is required';
    }
    // 4. Address
    if (!draft.location.trim()) {
      errors.location = 'Address/meeting landmark/Drop off is required';
    }
    if (!draft.publicLocation.trim()) errors.publicLocation = 'Enter a public area or landmark';
    if (!draft.coordinates) errors.coordinates = 'Choose a location pin on the map';
    if (!draft.details.trim()) errors.details = 'Describe what needs to be done';
    // 5. Contact Info
    if (!draft.contactPhone.trim()) {
      errors.contactPhone = 'Contact info is required to post a suyo';
    }

    setFieldErrors(errors);
    return errors;
  };

  const submit = async () => {
    if (submitting.current) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setGeneralError(
        'Please complete all required fields highlighted in red below.'
      );

      // If contact info is missing, lead the user directly back to the contact info input box
      if (errors.contactPhone) {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
          if (contactInputRef.current) {
            contactInputRef.current.focus();
          }
        }, 80);
      } else if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    const combinedDeadline = `${draft.deadlineDate.trim()} ${draft.deadlineTime.trim()}`;

    // Validate deadline is in the future
    try {
      const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(
        combinedDeadline
      );
      if (!match) throw new Error('Invalid deadline date/time format.');
      const [, y, m, d, h, min] = match.map(Number);
      const parsedDate = new Date(y, m - 1, d, h, min);
      if (parsedDate.getTime() <= Date.now()) {
        setFieldErrors((p) => ({
          ...p,
          deadlineTime: 'Deadline must be set in the future',
        }));
        setGeneralError('Please set a deadline time in the future.');
        return;
      }
    } catch {
      setFieldErrors((p) => ({ ...p, deadlineDate: 'Invalid date/time' }));
      setGeneralError('Please enter a valid date and time.');
      return;
    }

    submitting.current = true;
    setBusy(true);
    setGeneralError('');

    try {
      await postRequest({
        ...draft,
        category: draft.category,
        details: draft.details.trim() || draft.title.trim(),
        location: draft.location.trim(),
        publicLocation: draft.publicLocation.trim(),
        exactAddress: draft.location.trim(),
        phone: draft.contactPhone.trim(),
        coordinates: draft.coordinates,
        deadline: combinedDeadline,
        attachments: draft.attachments || [],
        notes: draft.notes.trim(),
      });
      setIsSuccessModalOpen(true);
    } catch (err) {
      setGeneralError(
        err.message || 'Failed to post request. Please check all details.'
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={{ gap: 8, paddingVertical: 8 }}>
            <Text style={{ fontSize: 27, fontWeight: '700', color: colors.text, letterSpacing: -0.6 }}>What do you need?</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textMuted }}>A few clear details help the right person lend a hand.</Text>
          </View>
          {/* GENERAL ERROR BANNER */}
          {generalError ? (
            <View style={styles.generalErrorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* CARD 1: TASK OVERVIEW */}
          <TaskOverviewFields
            fieldErrors={fieldErrors}
            draft={draft}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            busy={busy}
          />

          {/* CARD 3: REWARD OFFER */}
          <RewardFields
            fieldErrors={fieldErrors}
            draft={draft}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            busy={busy}
          />

          {/* CARD 3: COMPLETION DEADLINE (DATE & TIME) */}
          <DeadlineFields
            fieldErrors={fieldErrors}
            dateInputRef={dateInputRef}
            draft={draft}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            busy={busy}
            setIsCalendarOpen={setIsCalendarOpen}
            timeInputRef={timeInputRef}
            setIsClockOpen={setIsClockOpen}
          />

          {/* CARD 4: LOCATION & PIN */}
          <LocationFields
            fieldErrors={fieldErrors}
            draft={draft}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            busy={busy}
          />

          {/* CARD 6: CONTACT INFO & SPECIAL INSTRUCTIONS */}
          <ContactFields
            fieldErrors={fieldErrors}
            contactInputRef={contactInputRef}
            draft={draft}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            busy={busy}
          />

          {/* LOAD ERROR BANNER */}
          {loadError ? (
            <View style={styles.errorCard}>
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color="#DC2626"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorCardText}>{loadError}</Text>
                <TouchableOpacity onPress={reload} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (busy || isLoading) && styles.submitButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Post request"
            onPress={submit}
            disabled={busy || isLoading}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Post Suyo Request • ₱{draft.offerAmount || '0.00'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SUCCESS CONFIRMATION MODAL                                */}
      <RequestSuccessModal
        isSuccessModalOpen={isSuccessModalOpen}
        setIsSuccessModalOpen={setIsSuccessModalOpen}
        onPosted={onPosted}
        draft={draft}
      />

      {/* CALENDAR LOOKALIKE SETTER MODAL                            */}
      <CalendarModal
        visible={isCalendarOpen}
        currentDate={draft.deadlineDate}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={(date) => {
          setDraft((p) => ({ ...p, deadlineDate: date }));
          if (fieldErrors.deadlineDate) {
            setFieldErrors((p) => ({ ...p, deadlineDate: undefined }));
          }
        }}
      />

      {/* CLOCK LOOKALIKE SETTER MODAL                               */}
      <ClockModal
        visible={isClockOpen}
        currentTime={draft.deadlineTime}
        onClose={() => setIsClockOpen(false)}
        onSelectTime={(time) => {
          setDraft((p) => ({ ...p, deadlineTime: time }));
          if (fieldErrors.deadlineTime) {
            setFieldErrors((p) => ({ ...p, deadlineTime: undefined }));
          }
        }}
      />

    </KeyboardAvoidingView>
  );
}
