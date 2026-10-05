import { useTheme } from '../../theme/ThemeContext';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import useRequestFormStyles from './requestForm.styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function RequestSuccessModal({
  isSuccessModalOpen,
  setIsSuccessModalOpen,
  onPosted,
  draft,
}) {
  const styles = useRequestFormStyles();
  const { colors } = useTheme();
  return (
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
              color={colors.onPrimary}
            />
          </View>

          <Text style={styles.successModalTitle}>
            Suyo Posted Successfully!
          </Text>
          <Text style={styles.successModalSub}>
            Your suyo request "{draft.title}" is now available for doers to
            find.
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
                  { color: colors.link, fontWeight: '800' },
                ]}
              >
                ₱{draft.offerAmount}
              </Text>
            </View>
            <View style={styles.summaryRowItem}>
              <Text style={styles.summaryLabel}>Contact:</Text>
              <Text style={styles.summaryValue}>+63{draft.contactPhone}</Text>
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
                    { color: colors.success, fontWeight: '700' },
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
                  , {draft.attachments.filter((a) => a.type === 'file').length}{' '}
                  doc
                  {draft.attachments.filter((a) => a.type === 'file').length ===
                  1
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
  );
}
