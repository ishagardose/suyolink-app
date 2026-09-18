import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WalkingProgressFooter from '../components/WalkingProgressFooter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function IdVerificationScreen() {
  const router = useRouter();
  const [hasUploaded, setHasUploaded] = useState(false);

  const handleTapUpload = () => {
    // Interactive mock upload: sets uploaded preview or toggles
    setHasUploaded(true);
  };

  const handleRemovePhoto = () => {
    setHasUploaded(false);
  };

  const handleProceed = () => {
    // Advance to Step 3: Role Selection in Sign Up Flow
    router.push('/role-selection');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeContainer}>
      <StatusBar style="dark" />
      <View style={styles.mainContainer}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#163523" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Identity Verification</Text>
            <Text style={styles.screenSubtitle}>
              Upload a valid ID for trust verification
            </Text>
          </View>

          {/* Upload ID Area (Dashed Container) */}
          {!hasUploaded ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleTapUpload}
              style={styles.uploadDashedContainer}
            >
              <View style={styles.uploadIconRow}>
                <Ionicons
                  name="camera-outline"
                  size={36}
                  color="#4B6E5B"
                  style={styles.uploadIcon}
                />
                <Ionicons
                  name="card-outline"
                  size={36}
                  color="#4B6E5B"
                  style={styles.uploadIcon}
                />
              </View>
              <Text style={styles.uploadPromptText}>
                [Tap to Upload ID Photo]
              </Text>
              <Text style={styles.uploadHintText}>
                Supported: Driver's License, Passport, National ID
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadedContainer}>
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#1E4D2B" />
                <View style={styles.uploadedMeta}>
                  <Text style={styles.uploadedFileName}>government_id_front.jpg</Text>
                  <Text style={styles.uploadedFileSize}>2.4 MB • Ready to verify</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleRemovePhoto}
                style={styles.removePhotoButton}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#E05A47" />
                <Text style={styles.removePhotoText}>Change photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Verification Button */}
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleProceed}
          >
            <Text style={styles.submitButtonText}>Submit Verification</Text>
          </TouchableOpacity>
        </View>

        {/* Step 2 Progress Footer */}
        <WalkingProgressFooter step={2} totalSteps={3} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 28,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#658071',
    lineHeight: 22,
  },
  uploadDashedContainer: {
    borderWidth: 2,
    borderColor: '#7FA890',
    borderStyle: 'dashed',
    borderRadius: 18,
    backgroundColor: '#F7FAF8',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  uploadIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 16,
  },
  uploadIcon: {
    opacity: 0.85,
  },
  uploadPromptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163523',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  uploadHintText: {
    fontSize: 12,
    color: '#7D9889',
    textAlign: 'center',
  },
  uploadedContainer: {
    borderWidth: 1.5,
    borderColor: '#C2DEC9',
    borderRadius: 18,
    backgroundColor: '#F3F9F5',
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadedMeta: {
    marginLeft: 14,
  },
  uploadedFileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163523',
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#688B77',
    marginTop: 2,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E05A47',
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#1E4D2B', // Signature Hunter Green
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 18,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: '#1E4D2B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
