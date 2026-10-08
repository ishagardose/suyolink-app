import React from 'react';
import { Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AcceptedSuyosList({
  doerAcceptedSuyos,
  doerNavTab,
  resolveColor,
  router,
  setActiveTab,
  setDoerCancelModalItem,
  setSelectedDoerSuyo,
  styles,
}) {
  return (
    doerNavTab === 'accepted' && (
      <View style={styles.doerListContainer}>
        {doerAcceptedSuyos.length === 0 ? (
          <View style={styles.doerEmptyCard}>
            <View style={styles.doerEmptyIconCircle}>
              <Ionicons
                name="bicycle-outline"
                size={28}
                color={resolveColor('#8CA395', 'color')}
              />
            </View>
            <Text style={styles.doerEmptyTitle}>No Active Accepted Suyos</Text>
            <Text style={styles.doerEmptySub}>
              Browse the public dashboard to accept and fulfill available suyos
              from nearby requesters.
            </Text>
            <TouchableOpacity
              style={styles.doerBrowseBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('home')}
            >
              <Ionicons
                name="search"
                size={15}
                color={resolveColor('#FFFFFF', 'color')}
              />
              <Text style={styles.doerBrowseBtnText}>
                Browse Available Suyos
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.doerInfoCallout}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={resolveColor('#059669', 'color')}
              />
              <Text style={styles.doerInfoCalloutText}>
                You are assigned as the doer. You can proceed to fulfillment or
                cancel if unable to complete.
              </Text>
            </View>

            {doerAcceptedSuyos.map((suyo) => (
              <TouchableOpacity
                key={suyo.id}
                style={styles.doerAcceptedCard}
                activeOpacity={0.88}
                onPress={() => setSelectedDoerSuyo(suyo)}
              >
                {/* Top row: Category tag & Reward */}
                <View style={styles.doerCardTopRow}>
                  <View style={styles.doerCategoryChip}>
                    <Ionicons
                      name={suyo.icon || 'receipt'}
                      size={13}
                      color={resolveColor('#1E4D2B', 'color')}
                    />
                    <Text style={styles.doerCategoryChipText}>
                      {suyo.category}
                    </Text>
                  </View>
                  <View style={styles.doerRewardBadge}>
                    <Text style={styles.doerRewardText}>+{suyo.reward}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.doerCardTitle}>{suyo.title}</Text>

                {/* Requester Info */}
                <View style={styles.doerRequesterRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={15}
                    color={resolveColor('#557261', 'color')}
                  />
                  <Text style={styles.doerRequesterText}>
                    Requester:{' '}
                    <Text
                      style={{
                        fontWeight: '700',
                        color: resolveColor('#163523', 'color'),
                      }}
                    >
                      {suyo.requesterName}
                    </Text>
                  </Text>
                  {suyo.requesterPhone && (
                    <TouchableOpacity
                      style={styles.doerCallMiniBtn}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        Linking.openURL(`tel:${suyo.requesterPhone}`);
                      }}
                    >
                      <Ionicons
                        name="call"
                        size={11}
                        color={resolveColor('#059669', 'color')}
                      />
                      <Text style={styles.doerCallMiniBtnText}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Location & Time */}
                <View style={styles.doerLocationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={resolveColor('#8CA395', 'color')}
                  />
                  <Text
                    style={styles.doerLocationText}
                    numberOfLines={1}
                  >
                    {suyo.location}
                  </Text>
                  <Text style={styles.doerDot}>•</Text>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={resolveColor('#8CA395', 'color')}
                  />
                  <Text style={styles.doerDeadlineText}>{suyo.deadline}</Text>
                </View>

                {/* Tap hint */}
                <View style={styles.doerTapDetailsHintRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={12}
                    color={resolveColor('#059669', 'color')}
                  />
                  <Text style={styles.doerTapDetailsHintText}>
                    Tap tile to view details & requester profile
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={resolveColor('#059669', 'color')}
                  />
                </View>

                {/* Action Buttons: Continue Suyo & Cancel as Doer */}
                <View style={styles.doerCardActionRow}>
                  <TouchableOpacity
                    style={styles.doerContinueBtn}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      router.push({
                        pathname: '/fulfill',
                        params: {
                          id: suyo.id,
                          title: suyo.title,
                          category: suyo.category,
                          location: suyo.location,
                          distanceText: suyo.distanceText,
                          reward: suyo.reward,
                          requesterName: suyo.requesterName,
                          requesterPhone: suyo.requesterPhone,
                          details: suyo.details,
                        },
                      });
                    }}
                  >
                    <Ionicons
                      name="bicycle"
                      size={15}
                      color={resolveColor('#FFFFFF', 'color')}
                    />
                    <Text style={styles.doerContinueBtnText}>
                      Continue Suyo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doerCancelBtn}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setDoerCancelModalItem(suyo);
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={15}
                      color={resolveColor('#DC2626', 'color')}
                    />
                    <Text style={styles.doerCancelBtnText}>Cancel as Doer</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    )
  );
}
