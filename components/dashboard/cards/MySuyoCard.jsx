import useRequestStatusLabel from '../../../hooks/useRequestStatusLabel';
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MySuyoCard({
  handleBoostReward,
  handleOpenSuyoDetail,
  handleToggleMySuyoSelect,
  isMySuyoEditMode,
  isSelected,
  mySuyoNavTab,
  resolveColor,
  styles,
  suyo,
}) {
  const statusLabel = useRequestStatusLabel(suyo.rawRequest || {});
  return (
    <TouchableOpacity
      key={suyo.id}
      style={[
        styles.mySuyoCardItem,
        isMySuyoEditMode && isSelected && styles.mySuyoCardItemSelected,
      ]}
      activeOpacity={0.88}
      onPress={() => {
        if (isMySuyoEditMode) {
          handleToggleMySuyoSelect(suyo.id);
        } else {
          handleOpenSuyoDetail(suyo, mySuyoNavTab);
        }
      }}
    >
      {/* Top Row: Title + Reward (Green Pxxx) */}
      <View style={styles.mySuyoCardTopRow}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingRight: 10,
          }}
        >
          {isMySuyoEditMode && (
            <View
              style={[
                styles.mySuyoSelectionCircle,
                isSelected && styles.mySuyoSelectionCircleSelected,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={11}
                  color={resolveColor('#FFFFFF', 'color')}
                />
              )}
            </View>
          )}
          <Text
            style={styles.mySuyoCardTitle}
            numberOfLines={1}
          >
            {suyo.title}
          </Text>
        </View>
        <Text style={styles.mySuyoCardRewardText}>{suyo.reward}</Text>
      </View>

      {/* Second Row: Status & Date (Image 2 style - clean colored text, no stretched highlight) */}
      <View style={styles.mySuyoCardSubRow}>
        <Text
          style={[
            styles.mySuyoCardStatusText,
            suyo.status === 'Cancelled'
              ? { color: resolveColor('#DC2626', 'color') }
              : suyo.status?.includes('Completed')
                ? { color: resolveColor('#15803D', 'color') }
                : suyo.status?.includes('In Progress')
                  ? { color: resolveColor('#0284C7', 'color') }
                  : suyo.status === 'Archived Template'
                    ? {
                        color: resolveColor('#64748B', 'color'),
                      }
                    : {
                        color: resolveColor('#0369A1', 'color'),
                      },
          ]}
        >
          {statusLabel === 'Expired' ? statusLabel : suyo.status}
        </Text>
        <Text style={styles.mySuyoCardDateDot}>·</Text>
        <Text style={styles.mySuyoCardDateText}>
          {suyo.formattedDate || 'Recent'}
        </Text>
      </View>

      {/* Tab-Specific Feature Rows */}

      {/* In Posted: Boost Prompt if waiting long */}
      {mySuyoNavTab === 'posted' &&
        suyo.needsBoost &&
        !isMySuyoEditMode &&
        suyo.status !== 'Cancelled' && (
          <View style={styles.mySuyoCardBoostRow}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                flex: 1,
              }}
            >
              <Ionicons
                name="sparkles"
                size={13}
                color={resolveColor('#059669', 'color')}
              />
              <Text style={styles.mySuyoCardBoostPromptText}>
                No doer yet? Boost reward
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.mySuyoCardQuickBoostBtn}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBoostReward(suyo.id, 20);
                }}
              >
                <Text style={styles.mySuyoCardQuickBoostText}>+₱20</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mySuyoCardQuickBoostBtn,
                  styles.mySuyoCardQuickBoostBtnGreen,
                ]}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBoostReward(suyo.id, 50);
                }}
              >
                <Text
                  style={[
                    styles.mySuyoCardQuickBoostText,
                    { color: resolveColor('#FFFFFF', 'color') },
                  ]}
                >
                  +₱50
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* In Accepted: Courier Strip */}
      {mySuyoNavTab === 'accepted' && suyo.doer && (
        <View style={styles.mySuyoCourierStrip}>
          <Text
            style={styles.mySuyoCourierStripText}
            numberOfLines={1}
          >
            Courier:{' '}
            <Text
              style={{
                fontWeight: '700',
                color: resolveColor('#163523', 'color'),
              }}
            >
              {suyo.doer.name}
            </Text>{' '}
            ({suyo.doer.rating})
          </Text>
        </View>
      )}

      {/* In Completed: Courier Who Fulfilled Strip */}
      {mySuyoNavTab === 'completed' && suyo.doer && (
        <View style={styles.mySuyoCourierStrip}>
          <Text
            style={styles.mySuyoCourierStripText}
            numberOfLines={1}
          >
            Fulfilled by{' '}
            <Text
              style={{
                fontWeight: '700',
                color: resolveColor('#163523', 'color'),
              }}
            >
              {suyo.doer.name}
            </Text>{' '}
            ({suyo.doer.rating})
          </Text>
        </View>
      )}

      {/* Footer Row: Location Pin */}
      <View style={styles.mySuyoCardFooter}>
        <View style={styles.mySuyoCardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={13}
            color={resolveColor('#0D9488', 'color')}
          />
          <Text
            style={styles.mySuyoCardLocationText}
            numberOfLines={1}
          >
            {suyo.location}
          </Text>
        </View>

        <Text style={styles.mySuyoTapDetailHint}>Tap for options →</Text>
      </View>
    </TouchableOpacity>
  );
}
