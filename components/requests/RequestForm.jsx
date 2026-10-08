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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
  urgency: 'Normal',
  location: '',
  publicLocation: '',
  exactAddress: '',
  contactPhone: '',
  phone: '',
  coordinates: null,
  notes: '',
  attachments: [],
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
    label: 'Custom / Create',
    isCreate: true,
  },
  {
    key: 'groceries',
    label: 'Groceries',
    title: 'Buy groceries at supermarket',
    category: 'Groceries',
    offerAmount: '150.00',
    details:
      'Pick up eggs, fresh bread, and 2 cartons of milk from local supermarket.',
  },
  {
    key: 'documents',
    label: 'Documents',
    title: 'Drop off documents - Unit 402',
    category: 'Documents',
    offerAmount: '300.00',
    details:
      'Deliver notarized agreements and legal documents to Unit 402 reception desk.',
  },
  {
    key: 'bills',
    label: 'Bills Payment',
    title: 'Queue for bills payment',
    category: 'Queuing & Bills',
    offerAmount: '120.00',
    details:
      'Line up at Bayad Center to pay monthly utility bill. Cash and bill slip are prepared.',
  },
  {
    key: 'pickup_deliver',
    label: 'Pickup & Deliver',
    title: 'Pickup & Deliver items',
    category: 'Delivery',
    offerAmount: '180.00',
    details:
      'Collect pre-ordered package from branch and safely deliver to destination address.',
  },
];

const REWARD_PRESETS = ['100.00', '150.00', '200.00', '300.00'];

const PLACEHOLDER_COLOR = '#688676';

