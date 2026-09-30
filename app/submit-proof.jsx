import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function SubmitProofScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const task = {
    id: params.id || 'SYL-102',
    title: params.title || 'Quick Grocery Delivery (5 items)',
    reward: params.reward || '₱150',
    category: params.category || 'Groceries',
    location: params.location || 'SM Tagum',
    requesterName: params.requesterName || 'Atty. Rafael Cruz',
  };

  const [photoUri, setPhotoUri] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Take photo with camera (or fallback on web)
  const handleShutterCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.85,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
          return;
        }
      }
    } catch {
      // Fallback
    }

    // High quality sample proof photo for web simulator or camera permission rejection
    setPhotoUri(
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
    );
  };

  // Pick from gallery
  const handlePickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        return;
      }
    } catch {
      // Fallback
    }

    setPhotoUri(
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
    );
  };

  // Retake photo
  const handleRetake = () => {
    setPhotoUri(null);
  };

  // Submit proof
  const handleSubmitProof = () => {
    if (!photoUri) {
      // Prompt user or auto-capture
      handleShutterCapture();
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP HEADER */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/fulfill')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#163523" />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Submit Proof of Suyo</Text>
        <View style={styles.taskBadge}>
          <Text style={styles.taskBadgeText}>{task.reward}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* TASK CONTEXT STRIP */}
        <View style={styles.taskContextCard}>
          <View style={styles.taskContextLeft}>
            <View style={styles.taskCategoryIconBox}>
              <Ionicons name="shield-checkmark" size={18} color="#1E4D2B" />
            </View>
            <View style={styles.taskContextMeta}>
              <Text style={styles.taskContextTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.taskContextSub}>
                Recipient: {task.requesterName} • {task.location}
              </Text>
            </View>
          </View>
        </View>

        {/* CAMERA VIEWFINDER FRAME (Image 1) */}
        <View style={styles.viewfinderCard}>
          {photoUri ? (
            <View style={styles.capturedPhotoContainer}>
              <Image source={{ uri: photoUri }} style={styles.capturedPhoto} />
              <View style={styles.photoReadyBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.photoReadyBadgeText}>Photo Captured</Text>
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleRetake}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.viewfinderGuideBox}
              activeOpacity={0.85}
              onPress={handleShutterCapture}
            >
              {/* Corner framing brackets */}
              <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
              <View style={[styles.cornerBracket, styles.bracketTopRight]} />
              <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
              <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

              <View style={styles.viewfinderCenterContent}>
                <View style={styles.cameraIconCircle}>
                  <Ionicons name="camera" size={38} color="#1E4D2B" />
                </View>
                <Text style={styles.viewfinderPromptLabel}>
                  [ CAMERA VIEWFINDER ]
                </Text>
                <Text style={styles.viewfinderHint}>
                  Tap here or use the shutter button below
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* INSTRUCTIONS */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsHeadline}>
            Take a photo as proof of completion
          </Text>
          <Text style={styles.instructionsSub}>
            Ensure delivery items are clearly visible in the photo frame.
          </Text>
        </View>

        {/* CAMERA CONTROLS ROW (Image 1) */}
        <View style={styles.cameraControlsRow}>
          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.controlActionBtn}
            onPress={handlePickGallery}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={22} color="#1E4D2B" />
            <Text style={styles.controlActionLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Shutter Capture Button */}
          <TouchableOpacity
            style={styles.shutterButtonOuter}
            onPress={handleShutterCapture}
            activeOpacity={0.8}
          >
            <View style={styles.shutterButtonInner}>
              <Ionicons
                name={photoUri ? 'camera' : 'camera-outline'}
                size={24}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Retake Button */}
          <TouchableOpacity
            style={[
              styles.controlActionBtn,
              !photoUri && styles.controlActionBtnDisabled,
            ]}
            onPress={handleRetake}
            disabled={!photoUri}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color={photoUri ? '#1E4D2B' : '#A4B8AC'}
            />
            <Text
              style={[
                styles.controlActionLabel,
                !photoUri && styles.controlActionLabelDisabled,
              ]}
            >
              Retake
            </Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY NOTE INPUT (OPTIONAL) */}
        <View style={styles.notesSection}>
          <Text style={styles.notesSectionLabel}>
            Delivery Notes (Optional)
          </Text>
          <TextInput
            style={styles.notesTextInput}
            placeholder="e.g. Handed grocery bags to recipient at unit doorstep."
            placeholderTextColor="#8FA497"
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* SUBMIT PROOF BUTTON (Image 1) */}
        <TouchableOpacity
          style={[
            styles.submitProofButton,
            isSubmitting && styles.submitProofButtonDisabled,
          ]}
          onPress={handleSubmitProof}
          activeOpacity={0.85}
          disabled={isSubmitting}
        >
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
          <Text style={styles.submitProofButtonText}>
            {isSubmitting ? 'Verifying Proof...' : 'Submit Proof'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================== */}
      {/* MODAL: SUCCESS CELEBRATION MODAL                           */}
      {/* ========================================================== */}
      <Modal
        visible={isSuccessModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.successModalTitle}>Proof Verified!</Text>
            <Text style={styles.successModalSub}>
              Great job! Your proof of completion has been submitted. The reward of{' '}
              {task.reward} has been successfully credited to your SuyoLink wallet.
            </Text>

            <View style={styles.successRewardBox}>
              <Text style={styles.successRewardLabel}>REWARD EARNED</Text>
              <Text style={styles.successRewardAmount}>{task.reward}.00</Text>
            </View>

            <TouchableOpacity
              style={styles.successRateButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                router.push({
                  pathname: '/rate-requester',
                  params: {
                    id: task.id,
                    title: task.title,
                    reward: task.reward,
                    requesterName: task.requesterName,
                    requesterRating: '4.9',
                    location: task.location,
                  },
                });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.successRateButtonText}>Rate the Requester</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setIsSuccessModalOpen(false);
                router.replace('/dashboard');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  navBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  taskBadge: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  taskBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* TASK CONTEXT STRIP */
  taskContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    marginBottom: 16,
  },
  taskContextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskCategoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContextMeta: {
    flex: 1,
  },
  taskContextTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  taskContextSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#52695C',
  },

  /* CAMERA VIEWFINDER FRAME (Image 1) */
  viewfinderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D8E5DF',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  viewfinderGuideBox: {
    width: '100%',
    height: 290,
    borderRadius: 16,
    backgroundColor: '#F3F7F5',
    borderWidth: 1.5,
    borderColor: '#9BB8A7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  viewfinderCenterContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  cameraIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E4EFE8',
    borderWidth: 1.5,
    borderColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  viewfinderPromptLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 1.2,
  },
  viewfinderHint: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#658071',
    textAlign: 'center',
  },

  /* CORNER BRACKETS FOR PROFESSIONAL CAMERA VIEWFINDER LOOK */
  cornerBracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#1E4D2B',
  },
  bracketTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  /* CAPTURED PHOTO PREVIEW */
  capturedPhotoContainer: {
    width: '100%',
    height: 290,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  capturedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoReadyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoReadyBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(22, 53, 35, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* INSTRUCTIONS */
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  instructionsHeadline: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionsSub: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#52695C',
    textAlign: 'center',
  },

  /* CAMERA CONTROLS ROW (Image 1) */
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlActionBtn: {
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  controlActionBtnDisabled: {
    opacity: 0.45,
  },
  controlActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  controlActionLabelDisabled: {
    color: '#A4B8AC',
  },

  /* SHUTTER BUTTON */
  shutterButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3.5,
    borderColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  shutterButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* NOTES SECTION */
  notesSection: {
    marginBottom: 20,
  },
  notesSectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#163523',
    marginBottom: 6,
  },
  notesTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D8E5DF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#163523',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  /* SUBMIT PROOF BUTTON */
  submitProofButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  submitProofButtonDisabled: {
    opacity: 0.65,
  },
  submitProofButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* SUCCESS CELEBRATION MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#163523',
    marginBottom: 6,
    textAlign: 'center',
  },
  successModalSub: {
    fontSize: 13,
    color: '#52695C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  successRewardBox: {
    backgroundColor: '#EBF5EF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D8E5DF',
  },
  successRewardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  successRewardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E4D2B',
  },
  successRateButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E4D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successRateButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successDoneButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#D4E4DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#345241',
  },
});
