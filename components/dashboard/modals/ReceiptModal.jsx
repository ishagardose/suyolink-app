import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReceiptModal({
  resolveColor,
  selectedReceipt,
  setSelectedReceipt,
  styles,
  triggerToast,
}) {
  return (
    <Modal
      visible={Boolean(selectedReceipt)}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedReceipt(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.receiptModalCard}>
          {/* Header */}
          <View style={styles.receiptModalHeader}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View style={styles.receiptHeaderBadge}>
                <Ionicons
                  name="checkmark-done-circle"
                  size={18}
                  color={resolveColor('#15803D', 'color')}
                />
              </View>
              <Text style={styles.receiptModalHeaderTitle}>
                Official E-Receipt
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedReceipt(null)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={18}
                color={resolveColor('#163523', 'color')}
              />
            </TouchableOpacity>
          </View>

          {selectedReceipt && (
            <ScrollView
              style={styles.receiptScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Ticket Body */}
              <View style={styles.receiptTicketBox}>
                <Text style={styles.receiptBrandTitle}>
                  SUYOLINK PHILIPPINES
                </Text>
                <Text style={styles.receiptBrandTag}>
                  Community Suyo & Courier Platform
                </Text>
                <Text style={styles.receiptRefDisplay}>
                  {selectedReceipt.refNo}
                </Text>

                <View style={styles.receiptDashedLine} />

                {/* General Info */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction Date:</Text>
                  <Text style={styles.receiptValue}>
                    {selectedReceipt.date}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.receiptValue,
                      {
                        color: resolveColor('#15803D', 'color'),
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {selectedReceipt.status} · Verified
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Category:</Text>
                  <Text style={styles.receiptValue}>
                    {selectedReceipt.category}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Suyo / Task:</Text>
                  <Text
                    style={[
                      styles.receiptValue,
                      { flex: 1, textAlign: 'right' },
                    ]}
                  >
                    {selectedReceipt.title}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Location:</Text>
                  <Text style={styles.receiptValue}>
                    {selectedReceipt.location}
                  </Text>
                </View>

                <View style={styles.receiptDashedLine} />

                {/* Personnel */}
                {selectedReceipt.doer && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Assigned Courier:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.doer.name} ({selectedReceipt.doer.rating}
                      )
                    </Text>
                  </View>
                )}
                {selectedReceipt.requesterName && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Requester:</Text>
                    <Text style={styles.receiptValue}>
                      {selectedReceipt.requesterName}
                    </Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method:</Text>
                  <Text style={styles.receiptValue}>
                    {selectedReceipt.paymentMethod}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Ref #:</Text>
                  <Text style={styles.receiptValue}>
                    {selectedReceipt.paymentRef}
                  </Text>
                </View>

                <View style={styles.receiptDashedLine} />

                {/* Financial Breakdown */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Base Suyo Reward:</Text>
                  <Text style={styles.receiptValue}>
                    ₱{selectedReceipt.amount.toFixed(2)}
                  </Text>
                </View>
                {selectedReceipt.platformFee > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>
                      Platform Convenience Fee:
                    </Text>
                    <Text style={styles.receiptValue}>
                      ₱{selectedReceipt.platformFee.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Total Amount:</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₱{selectedReceipt.totalAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Proof Badge */}
                <View style={styles.receiptProofBox}>
                  <Ionicons
                    name="shield-checkmark"
                    size={17}
                    color={resolveColor('#059669', 'color')}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptProofTitle}>
                      Proof of Delivery Verified
                    </Text>
                    <Text style={styles.receiptProofSub}>
                      {selectedReceipt.proofDetails ||
                        'Cryptographically stamped photo & GPS handover verified by SuyoLink.'}
                    </Text>
                  </View>
                </View>

                {/* Barcode Simulator */}
                <View style={styles.receiptBarcodeBox}>
                  <View style={styles.receiptBarcodeBars} />
                  <Text style={styles.receiptBarcodeText}>
                    * {selectedReceipt.refNo} *
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.receiptActionsRow}>
                <TouchableOpacity
                  style={styles.receiptShareActionBtn}
                  onPress={() => {
                    triggerToast(
                      'E-Receipt downloaded & saved to device',
                      'download-outline',
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={15}
                    color={resolveColor('#163523', 'color')}
                  />
                  <Text style={styles.receiptShareActionBtnText}>
                    Save / Share Receipt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.receiptCloseActionBtn}
                  onPress={() => setSelectedReceipt(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.receiptCloseActionBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
