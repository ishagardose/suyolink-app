import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useSuyos } from '../../context/SuyoContext';
import { CATEGORIES } from '../../data/suyoRequests';
import LocationPicker from './LocationPicker';
import { localDeadline } from '../../lib/deadline';
import CalendarModal from './CalendarModal';
import ClockModal from './ClockModal';

const EMPTY = {
  title: '',
  details: '',
  category: '',
  offerAmount: '',
  deadlineDate: '',
  deadlineTime: '',
  location: '',
  publicLocation: '',
  exactAddress: '',
  contactPhone: '',
  phone: '',
  coordinates: null,
  notes: '',
};

const CATEGORY_ICONS = {
  Delivery: 'bicycle-outline',
  Groceries: 'cart-outline',
  Documents: 'document-attach-outline',
  'Queuing & Bills': 'receipt-outline',
  Household: 'home-outline',
  Other: 'cube-outline',
};

const QUICK_PRESETS = [
  {
    key: 'custom',
    label: '✨ Custom / Create',
    isCreate: true,
  },
  {
    key: 'groceries',
    label: '🛒 Groceries',
    title: 'Buy groceries at supermarket',
    category: 'Groceries',
    offerAmount: '150.00',
    details: 'Pick up eggs, fresh bread, and 2 cartons of milk from local supermarket.',
  },
  {
    key: 'documents',
    label: '📄 Documents',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    offerAmount: '300.00',
    details: 'Deliver notarized agreements and legal documents to Unit 402 reception desk.',
  },
  {
    key: 'bills',
    label: '🧾 Bills Payment',
    title: 'Queue for bills payment',
    category: 'Queuing & Bills',
    offerAmount: '120.00',
    details: 'Line up at Bayad Center to pay monthly utility bill. Cash and bill slip are prepared.',
  },
  {
    key: 'pickup_deliver',
    label: '🛵 Pickup & Deliver',
    title: 'Pickup & Deliver items',
    category: 'Delivery',
    offerAmount: '180.00',
    details: 'Collect pre-ordered package from branch and safely deliver to destination address.',
  },
];

const REWARD_PRESETS = ['100.00', '150.00', '200.00', '300.00'];

const PLACEHOLDER_COLOR = '#688676';

