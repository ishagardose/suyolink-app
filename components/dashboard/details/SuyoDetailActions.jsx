import React from 'react';
import { DEFAULT_DOER } from '../data/dashboardData';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SuyoDetailActions({
  archivedSuyos,
  handleCallDoer,
  handleCancelSuyo,
  handleCloseDetailModal,
  handleOpenEditSuyo,
  handleRepeatRequest,
  handleSaveToArchive,
  resolveColor,
  router,
  selectedSuyo,
  selectedSuyoContext,
  setCancelledSuyos,
  setDoerAcceptedSuyos,
  setOpenedFromFavorites,
  setSelectedSuyo,
  styles,
  triggerToast,
}) {
  return (
    <View style={styles.detailActionButtonsRow}>
      {/* POSTED NAV BUTTONS (Edit, Cancel, or Re-post) */}
      {selectedSuyoContext === 'posted' &&
        (selectedSuyo.status !== 'Cancelled' ? (
          <>
            <TouchableOpacity
              style={styles.detailEditSuyoBtn}
              onPress={() => handleOpenEditSuyo(selectedSuyo)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="pencil"
                size={15}
                color={resolveColor('#163523', 'color')}
              />
              <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailCancelSuyoBtn}
              onPress={() => handleCancelSuyo(selectedSuyo.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close-circle-outline"
                size={15}
                color={resolveColor('#DC2626', 'color')}
              />
              <Text style={styles.detailCancelSuyoBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.detailPrimaryActionBtn}
            onPress={() => handleRepeatRequest(selectedSuyo)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={resolveColor('#FFFFFF', 'color')}
            />
            <Text style={styles.detailPrimaryActionBtnText}>Re-post Suyo</Text>
          </TouchableOpacity>
        ))}

      {/* ACCEPTED NAV BUTTONS (Call Doer & Track Live) */}
      {selectedSuyoContext === 'accepted' && (
        <>
          <TouchableOpacity
            style={styles.detailCallDoerBtn}
            onPress={() =>
              handleCallDoer(selectedSuyo.doer?.phone || DEFAULT_DOER.phone)
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="call"
              size={15}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.detailCallDoerBtnText}>Call Doer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailTrackCourierBtn}
            activeOpacity={0.8}
            onPress={() => {
              handleCloseDetailModal();
              router.push({
                pathname: '/map',
                params: {
                  id: selectedSuyo.id,
                  title: selectedSuyo.title,
                  doerName: selectedSuyo.doer?.name || DEFAULT_DOER.name,
                  doerPhone: selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
                },
              });
            }}
          >
            <Ionicons
              name="navigate"
              size={16}
              color={resolveColor('#FFFFFF', 'color')}
            />
            <Text style={styles.detailTrackCourierBtnText}>Track</Text>
          </TouchableOpacity>
        </>
      )}

      {/* COMPLETED NAV BUTTONS (Save to Archive, Repeat Suyo) */}
      {selectedSuyoContext === 'completed' &&
        (() => {
          const isArchived =
            selectedSuyo &&
            archivedSuyos.some(
              (a) => a.id === selectedSuyo.id || a.title === selectedSuyo.title,
            );
          return (
            <>
              <TouchableOpacity
                style={[
                  styles.detailArchiveSuyoBtn,
                  isArchived && styles.detailArchiveSuyoBtnYellow,
                ]}
                onPress={() => handleSaveToArchive(selectedSuyo)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isArchived ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={
                    isArchived
                      ? resolveColor('#78350F', 'color')
                      : resolveColor('#163523', 'color')
                  }
                />
                <Text
                  style={[
                    styles.detailArchiveSuyoBtnText,
                    isArchived && styles.detailArchiveSuyoBtnTextYellow,
                  ]}
                >
                  {isArchived ? 'Archived' : 'Archive'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailRepeatSuyoBtn}
                onPress={() => handleRepeatRequest(selectedSuyo)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={15}
                  color={resolveColor('#FFFFFF', 'color')}
                />
                <Text style={styles.detailRepeatSuyoBtnText}>Repeat Suyo</Text>
              </TouchableOpacity>
            </>
          );
        })()}

      {/* CANCELLED NAV BUTTONS (Delete unwanted suyo & Re-post Suyo) */}
      {selectedSuyoContext === 'cancelled' && (
        <>
          <TouchableOpacity
            style={styles.detailCancelSuyoBtn}
            onPress={() => {
              const idToDelete = selectedSuyo.id;
              setCancelledSuyos((prev) =>
                prev.filter((s) => s.id !== idToDelete),
              );
              setSelectedSuyo(null);
              triggerToast('suyo is successfully deleted', 'trash-outline');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={resolveColor('#DC2626', 'color')}
            />
            <Text style={styles.detailCancelSuyoBtnText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailRepeatSuyoBtn}
            onPress={() => handleRepeatRequest(selectedSuyo)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={15}
              color={resolveColor('#FFFFFF', 'color')}
            />
            <Text style={styles.detailRepeatSuyoBtnText}>Re-post Suyo</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ARCHIVED NAV BUTTONS (Edit Template, Repeat Request) */}
      {selectedSuyoContext === 'archived' && (
        <>
          <TouchableOpacity
            style={styles.detailEditSuyoBtn}
            onPress={() => handleOpenEditSuyo(selectedSuyo)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pencil"
              size={15}
              color={resolveColor('#163523', 'color')}
            />
            <Text style={styles.detailEditSuyoBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailRepeatSuyoBtn}
            onPress={() => handleRepeatRequest(selectedSuyo)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="paper-plane"
              size={15}
              color={resolveColor('#FFFFFF', 'color')}
            />
            <Text style={styles.detailRepeatSuyoBtnText}>Post Suyo</Text>
          </TouchableOpacity>
        </>
      )}

      {/* AVAILABLE / EXPLORE FEED BUTTON (Keep Fulfill for Couriers) */}
      {selectedSuyoContext === 'available' && (
        <TouchableOpacity
          style={styles.detailFulfillBtn}
          activeOpacity={0.8}
          onPress={() => {
            const taskToFulfill = selectedSuyo;
            setSelectedSuyo(null);
            setOpenedFromFavorites(false);
            if (taskToFulfill) {
              setDoerAcceptedSuyos((prev) => {
                if (prev.some((s) => s.id === taskToFulfill.id)) return prev;
                return [
                  {
                    id: taskToFulfill.id,
                    title: taskToFulfill.title,
                    category: taskToFulfill.category || 'General',
                    icon: taskToFulfill.icon || 'bicycle',
                    location: taskToFulfill.location || 'Tagum City',
                    distanceText: taskToFulfill.distanceText || '0.8 km away',
                    reward: taskToFulfill.reward || '₱150',
                    requesterName:
                      taskToFulfill.requesterName || 'Community Member',
                    requesterPhone:
                      taskToFulfill.requesterPhone || '09564781552',
                    deadline: taskToFulfill.timeBadge || 'Within 2 hours',
                    acceptedAt: 'Today · Just now',
                    details:
                      taskToFulfill.details ||
                      'Fulfill this suyo request according to requester requirements.',
                    notes: taskToFulfill.notes || 'Handle with care.',
                    status: 'Accepted · In Progress',
                  },
                  ...prev,
                ];
              });
            }
            router.push({
              pathname: '/fulfill',
              params: {
                id: taskToFulfill?.id || 'SYL-102',
                title:
                  taskToFulfill?.title || 'Quick Grocery Delivery (5 items)',
                category: taskToFulfill?.category || 'Groceries',
                location: taskToFulfill?.location || 'SM Tagum',
                distanceText: taskToFulfill?.distanceText || '0.8 km away',
                reward: taskToFulfill?.reward || '₱150',
                requesterName: taskToFulfill?.requesterName || 'Maria Santos',
                requesterLocation: taskToFulfill?.location || 'Quezon City',
                requesterPhone: taskToFulfill?.requesterPhone || '09564781552',
                details: taskToFulfill?.details || 'Grocery delivery items',
              },
            });
          }}
        >
          <Ionicons
            name="bicycle"
            size={18}
            color={resolveColor('#FFFFFF', 'color')}
          />
          <Text style={styles.detailFulfillBtnText}>Fulfill Suyo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
