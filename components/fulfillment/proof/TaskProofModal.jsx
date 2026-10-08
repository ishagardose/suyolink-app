import React from 'react';
import { styles } from '../styles/fulfill.styles.js';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TaskProofModal({
  handleCompleteTask,
  handlePickProof,
  handleTakePhoto,
  isProofModalOpen,
  proofImageUri,
  proofNotes,
  setIsProofModalOpen,
  setProofNotes,
}) {
  return (
    <Modal
      visible={isProofModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsProofModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.proofModalCard}>
          <View style={styles.proofModalHeader}>
            <Text style={styles.proofModalTitle}>Upload Delivery Proof</Text>
            <TouchableOpacity
              onPress={() => setIsProofModalOpen(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons
                name="close"
                size={20}
                color="#556E60"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.proofModalSub}>
            Attach a clear photo of the delivered item or handoff to confirm
            completion.
          </Text>

          {/* Photo Selection / Camera preview */}
          <View style={styles.photoPickerBox}>
            {proofImageUri ? (
              <View style={styles.previewImageContainer}>
                <Image
                  source={{ uri: proofImageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.changeImageBadge}
                  onPress={handlePickProof}
                >
                  <Ionicons
                    name="camera-reverse"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.changeImageText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickOptionsRow}>
                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color="#1E4D2B"
                  />
                  <Text style={styles.photoActionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={handlePickProof}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="images-outline"
                    size={26}
                    color="#1E4D2B"
                  />
                  <Text style={styles.photoActionText}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Optional Notes */}
          <Text style={styles.proofInputLabel}>Proof Notes (Optional)</Text>
          <TextInput
            style={styles.proofNotesInput}
            placeholder="e.g. Left with reception, handed directly to recipient..."
            placeholderTextColor="#7F998A"
            value={proofNotes}
            onChangeText={setProofNotes}
            multiline
            numberOfLines={3}
          />

          {/* Modal Actions */}
          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsProofModalOpen(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCompleteTask}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-done"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.modalSubmitBtnText}>Submit & Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