// Helper to get formatted default today & time +3 hours
const getInitialDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getInitialTime = () => {
  const now = new Date(Date.now() + 3 * 3600000);
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

export default function RequestForm({ onPosted }) {
  const { colors } = useTheme();
  const { postRequest, isLoading, error: loadError, reload } = useSuyos();

  const [draft, setDraft] = useState(() => ({
    ...EMPTY,
    deadlineDate: '',
    deadlineTime: '',
    clientReference:
      'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
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

  const handleSelectPreset = (preset) => {
    if (preset.isCreate) {
      // Clear/reset draft so user can customize everything from scratch
      setDraft({
        ...EMPTY,
        deadlineDate: '',
        deadlineTime: '',
        clientReference:
          'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
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
      setGeneralError('Please complete all required fields highlighted in red below.');

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
      const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(combinedDeadline);
      if (!match) throw new Error('Invalid deadline date/time format.');
      const [, y, m, d, h, min] = match.map(Number);
      const parsedDate = new Date(y, m - 1, d, h, min);
      if (parsedDate.getTime() <= Date.now()) {
        setFieldErrors((p) => ({ ...p, deadlineTime: 'Deadline must be set in the future' }));
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
        category: draft.category || 'Delivery',
        details: draft.details.trim() || draft.title.trim(),
        location: draft.location.trim(),
        publicLocation: draft.location.trim(),
        exactAddress: draft.location.trim(),
        phone: draft.contactPhone.trim() || draft.phone || 'N/A',
        coordinates: draft.coordinates || { latitude: 7.4475, longitude: 125.8078 },
        deadline: combinedDeadline,
        notes: draft.contactPhone
          ? `Contact Phone: ${draft.contactPhone.trim()}\n${draft.notes || ''}`.trim()
          : draft.notes,
      });
      setIsSuccessModalOpen(true);
    } catch (err) {
      setGeneralError(err.message || 'Failed to post request. Please check all details.');
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
              <Ionicons name="sparkles" size={20} color="#1E4D2B" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Post a Suyo Request</Text>
              <Text style={styles.heroSub}>
                Fill out your task details, reward offer, and meeting location. Verified community doers will be alerted immediately.
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
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* CARD 1: TASK OVERVIEW */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="create-outline" size={18} color="#1E4D2B" />
              <Text style={styles.cardTitle}>Task Overview</Text>
            </View>

            {/* Title */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, fieldErrors.title && styles.fieldLabelError]}>
                  Task Title *
                </Text>
                <Text style={styles.counterText}>{draft.title.length}/100</Text>
              </View>
              <View
                style={[
                  styles.inputWithIcon,
                  fieldErrors.title && styles.inputErrorBorder,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={fieldErrors.title ? '#DC2626' : '#1E4D2B'}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.textInputInner}
                  placeholder="e.g. Drop off documents - Unit 402"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.title}
                  onChangeText={(val) => {
                    setDraft((p) => ({ ...p, title: val }));
                    if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined }));
                  }}
                  maxLength={100}
                  editable={!busy}
                />
              </View>
              {fieldErrors.title && (
                <Text style={styles.fieldErrorText}>{fieldErrors.title}</Text>
              )}
            </View>

            {/* Category Selector */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Category (Optional)</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = draft.category === cat;
                  const iconName = CATEGORY_ICONS[cat] || 'cube-outline';
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        isSelected ? styles.categoryBtnActive : styles.categoryBtnInactive,
                      ]}
                      onPress={() => {
                        setDraft((p) => ({ ...p, category: cat }));
                      }}
                      disabled={busy}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#1E4D2B'}
                      />
                      <Text
                        style={[
                          styles.categoryBtnText,
                          isSelected
                            ? styles.categoryBtnTextActive
                            : styles.categoryBtnTextInactive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Task Details */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Detailed Instructions (Optional)</Text>
                <Text style={styles.counterText}>{draft.details.length}/2000</Text>
              </View>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textareaInput}
                  placeholder="Step-by-step instructions, specific items, or handling details..."
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.details}
                  onChangeText={(val) => {
                    setDraft((p) => ({ ...p, details: val }));
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  textAlignVertical="top"
                  editable={!busy}
                />
              </View>
            </View>
          </View>

          {/* CARD 2: REWARD OFFER */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="cash-outline" size={18} color="#1E4D2B" />
              <Text style={styles.cardTitle}>Reward Offer (PHP)</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, fieldErrors.offerAmount && styles.fieldLabelError]}>
                Offer Amount *
              </Text>
              <View
                style={[
                  styles.currencyInputRow,
                  fieldErrors.offerAmount && styles.inputErrorBorder,
                ]}
              >
                <View
                  style={[
                    styles.currencySymbolBadge,
                    fieldErrors.offerAmount && styles.currencySymbolBadgeError,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencySymbolText,
                      fieldErrors.offerAmount && { color: '#DC2626' },
                    ]}
                  >
                    ₱
                  </Text>
                </View>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="150.00"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.offerAmount}
                  onChangeText={(val) => {
                    setDraft((p) => ({
                      ...p,
                      offerAmount: val.replace(/[^0-9.]/g, ''),
                    }));
                    if (fieldErrors.offerAmount) setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
                  }}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!busy}
                />
              </View>
              {fieldErrors.offerAmount && (
                <Text style={styles.fieldErrorText}>{fieldErrors.offerAmount}</Text>
              )}
            </View>

            {/* Reward Presets */}
            <View style={styles.presetsRow}>
              <Text style={styles.presetsLabel}>Presets:</Text>
              {REWARD_PRESETS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.presetPill,
                    draft.offerAmount === amt && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    setDraft((p) => ({ ...p, offerAmount: amt }));
                    if (fieldErrors.offerAmount) setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      draft.offerAmount === amt && styles.presetPillTextActive,
                    ]}
                  >
                    ₱{parseInt(amt, 10)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CARD 3: COMPLETION DEADLINE (DATE & TIME) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={18} color="#1E4D2B" />
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
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={draft.deadlineDate}
                    onChangeText={(val) => {
                      setDraft((p) => ({ ...p, deadlineDate: val }));
                      if (fieldErrors.deadlineDate) setFieldErrors((p) => ({ ...p, deadlineDate: undefined }));
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
                      color={fieldErrors.deadlineDate ? '#DC2626' : '#1E4D2B'}
                    />
                  </TouchableOpacity>
                </View>
                {fieldErrors.deadlineDate && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.deadlineDate}</Text>
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
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={draft.deadlineTime}
                    onChangeText={(val) => {
                      setDraft((p) => ({ ...p, deadlineTime: val }));
                      if (fieldErrors.deadlineTime) setFieldErrors((p) => ({ ...p, deadlineTime: undefined }));
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
                      color={fieldErrors.deadlineTime ? '#DC2626' : '#1E4D2B'}
                    />
                  </TouchableOpacity>
                </View>
                {fieldErrors.deadlineTime && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.deadlineTime}</Text>
                )}
              </View>
            </View>

            {draft.deadlineDate && draft.deadlineTime ? (
              <View style={styles.deadlineContainerPill}>
                <Ionicons name="checkmark-circle" size={14} color="#1E4D2B" />
                <Text style={styles.deadlinePillText}>
                  Scheduled Deadline: {draft.deadlineDate} at {draft.deadlineTime}
                </Text>
              </View>
            ) : null}
          </View>

          {/* CARD 4: LOCATION & PIN */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="location-outline" size={18} color="#1E4D2B" />
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
                <Text style={styles.counterText}>{draft.location.length}/250</Text>
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
                    if (fieldErrors.location) setFieldErrors((p) => ({ ...p, location: undefined }));
                  }}
                  maxLength={250}
                  editable={!busy}
                />
              </View>
              {fieldErrors.location && (
                <Text style={styles.fieldErrorText}>{fieldErrors.location}</Text>
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

          {/* CARD 5: CONTACT INFO & SPECIAL INSTRUCTIONS */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="call-outline" size={18} color="#1E4D2B" />
              <Text style={styles.cardTitle}>Contact Info & Extra Instructions</Text>
            </View>

            {/* Contact Phone (Mandatory) */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    fieldErrors.contactPhone && styles.fieldLabelError,
                  ]}
                >
                  Requester Contact Phone *
                </Text>
                <Text style={styles.requiredBadge}>Required</Text>
              </View>
              <View
                style={[
                  styles.inputWithIcon,
                  fieldErrors.contactPhone && styles.inputErrorBorder,
                ]}
              >
                <Ionicons
                  name="call"
                  size={18}
                  color={fieldErrors.contactPhone ? '#DC2626' : '#1E4D2B'}
                  style={styles.leadingIcon}
                />
                <TextInput
                  ref={contactInputRef}
                  style={styles.textInputInner}
                  placeholder="e.g. 0917 842 1983"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.contactPhone}
                  onChangeText={(val) => {
                    setDraft((p) => ({ ...p, contactPhone: val }));
                    if (fieldErrors.contactPhone) setFieldErrors((p) => ({ ...p, contactPhone: undefined }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                  editable={!busy}
                />
              </View>
              {fieldErrors.contactPhone && (
                <Text style={styles.fieldErrorText}>{fieldErrors.contactPhone}</Text>
              )}
            </View>

            {/* Extra Notes */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Additional Notes (Optional)</Text>
                <Text style={styles.counterText}>{draft.notes.length}/1000</Text>
              </View>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textareaInput}
                  placeholder="Call upon arrival at lobby guard, receipt required..."
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.notes}
                  onChangeText={(val) => setDraft((p) => ({ ...p, notes: val }))}
                  multiline
                  numberOfLines={3}
                  maxLength={1000}
                  textAlignVertical="top"
                  editable={!busy}
                />
              </View>
            </View>
          </View>

          {/* LOAD ERROR BANNER */}
          {loadError ? (
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={20} color="#DC2626" />
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
            style={[styles.submitButton, (busy || isLoading) && styles.submitButtonDisabled]}
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

      {/* ========================================================== */}
      {/* SUCCESS CONFIRMATION MODAL                                */}
      {/* ========================================================== */}
      <Modal
        visible={isSuccessModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setIsSuccessModalOpen(false);
          onPosted();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-sharp" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.successModalTitle}>Suyo Posted Successfully!</Text>
            <Text style={styles.successModalSub}>
              Your errand request "{draft.title}" is now live. Nearby verified doers have been alerted.
            </Text>

            <View style={styles.successSummaryBox}>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>{draft.category}</Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Reward:</Text>
                <Text style={[styles.summaryValue, { color: '#1E4D2B', fontWeight: '800' }]}>
                  ₱{draft.offerAmount}
                </Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Contact:</Text>
                <Text style={styles.summaryValue}>{draft.contactPhone}</Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Deadline:</Text>
                <Text style={styles.summaryValue}>{draft.deadlineDate} {draft.deadlineTime}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                onPosted();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  formContainer: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 16,
  },

  /* HERO BANNER */
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5EF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4E8DC',
    gap: 14,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDE3D5',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 17,
    color: '#466151',
  },

  /* QUICK PRESETS */
  templatesBlock: {
    gap: 8,
  },
  templatesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#556E60',
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
  templatesScroll: {
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D6E6DC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  templateChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  templateChipCreate: {
    backgroundColor: '#EBF5EF',
    borderColor: '#A4D1B8',
  },
  templateChipCreateText: {
    color: '#163523',
    fontWeight: '800',
  },

  /* GENERAL ERROR BANNER */
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  generalErrorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  /* CARDS */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E1ECE5',
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardWithErrors: {
    borderColor: '#FECACA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  cardSubText: {
    fontSize: 12,
    color: '#556E60',
    lineHeight: 16,
    marginTop: -6,
  },

  /* FIELDS */
  fieldBlock: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243D2F',
  },
  fieldLabelError: {
    color: '#DC2626',
    fontWeight: '800',
  },
  counterText: {
    fontSize: 11,
    color: '#8EA296',
    fontWeight: '600',
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D4E2DA',
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 48,
  },
  inputErrorBorder: {
    borderColor: '#DC2626',
    borderWidth: 1.6,
    backgroundColor: '#FEF2F2',
  },
  currencySymbolBadgeError: {
    backgroundColor: '#FEE2E2',
    borderRightColor: '#DC2626',
  },
  fieldErrorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  leadingIcon: {
    marginRight: 6,
  },
  textInputInner: {
    flex: 1,
    fontSize: 12.5,
    color: '#163523',
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  textareaWrapper: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D4E2DA',
    borderRadius: 12,
    padding: 12,
    minHeight: 84,
  },
  textareaInput: {
    fontSize: 12.5,
    color: '#163523',
    lineHeight: 18,
  },
  pickerTrailingButton: {
    paddingLeft: 6,
    paddingRight: 2,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* CATEGORY GRID */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  categoryBtnActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBtnInactive: {
    backgroundColor: '#F5FAF7',
    borderColor: '#D4E4DC',
  },
  categoryBtnError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  categoryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryBtnTextInactive: {
    color: '#264A35',
  },

  /* CURRENCY / REWARD */
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D4E2DA',
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
  },
  currencySymbolBadge: {
    width: 48,
    height: '100%',
    backgroundColor: '#EBF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D4E2DA',
  },
  currencySymbolText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#637A6D',
    marginRight: 2,
  },
  presetPill: {
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#D8E8DF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetPillActive: {
    backgroundColor: '#1E4D2B',
    borderColor: '#1E4D2B',
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D4E3A',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },

  /* DATE & TIME ROW */
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeCol: {
    flex: 1,
    gap: 6,
  },
  dateTimeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D4E2DA',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
  },
  deadlineContainerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deadlinePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },

  /* LOAD ERROR */
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
  },
  errorCardText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },

  /* SUBMIT BUTTON */
  submitButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* SUCCESS MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 8,
  },
  successModalSub: {
    fontSize: 13,
    color: '#556E60',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#F5FAF7',
    borderWidth: 1,
    borderColor: '#E1ECE5',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 20,
  },
  summaryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#637A6D',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12.5,
    color: '#163523',
    fontWeight: '700',
    maxWidth: '60%',
  },
  successDoneButton: {
    backgroundColor: '#1E4D2B',
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
