import useRequestAttachments from './hooks/useRequestAttachments.js';
import {
  EMPTY,
  CATEGORY_ICONS,
  QUICK_PRESETS,
  REWARD_PRESETS,
  PLACEHOLDER_COLOR,
  DEADLINE_STATUS_OPTIONS,
} from './data/requestFormConfig.js';
import RequestCategorySection from './sections/RequestCategorySection';
import RequestDetailsSection from './sections/RequestDetailsSection';
import RequestRewardSection from './sections/RequestRewardSection';
import RequestDeadlineSection from './sections/RequestDeadlineSection';
import RequestContactSection from './sections/RequestContactSection';
import RequestSuccessModal from './modals/RequestSuccessModal';
import { styles } from './RequestForm.styles';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';

import LocationPicker from './LocationPicker';

import CalendarModal from './CalendarModal';
import ClockModal from './ClockModal';

export default function RequestForm({ onPosted }) {
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
  const [previewImage, setPreviewImage] = useState(null);

  const scrollViewRef = useRef(null);
  const contactInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const submitting = useRef(false);

  const selectedStatusConfig =
    DEADLINE_STATUS_OPTIONS.find(
      (opt) => opt.key === (draft.urgency || 'Normal'),
    ) || DEADLINE_STATUS_OPTIONS[3];

  const handleSelectStatus = (opt) => {
    setDraft((p) => {
      const next = { ...p, urgency: opt.key };
      const now = new Date();
      if (opt.key === 'Due today' || opt.key === 'Urgent') {
        if (!p.deadlineDate) {
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const d = String(now.getDate()).padStart(2, '0');
          next.deadlineDate = `${y}-${m}-${d}`;
        }
        if (opt.key === 'Urgent' && !p.deadlineTime) {
          const urgentTime = new Date(Date.now() + 2 * 3600000);
          const h = String(urgentTime.getHours()).padStart(2, '0');
          const min = String(urgentTime.getMinutes()).padStart(2, '0');
          next.deadlineTime = `${h}:${min}`;
        }
      } else if (opt.key === 'Due tomorrow') {
        const tomorrow = new Date(Date.now() + 86400000);
        const y = tomorrow.getFullYear();
        const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        next.deadlineDate = `${y}-${m}-${d}`;
        if (!p.deadlineTime) {
          next.deadlineTime = '17:00';
        }
      }
      return next;
    });
  };

  const {
    attachmentLoading,
    formatFileSize,
    handleAttachFiles,
    handlePickFromCamera,
    handlePickFromGallery,
    handleRemoveAttachment,
  } = useRequestAttachments({ draft, setDraft });

  const handleSelectPreset = (preset) => {
    if (preset.isCreate) {
      // Clear/reset draft so user can customize everything from scratch
      setDraft({
        ...EMPTY,
        deadlineDate: '',
        deadlineTime: '',
        clientReference:
          'post-' +
          Date.now().toString(36) +
          '-' +
          Math.random().toString(36).slice(2),
      });
      setFieldErrors({});
      setGeneralError('');
      return;
    }

    setDraft((prev) => ({
      ...prev,
      title: preset.title,
      category: preset.category,
      offerAmount: preset.offerAmount,
      details: preset.details,
    }));
    // Clear errors on populated fields
    setFieldErrors((prev) => ({
      ...prev,
      title: undefined,
      category: undefined,
      offerAmount: undefined,
      details: undefined,
    }));
  };

  const validateForm = () => {
    const errors = {};

    // 1. Task Title
    if (!draft.title.trim()) {
      errors.title = 'Task title is required';
    }
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
        'Please complete all required fields highlighted in red below.',
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

    let deadlineIso = combinedDeadline;
    // Validate deadline is in the future
    try {
      const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(
        combinedDeadline,
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
      deadlineIso = parsedDate.toISOString();
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
        category: draft.category || 'Delivery',
        details: draft.details.trim() || draft.title.trim(),
        location: draft.location.trim(),
        publicLocation: draft.location.trim(),
        exactAddress: draft.location.trim(),
        phone: draft.contactPhone.trim() || draft.phone || 'N/A',
        coordinates: draft.coordinates || {
          latitude: 7.4475,
          longitude: 125.8078,
        },
        deadline: combinedDeadline,
        attachments: draft.attachments || [],
        notes: [
          draft.urgency ? `[Status: ${draft.urgency}]` : '',
          draft.contactPhone
            ? `Contact Phone: ${draft.contactPhone.trim()}`
            : '',
          draft.notes || '',
        ]
          .filter(Boolean)
          .join('\n')
          .trim(),
      });
      setIsSuccessModalOpen(true);
    } catch (err) {
      setGeneralError(
        err.message || 'Failed to post request. Please check all details.',
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
          {/* TOP BANNER */}
          <View style={styles.heroBanner}>
            <View style={styles.heroIconBadge}>
              <Ionicons
                name="sparkles"
                size={20}
                color="#1E4D2B"
              />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Post a Suyo Request</Text>
              <Text style={styles.heroSub}>
                Fill out your task details, reward offer, and meeting location.
                Verified community doers will be alerted immediately.
              </Text>
            </View>
          </View>

          {/* QUICK SUGGESTION PRESETS */}
          <View style={styles.templatesBlock}>
            <Text style={styles.templatesHeader}>Quick Suggestions:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesScroll}
            >
              {QUICK_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.key}
                  style={[
                    styles.templateChip,
                    preset.isCreate && styles.templateChipCreate,
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.templateChipText,
                      preset.isCreate && styles.templateChipCreateText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* GENERAL ERROR BANNER */}
          {generalError ? (
            <View style={styles.generalErrorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color="#DC2626"
              />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* CARD 1: TASK OVERVIEW */}
          <RequestCategorySection
            CATEGORY_ICONS={CATEGORY_ICONS}
            PLACEHOLDER_COLOR={PLACEHOLDER_COLOR}
            busy={busy}
            draft={draft}
            fieldErrors={fieldErrors}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
          />

          {/* CARD 2: PHOTOS & FILE ATTACHMENTS (CAMERA, GALLERY, DOCUMENTS) */}
          <RequestDetailsSection
            attachmentLoading={attachmentLoading}
            busy={busy}
            draft={draft}
            formatFileSize={formatFileSize}
            handleAttachFiles={handleAttachFiles}
            handlePickFromCamera={handlePickFromCamera}
            handlePickFromGallery={handlePickFromGallery}
            handleRemoveAttachment={handleRemoveAttachment}
            setPreviewImage={setPreviewImage}
          />

          {/* CARD 3: REWARD OFFER */}
          <RequestRewardSection
            PLACEHOLDER_COLOR={PLACEHOLDER_COLOR}
            REWARD_PRESETS={REWARD_PRESETS}
            busy={busy}
            draft={draft}
            fieldErrors={fieldErrors}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
          />

          {/* CARD 3: COMPLETION DEADLINE (DATE & TIME) */}
          <RequestDeadlineSection
            DEADLINE_STATUS_OPTIONS={DEADLINE_STATUS_OPTIONS}
            PLACEHOLDER_COLOR={PLACEHOLDER_COLOR}
            busy={busy}
            dateInputRef={dateInputRef}
            draft={draft}
            fieldErrors={fieldErrors}
            handleSelectStatus={handleSelectStatus}
            selectedStatusConfig={selectedStatusConfig}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
            setIsCalendarOpen={setIsCalendarOpen}
            setIsClockOpen={setIsClockOpen}
            timeInputRef={timeInputRef}
          />

          {/* CARD 4: LOCATION & PIN */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#1E4D2B"
              />
              <Text style={styles.cardTitle}>Location & Map Pin</Text>
            </View>

            {/* Address / Meeting landmark / Drop off */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    fieldErrors.location && styles.fieldLabelError,
                  ]}
                >
                  Address/meeting landmark/Drop off *
                </Text>
                <Text style={styles.counterText}>
                  {draft.location.length}/250
                </Text>
              </View>
              <View
                style={[
                  styles.inputWithIcon,
                  fieldErrors.location && styles.inputErrorBorder,
                ]}
              >
                <Ionicons
                  name="location-sharp"
                  size={18}
                  color={fieldErrors.location ? '#DC2626' : '#1E4D2B'}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.textInputInner}
                  placeholder="Address, landmark, or drop-off..."
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.location}
                  onChangeText={(val) => {
                    setDraft((p) => ({ ...p, location: val }));
                    if (fieldErrors.location)
                      setFieldErrors((p) => ({ ...p, location: undefined }));
                  }}
                  maxLength={250}
                  editable={!busy}
                />
              </View>
              {fieldErrors.location && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.location}
                </Text>
              )}
            </View>

            {/* Map Pin Picker */}
            <LocationPicker
              value={draft.coordinates}
              disabled={busy}
              onChange={(coordinates) => {
                setDraft((previous) => ({ ...previous, coordinates }));
              }}
            />
          </View>

          {/* CARD 6: CONTACT INFO & SPECIAL INSTRUCTIONS */}
          <RequestContactSection
            PLACEHOLDER_COLOR={PLACEHOLDER_COLOR}
            busy={busy}
            contactInputRef={contactInputRef}
            draft={draft}
            fieldErrors={fieldErrors}
            setDraft={setDraft}
            setFieldErrors={setFieldErrors}
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
                <TouchableOpacity
                  onPress={reload}
                  style={styles.retryBtn}
                >
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
            onPress={submit}
            disabled={busy || isLoading}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="paper-plane"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>
                  Post Suyo Request • ₱{draft.offerAmount || '0.00'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========================================================== */}
      {/* SUCCESS CONFIRMATION MODAL                                */}
      {/* ========================================================== */}
      <RequestSuccessModal
        draft={draft}
        isSuccessModalOpen={isSuccessModalOpen}
        onPosted={onPosted}
        setIsSuccessModalOpen={setIsSuccessModalOpen}
      />

      {/* ========================================================== */}
      {/* CALENDAR LOOKALIKE SETTER MODAL                            */}
      {/* ========================================================== */}
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

      {/* ========================================================== */}
      {/* CLOCK LOOKALIKE SETTER MODAL                               */}
      {/* ========================================================== */}
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

      {/* ========================================================== */}
      {/* FULLSCREEN IMAGE PREVIEW MODAL                             */}
      {/* ========================================================== */}
      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.imagePreviewModalBackdrop}>
            <TouchableOpacity
              style={styles.imagePreviewCloseBtn}
              onPress={() => setPreviewImage(null)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="close"
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
