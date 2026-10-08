import React from 'react';
import { getInitials } from '../utils/dashboardHelpers';
import { DEFAULT_DOER } from '../data/dashboardData';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SuyoContactDetails({
  handleCallDoer,
  resolveColor,
  router,
  selectedSuyo,
  selectedSuyoContext,
  setSelectedSuyo,
  styles,
  userProfile,
}) {
  return selectedSuyoContext === 'accepted' ||
    selectedSuyoContext === 'completed' ? (
    <TouchableOpacity
      style={styles.detailDoerHighlightCard}
      activeOpacity={0.75}
      onPress={() => {
        const userId =
          selectedSuyo.rawRequest?.providerId || selectedSuyo.providerId;
        if (!userId) return;
        setSelectedSuyo(null);
        router.push({ pathname: '/profile', params: { userId } });
      }}
      accessibilityRole="button"
      accessibilityLabel="View courier profile"
    >
      <View style={styles.detailDoerAvatar}>
        <Text style={styles.detailDoerAvatarInitials}>
          {getInitials(selectedSuyo.doer?.name || DEFAULT_DOER.name)}
        </Text>
      </View>
      <View style={styles.detailDoerTextCol}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text style={styles.detailDoerNameText}>
            {selectedSuyo.doer?.name || DEFAULT_DOER.name}
          </Text>
          {selectedSuyoContext !== 'completed' && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={resolveColor('#059669', 'color')}
            />
          )}
        </View>
        <Text style={styles.detailDoerMetaText}>
          {selectedSuyoContext === 'completed'
            ? 'Fulfilled your Suyo'
            : 'Accepted Courier'}{' '}
          · {selectedSuyo.doer?.rating || DEFAULT_DOER.rating} ·{' '}
          {selectedSuyo.doer?.vehicle || DEFAULT_DOER.vehicle}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e?.stopPropagation?.();
            handleCallDoer(
              selectedSuyo.doer?.phone || DEFAULT_DOER.phone,
              selectedSuyo.doer?.name || DEFAULT_DOER.name,
            );
          }}
        >
          <Text style={styles.detailDoerPhoneText}>
            📞 {selectedSuyo.doer?.phone || DEFAULT_DOER.phone}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ) : (
    /* Requester Info Row - Fix: user's own cancelled/posted suyo shows Edit instead of Call */
    (() => {
      const isOwnSuyo =
        selectedSuyoContext === 'posted' ||
        selectedSuyoContext === 'cancelled' ||
        selectedSuyoContext === 'archived' ||
        selectedSuyo?.isOwner ||
        selectedSuyo?.requesterName === userProfile?.name ||
        selectedSuyo?.requesterName?.includes('(You)') ||
        selectedSuyo?.requesterName === 'You';

      return (
        <View style={styles.detailRequestorRow}>
          <TouchableOpacity
            style={styles.detailRequestorLeft}
            activeOpacity={0.75}
            onPress={() => {
              setSelectedSuyo(null);
              if (isOwnSuyo) {
                router.push({
                  pathname: '/profile',
                  params: { isOtherUser: 'false' },
                });
              } else {
                const userId =
                  selectedSuyo.rawRequest?.requesterId ||
                  selectedSuyo.requesterId;
                if (!userId) return;
                router.push({
                  pathname: '/profile',
                  params: { userId },
                });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isOwnSuyo ? 'View and edit profile' : 'View profile'
            }
          >
            <View style={styles.detailAvatarCircle}>
              <Text style={styles.detailAvatarInitials}>
                {isOwnSuyo
                  ? getInitials(userProfile?.name || 'Community member')
                  : selectedSuyo.requesterInitials ||
                    getInitials(
                      selectedSuyo.requesterName ||
                        userProfile?.name ||
                        'Community member',
                    )}
              </Text>
            </View>
            <View style={styles.detailRequestorTextCol}>
              <Text style={styles.detailRequestorName}>
                {isOwnSuyo
                  ? `${userProfile?.name || 'Community member'} (You)`
                  : selectedSuyo.requesterName || 'Requester'}
              </Text>
              <Text style={styles.detailRequestorMeta}>
                {isOwnSuyo
                  ? `Requester (You) · ${userProfile?.rating || 'No ratings yet'}`
                  : 'Requester'}
              </Text>
              <View style={styles.detailRequestorPhoneRow}>
                <Ionicons
                  name="call"
                  size={11}
                  color={resolveColor('#6D8777', 'color')}
                />
                <Text style={styles.detailRequestorPhoneText}>
                  {isOwnSuyo
                    ? userProfile?.phone || 'No phone added'
                    : selectedSuyo.requesterPhone ||
                      'Contact shared after acceptance'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* If user's own profile (like cancelled or posted suyo), show EDIT button instead of CALL button! */}
          {isOwnSuyo ? (
            <TouchableOpacity
              style={styles.detailRequestorEditBtn}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedSuyo(null);
                router.push({
                  pathname: '/profile',
                  params: { isOtherUser: 'false' },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons
                name="pencil"
                size={17}
                color={resolveColor('#1E4D2B', 'color')}
              />
            </TouchableOpacity>
          ) : (
            /* Only for other users in public available feed, show functional CALL button */
            selectedSuyoContext === 'available' && (
              <TouchableOpacity
                style={styles.detailRequestorCallBtn}
                activeOpacity={0.7}
                onPress={() =>
                  handleCallDoer(
                    selectedSuyo.requesterPhone || '',
                    selectedSuyo.requesterName || 'Requester',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Call requester"
              >
                <Ionicons
                  name="call"
                  size={18}
                  color={resolveColor('#1E4D2B', 'color')}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      );
    })()
  );
}
