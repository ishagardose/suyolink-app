import React from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EditSuyoModal({
  busy,
  error,
  editingSuyoData,
  handleSaveEditedSuyo,
  isEditingSuyoModalOpen,
  resolveColor,
  setEditingSuyoData,
  setIsEditingSuyoModalOpen,
  styles,
}) {
  return (
    <Modal
      visible={isEditingSuyoModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        if (!busy) setIsEditingSuyoModalOpen(false);
      }}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.editSuyoModalCard}>
          <View style={styles.editSuyoHeader}>
            <Text style={styles.editSuyoHeaderTitle}>Edit Suyo Details</Text>
            <TouchableOpacity
              disabled={busy}
              style={styles.modalCloseButton}
              onPress={() => setIsEditingSuyoModalOpen(false)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={18}
                color={resolveColor('#163523', 'color')}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 380 }}
          >
            <Text style={styles.editSuyoInputLabel}>Title</Text>
            <TextInput
              editable={!busy}
              style={styles.editSuyoTextInput}
              accessibilityLabel="Edit task title"
              value={editingSuyoData.title}
              onChangeText={(text) =>
                setEditingSuyoData((prev) => ({ ...prev, title: text }))
              }
              placeholder="e.g. Buy groceries at SM Tagum"
              placeholderTextColor={resolveColor(
                '#94A3B8',
                'placeholderTextColor',
              )}
            />

            <Text style={styles.editSuyoInputLabel}>Reward Offer (₱)</Text>
            <View style={styles.editSuyoRewardRow}>
              <TextInput
                editable={!busy}
                style={[styles.editSuyoTextInput, { flex: 1, marginBottom: 0 }]}
                accessibilityLabel="Edit reward offer"
                value={String(editingSuyoData.rewardAmount)}
                onChangeText={(text) =>
                  setEditingSuyoData((prev) => ({
                    ...prev,
                    rewardAmount: text.replace(/[^0-9.]/g, ''),
                  }))
                }
                keyboardType="numeric"
                placeholder="150"
                placeholderTextColor={resolveColor(
                  '#94A3B8',
                  'placeholderTextColor',
                )}
              />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  disabled={busy}
                  style={styles.editSuyoQuickAddPill}
                  activeOpacity={0.75}
                  onPress={() =>
                    setEditingSuyoData((prev) => ({
                      ...prev,
                      rewardAmount: Number(prev.rewardAmount || 0) + 20,
                    }))
                  }
                >
                  <Text style={styles.editSuyoQuickAddText}>+₱20</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy}
                  style={styles.editSuyoQuickAddPill}
                  activeOpacity={0.75}
                  onPress={() =>
                    setEditingSuyoData((prev) => ({
                      ...prev,
                      rewardAmount: Number(prev.rewardAmount || 0) + 50,
                    }))
                  }
                >
                  <Text style={styles.editSuyoQuickAddText}>+₱50</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.editSuyoInputLabel}>Task Description</Text>
            <TextInput
              editable={!busy}
              style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
              accessibilityLabel="Edit task description"
              value={editingSuyoData.details}
              onChangeText={(text) =>
                setEditingSuyoData((prev) => ({ ...prev, details: text }))
              }
              multiline={true}
              numberOfLines={3}
              placeholder="Detailed task description..."
              placeholderTextColor={resolveColor(
                '#94A3B8',
                'placeholderTextColor',
              )}
            />

            <Text style={styles.editSuyoInputLabel}>
              Special Notes / Instructions (Optional)
            </Text>
            <TextInput
              editable={!busy}
              style={[styles.editSuyoTextInput, styles.editSuyoTextArea]}
              accessibilityLabel="Edit task notes"
              value={editingSuyoData.notes}
              onChangeText={(text) =>
                setEditingSuyoData((prev) => ({ ...prev, notes: text }))
              }
              multiline={true}
              numberOfLines={2}
              placeholder="e.g. Please ask for the receipt"
              placeholderTextColor={resolveColor(
                '#94A3B8',
                'placeholderTextColor',
              )}
            />
          </ScrollView>

          {error ? (
            <Text
              accessibilityRole="alert"
              style={{
                color: resolveColor('#DC2626', 'color'),
                marginVertical: 8,
              }}
            >
              {error}
            </Text>
          ) : null}
          <View style={styles.editSuyoActionsRow}>
            <TouchableOpacity
              disabled={busy}
              style={styles.editSuyoCancelBtn}
              onPress={() => setIsEditingSuyoModalOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.editSuyoCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy}
              style={styles.editSuyoSaveBtn}
              accessibilityRole="button"
              accessibilityLabel="Save task changes"
              onPress={handleSaveEditedSuyo}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-sharp"
                size={16}
                color={resolveColor('#FFFFFF', 'color')}
              />
              <Text style={styles.editSuyoSaveBtnText}>
                {busy ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
