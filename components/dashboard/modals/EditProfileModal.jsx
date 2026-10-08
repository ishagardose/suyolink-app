import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileModal({
  handleSaveProfile,
  isEditModalOpen,
  resolveColor,
  setIsEditModalOpen,
  setTempProfile,
  styles,
  tempProfile,
}) {
  return (
    <Modal
      visible={isEditModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsEditModalOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContentCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Edit Account Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditModalOpen(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={resolveColor('#163523', 'color')}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalInputLabel}>Full Name</Text>
          <TextInput
            style={styles.modalInput}
            value={tempProfile.name}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, name: text })
            }
            placeholder="Full Name"
            placeholderTextColor={resolveColor(
              '#8FA497',
              'placeholderTextColor',
            )}
          />

          <Text style={styles.modalInputLabel}>Email Address</Text>
          <TextInput
            style={styles.modalInput}
            value={tempProfile.email}
            editable={false}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, email: text })
            }
            placeholder="Email"
            keyboardType="email-address"
            placeholderTextColor={resolveColor(
              '#8FA497',
              'placeholderTextColor',
            )}
          />

          <Text style={styles.modalInputLabel}>Contact Number</Text>
          <TextInput
            style={styles.modalInput}
            value={tempProfile.phone}
            onChangeText={(text) =>
              setTempProfile({ ...tempProfile, phone: text })
            }
            placeholder="Phone"
            keyboardType="phone-pad"
            placeholderTextColor={resolveColor(
              '#8FA497',
              'placeholderTextColor',
            )}
          />

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsEditModalOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color={resolveColor('#FFFFFF', 'color')}
              />
              <Text style={styles.modalSaveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