const DEADLINE_STATUS_OPTIONS = [
  {
    key: 'Urgent',
    label: 'Urgent',
    sublabel: 'Rush (<3h)',
    icon: 'flame',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
    activeBg: '#DC2626',
    description: 'Signals couriers that this task requires immediate urgent attention and fast acceptance.',
  },
  {
    key: 'Due today',
    label: 'Due Today',
    sublabel: 'Finish today',
    icon: 'today',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#92400E',
    activeBg: '#D97706',
    description: 'Prioritized for fulfillment today before end of day.',
  },
  {
    key: 'Due tomorrow',
    label: 'Due Tomorrow',
    sublabel: 'Next day',
    icon: 'calendar',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
    activeBg: '#2563EB',
    description: 'Scheduled for fulfillment by tomorrow or next day schedule.',
  },
  {
    key: 'Normal',
    label: 'Normal',
    sublabel: 'Standard schedule',
    icon: 'checkmark-circle',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    textColor: '#166534',
    activeBg: '#15803D',
    description: 'Standard delivery and errand schedule with regular courier dispatch.',
  },
  {
    key: 'Flexible',
    label: 'Flexible',
    sublabel: 'Open window',
    icon: 'hourglass-outline',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    textColor: '#5B21B6',
    activeBg: '#7C3AED',
    description: 'Flexible timing anytime within the chosen target date and time window.',
  },
];

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
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  const scrollViewRef = useRef(null);
  const contactInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const submitting = useRef(false);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedStatusConfig =
    DEADLINE_STATUS_OPTIONS.find((opt) => opt.key === (draft.urgency || 'Normal')) ||
    DEADLINE_STATUS_OPTIONS[3];

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

  const handlePickFromCamera = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to take photos for your suyo request.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAttachment = {
          id:
            'cam-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          uri: asset.uri,
          name: asset.fileName || `camera_photo_${Date.now()}.jpg`,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        };
        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Camera pick error:', err);
      Alert.alert(
        'Camera Error',
        'Could not open camera. Please try selecting from the photo gallery.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Gallery Permission Required',
          'Please allow photo library access to choose photos for your suyo request.',
        );
        return;
      }

      const maxAllowed = 5 - (draft.attachments?.length || 0);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxAllowed,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems = result.assets.map((asset, index) => ({
          id:
            'gal-' +
            Date.now() +
            '-' +
            index +
            '-' +
            Math.random().toString(36).slice(2, 6),
          uri: asset.uri,
          name:
            asset.fileName || `gallery_image_${Date.now()}_${index + 1}.jpg`,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        }));

        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newItems].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      Alert.alert(
        'Gallery Error',
        'Could not open photo gallery. Please try again.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachFiles = async () => {
    try {
      if ((draft.attachments || []).length >= 5) {
        Alert.alert('Limit Reached', 'You can attach up to 5 photos or files.');
        return;
      }
      setAttachmentLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((asset, index) => {
          const isImg =
            asset.mimeType?.startsWith('image/') ||
            /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(asset.name || '');
          return {
            id:
              'doc-' +
              Date.now() +
              '-' +
              index +
              '-' +
              Math.random().toString(36).slice(2, 6),
            uri: asset.uri,
            name: asset.name || `attached_file_${Date.now()}_${index + 1}`,
            type: isImg ? 'image' : 'file',
            mimeType: asset.mimeType || 'application/octet-stream',
            size: asset.size,
          };
        });

        setDraft((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newFiles].slice(0, 5),
        }));
      }
    } catch (err) {
      console.warn('Document picker error:', err);
      Alert.alert(
        'File Picker Error',
        'Could not attach selected file. Please try again.',
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleRemoveAttachment = (idToRemove) => {
    setDraft((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter(
        (item) => item.id !== idToRemove,
      ),
    }));
  };

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
          draft.contactPhone ? `Contact Phone: ${draft.contactPhone.trim()}` : '',
          draft.notes || '',
        ].filter(Boolean).join('\n').trim(),
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
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="create-outline"
                size={18}
                color="#1E4D2B"
              />
              <Text style={styles.cardTitle}>Task Overview</Text>
            </View>

            {/* Title */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    fieldErrors.title && styles.fieldLabelError,
                  ]}
                >
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
                    if (fieldErrors.title)
                      setFieldErrors((p) => ({ ...p, title: undefined }));
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
                        isSelected
                          ? styles.categoryBtnActive
                          : styles.categoryBtnInactive,
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
                <Text style={styles.fieldLabel}>
                  Detailed Instructions (Optional)
                </Text>
                <Text style={styles.counterText}>
                  {draft.details.length}/2000
                </Text>
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

          {/* CARD 2: PHOTOS & FILE ATTACHMENTS (CAMERA, GALLERY, DOCUMENTS) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="images-outline"
                size={18}
                color="#1E4D2B"
              />
              <View style={styles.attachCardHeaderTitleRow}>
                <Text style={styles.cardTitle}>Photos & File Attachments</Text>
                <View style={styles.attachCountBadge}>
                  <Text style={styles.attachCountText}>
                    {(draft.attachments || []).length}/5 Attached
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.cardSubText}>
              Attach photos from your camera or gallery (e.g. items to buy,
              receipts, parcel, location) or attach files/documents.
            </Text>

            {/* Three Action Pickers: Camera, Gallery, Files */}
            <View style={styles.attachActionRow}>
              {/* 1. Camera */}
              <TouchableOpacity
                style={[
                  styles.attachActionBtn,
                  styles.attachActionBtnCamera,
                  (draft.attachments || []).length >= 5 &&
                    styles.attachActionBtnDisabled,
                ]}
                activeOpacity={0.75}
                onPress={handlePickFromCamera}
                disabled={
                  busy ||
                  attachmentLoading ||
                  (draft.attachments || []).length >= 5
                }
              >
                <View
                  style={[
                    styles.attachActionIconCircle,
                    { backgroundColor: '#DCFCE7' },
                  ]}
                >
                  <Ionicons
                    name="camera"
                    size={19}
                    color="#15803D"
                  />
                </View>
                <Text
                  style={[styles.attachActionBtnText, { color: '#15803D' }]}
                >
                  Take Photo
                </Text>
                <Text style={styles.attachActionBtnSub}>Camera</Text>
              </TouchableOpacity>

              {/* 2. Gallery */}
              <TouchableOpacity
                style={[
                  styles.attachActionBtn,
                  styles.attachActionBtnGallery,
                  (draft.attachments || []).length >= 5 &&
                    styles.attachActionBtnDisabled,
                ]}
                activeOpacity={0.75}
                onPress={handlePickFromGallery}
                disabled={
                  busy ||
                  attachmentLoading ||
                  (draft.attachments || []).length >= 5
                }
              >
                <View
                  style={[
                    styles.attachActionIconCircle,
                    { backgroundColor: '#E0F2FE' },
                  ]}
                >
                  <Ionicons
                    name="images"
                    size={19}
                    color="#0369A1"
                  />
                </View>
                <Text
                  style={[styles.attachActionBtnText, { color: '#0369A1' }]}
                >
                  Gallery
                </Text>
                <Text style={styles.attachActionBtnSub}>Photos</Text>
              </TouchableOpacity>

              {/* 3. Files */}
              <TouchableOpacity
                style={[
                  styles.attachActionBtn,
                  styles.attachActionBtnFiles,
                  (draft.attachments || []).length >= 5 &&
                    styles.attachActionBtnDisabled,
                ]}
                activeOpacity={0.75}
                onPress={handleAttachFiles}
                disabled={
                  busy ||
                  attachmentLoading ||
                  (draft.attachments || []).length >= 5
                }
              >
                <View
                  style={[
                    styles.attachActionIconCircle,
                    { backgroundColor: '#FEF3C7' },
                  ]}
                >
                  <Ionicons
                    name="document-attach"
                    size={19}
                    color="#B45309"
                  />
                </View>
                <Text
                  style={[styles.attachActionBtnText, { color: '#B45309' }]}
                >
                  Attach File
                </Text>
                <Text style={styles.attachActionBtnSub}>PDF/Docs</Text>
              </TouchableOpacity>
            </View>

            {attachmentLoading && (
              <View style={styles.attachmentLoadingRow}>
                <ActivityIndicator
                  size="small"
                  color="#1E4D2B"
                />
                <Text style={styles.attachmentLoadingText}>
                  Processing attachment...
                </Text>
              </View>
            )}

            {/* List of Attached Items */}
            {draft.attachments && draft.attachments.length > 0 && (
              <View style={styles.attachmentListWrapper}>
                <View style={styles.attachListHeaderRow}>
                  <Text style={styles.attachmentListTitle}>
                    Attached Items ({draft.attachments.length}):
                  </Text>
                  <Text style={styles.attachTapHint}>Tap photo to preview</Text>
                </View>

                <View style={styles.attachmentListGrid}>
                  {draft.attachments.map((item) => {
                    const isImg = item.type === 'image';
                    return (
                      <View
                        key={item.id}
                        style={
                          isImg
                            ? styles.attachImageItemCard
                            : styles.attachDocItemCard
                        }
                      >
                        {isImg ? (
                          <View style={styles.attachImageItemInner}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => setPreviewImage(item.uri)}
                              style={styles.attachImageThumbWrapper}
                            >
                              <Image
                                source={{ uri: item.uri }}
                                style={styles.attachImageThumb}
                                resizeMode="cover"
                              />
                              <View style={styles.attachImageBadge}>
                                <Ionicons
                                  name="eye"
                                  size={10}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.attachImageBadgeText}>
                                  View
                                </Text>
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.attachRemoveBtn}
                              activeOpacity={0.7}
                              onPress={() => handleRemoveAttachment(item.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons
                                name="close"
                                size={11}
                                color="#FFFFFF"
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.attachDocCardContent}>
                            <View style={styles.attachDocIconCircle}>
                              <Ionicons
                                name="document-text"
                                size={18}
                                color="#B45309"
                              />
                            </View>
                            <View style={styles.attachDocMeta}>
                              <Text
                                style={styles.attachDocName}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>
                              <Text style={styles.attachDocSize}>
                                {formatFileSize(item.size) ||
                                  'Attached document'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.attachDocRemoveBtn}
                              activeOpacity={0.7}
                              onPress={() => handleRemoveAttachment(item.id)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={15}
                                color="#DC2626"
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* CARD 3: REWARD OFFER */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="cash-outline"
                size={18}
                color="#1E4D2B"
              />
              <Text style={styles.cardTitle}>Reward Offer (PHP)</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text
                style={[
                  styles.fieldLabel,
                  fieldErrors.offerAmount && styles.fieldLabelError,
                ]}
              >
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
                    if (fieldErrors.offerAmount)
                      setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
                  }}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!busy}
                />
              </View>
              {fieldErrors.offerAmount && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.offerAmount}
                </Text>
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
                    if (fieldErrors.offerAmount)
                      setFieldErrors((p) => ({ ...p, offerAmount: undefined }));
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
              <Ionicons
                name="time-outline"
                size={18}
                color="#1E4D2B"
              />
              <Text style={styles.cardTitle}>Completion Deadline</Text>
            </View>

            <Text style={styles.cardSubText}>
              Set the required target date and time when the suyo must be
              completed.
            </Text>

            {/* Suyo Status / Priority Picker */}
            <View style={styles.deadlineStatusSection}>
              <View style={styles.deadlineStatusHeaderRow}>
                <Text style={styles.fieldLabel}>Suyo Status / Priority *</Text>
                <View
                  style={[
                    styles.deadlineStatusActiveTag,
                    {
                      backgroundColor: selectedStatusConfig.bgColor,
                      borderColor: selectedStatusConfig.borderColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedStatusConfig.icon}
                    size={11}
                    color={selectedStatusConfig.color}
                  />
                  <Text
                    style={[
                      styles.deadlineStatusActiveTagText,
                      { color: selectedStatusConfig.color },
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
                        color={isSelected ? '#FFFFFF' : opt.color}
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
                    backgroundColor: selectedStatusConfig.bgColor,
                    borderColor: selectedStatusConfig.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle"
                  size={15}
                  color={selectedStatusConfig.color}
                />
                <Text
                  style={[
                    styles.deadlineStatusExplainerText,
                    { color: selectedStatusConfig.textColor || selectedStatusConfig.color },
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
                    placeholderTextColor={PLACEHOLDER_COLOR}
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
                      color={fieldErrors.deadlineDate ? '#DC2626' : '#1E4D2B'}
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
                    placeholderTextColor={PLACEHOLDER_COLOR}
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
                      color={fieldErrors.deadlineTime ? '#DC2626' : '#1E4D2B'}
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
                  color="#1E4D2B"
                />
                <Text style={styles.deadlinePillText}>
                  Scheduled Deadline: {draft.deadlineDate} at{' '}
                  {draft.deadlineTime}
                </Text>
              </View>
            ) : null}
          </View>

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
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="call-outline"
                size={18}
                color="#1E4D2B"
              />
              <Text style={styles.cardTitle}>
                Contact Info & Extra Instructions
              </Text>
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
                    if (fieldErrors.contactPhone)
                      setFieldErrors((p) => ({
                        ...p,
                        contactPhone: undefined,
                      }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                  editable={!busy}
                />
              </View>
              {fieldErrors.contactPhone && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.contactPhone}
                </Text>
              )}
            </View>

            {/* Extra Notes */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Additional Notes (Optional)
                </Text>
                <Text style={styles.counterText}>
                  {draft.notes.length}/1000
                </Text>
              </View>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textareaInput}
                  placeholder="Call upon arrival at lobby guard, receipt required..."
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={draft.notes}
                  onChangeText={(val) =>
                    setDraft((p) => ({ ...p, notes: val }))
                  }
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
              <Ionicons
                name="checkmark-sharp"
                size={38}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.successModalTitle}>
              Suyo Posted Successfully!
            </Text>
            <Text style={styles.successModalSub}>
              Your suyo request "{draft.title}" is now live. Nearby verified
              doers have been alerted.
            </Text>

            <View style={styles.successSummaryBox}>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>{draft.category}</Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Reward:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: '#1E4D2B', fontWeight: '800' },
                  ]}
                >
                  ₱{draft.offerAmount}
                </Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Contact:</Text>
                <Text style={styles.summaryValue}>{draft.contactPhone}</Text>
              </View>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Deadline:</Text>
                <Text style={styles.summaryValue}>
                  {draft.deadlineDate} {draft.deadlineTime}
                </Text>
              </View>
              {draft.attachments && draft.attachments.length > 0 && (
                <View style={styles.summaryRowItem}>
                  <Text style={styles.summaryLabel}>Attachments:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: '#059669', fontWeight: '700' },
                    ]}
                  >
                    {draft.attachments.length} item
                    {draft.attachments.length > 1 ? 's' : ''} (
                    {draft.attachments.filter((a) => a.type === 'image').length}{' '}
                    photo
                    {draft.attachments.filter((a) => a.type === 'image')
                      .length === 1
                      ? ''
                      : 's'}
                    ,{' '}
                    {draft.attachments.filter((a) => a.type === 'file').length}{' '}
                    doc
                    {draft.attachments.filter((a) => a.type === 'file')
                      .length === 1
                      ? ''
                      : 's'}
                    )
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                onPosted();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>
                Return to Dashboard
              </Text>
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
