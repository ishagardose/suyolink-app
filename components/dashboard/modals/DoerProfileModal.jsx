import React from 'react';
import { getInitials } from '../utils/dashboardHelpers';
import { Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DoerProfileModal({
  resolveColor,
  selectedDoerProfile,
  setSelectedDoerProfile,
  styles,
  triggerToast,
}) {
  return (
    selectedDoerProfile && (
      <Modal
        visible={!!selectedDoerProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDoerProfile(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.doerProfileModalCard}>
            {/* Header */}
            <View style={styles.doerProfileHeader}>
              <Text style={styles.doerProfileHeaderTitle}>Doer Profile</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedDoerProfile(null)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={resolveColor('#163523', 'color')}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Hero */}
            <View style={styles.doerProfileHero}>
              <View style={styles.doerProfileAvatarCircle}>
                <Text style={styles.doerProfileAvatarInitials}>
                  {getInitials(selectedDoerProfile.name)}
                </Text>
                <View style={styles.doerVerifiedBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={resolveColor('#FFFFFF', 'color')}
                  />
                </View>
              </View>
              <Text style={styles.doerProfileName}>
                {selectedDoerProfile.name}
              </Text>
              <View style={styles.doerVerifiedTag}>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={resolveColor('#059669', 'color')}
                />
                <Text style={styles.doerVerifiedTagText}>
                  Verified Courier & Doer
                </Text>
              </View>
              <Text style={styles.doerProfileRating}>
                ⭐ {selectedDoerProfile.rating || '4.9★'} ·{' '}
                {selectedDoerProfile.completedCount || '128 suyos delivered'}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.doerStatsGrid}>
              <View style={styles.doerStatItem}>
                <Text style={styles.doerStatValue}>
                  {selectedDoerProfile.completedCount?.split(' ')[0] || '128'}
                </Text>
                <Text style={styles.doerStatLabel}>Completed</Text>
              </View>
              <View style={styles.doerStatItem}>
                <Text style={styles.doerStatValue}>99.4%</Text>
                <Text style={styles.doerStatLabel}>On-Time</Text>
              </View>
              <View style={styles.doerStatItem}>
                <Text style={styles.doerStatValue}>100%</Text>
                <Text style={styles.doerStatLabel}>Reliable</Text>
              </View>
            </View>

            {/* Details List */}
            <View style={styles.doerInfoList}>
              <View style={styles.doerInfoRow}>
                <Ionicons
                  name="bicycle"
                  size={15}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.doerInfoLabel}>Transport:</Text>
                <Text style={styles.doerInfoValue}>
                  {selectedDoerProfile.vehicle || 'Motorcycle'}
                </Text>
              </View>
              <View style={styles.doerInfoRow}>
                <Ionicons
                  name="call"
                  size={15}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.doerInfoLabel}>Contact:</Text>
                <Text style={styles.doerInfoValue}>
                  {selectedDoerProfile.phone || '+63 917 555 0192'}
                </Text>
              </View>
              <View style={styles.doerInfoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.doerInfoLabel}>Joined:</Text>
                <Text style={styles.doerInfoValue}>
                  {selectedDoerProfile.joinedDate || 'March 2023'}
                </Text>
              </View>
            </View>

            {/* Bio snippet */}
            <Text style={styles.doerBioText}>
              "
              {selectedDoerProfile.bio ||
                'Reliable and fast delivery courier in Tagum and Davao area. Careful with groceries and delicate items.'}
              "
            </Text>

            {/* Actions */}
            <View style={styles.doerProfileActionsRow}>
              <TouchableOpacity
                style={styles.doerProfileCallBtn}
                activeOpacity={0.8}
                onPress={() =>
                  triggerToast(`Calling ${selectedDoerProfile.name}...`, 'call')
                }
              >
                <Ionicons
                  name="call"
                  size={15}
                  color={resolveColor('#FFFFFF', 'color')}
                />
                <Text style={styles.doerProfileCallBtnText}>Call Doer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doerProfileMsgBtn}
                activeOpacity={0.8}
                onPress={() =>
                  triggerToast(
                    `Opening chat with ${selectedDoerProfile.name}...`,
                    'chatbubble-ellipses',
                  )
                }
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={15}
                  color={resolveColor('#1E4D2B', 'color')}
                />
                <Text style={styles.doerProfileMsgBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  );
}
