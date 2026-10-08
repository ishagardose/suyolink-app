import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export default function EditProfileModal({
  styles,
  colors,
  isEditModalOpen,
  setIsEditModalOpen,
  tempProfile,
  setTempProfile,
  busy,
  handleSaveProfile,
}) {
  return (
    <Modal
      visible={isEditModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsEditModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.editModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditModalOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close edit modal"
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputFieldLabel}>Full Name</Text>
          <TextInput
            accessibilityLabel="Name"
            style={styles.textInput}
            value={tempProfile.name}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, name: text })
            }
            placeholder="Enter full name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputFieldLabel}>Handle / Username</Text>
          <TextInput
            accessibilityLabel="Handle"
            style={styles.textInput}
            value={tempProfile.handle}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, handle: text })
            }
            placeholder="@handle"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.inputFieldLabel}>Phone Number</Text>
          <TextInput
            accessibilityLabel="Phone"
            style={styles.textInput}
            value={tempProfile.phone}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, phone: text })
            }
            placeholder="+63 9XX XXX XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputFieldLabel}>Bio</Text>
          <TextInput
            accessibilityLabel="Bio"
            style={[styles.textInput, styles.bioInput]}
            value={tempProfile.bio}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, bio: text })
            }
            placeholder="Tell others what tasks or services you do..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsEditModalOpen(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
              disabled={busy || !tempProfile.name.trim()}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
            >
              {busy ? (
                <ActivityIndicator
                  size="small"
                  color={colors.onPrimary}
                />
              ) : (
                <Text style={styles.modalSaveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
