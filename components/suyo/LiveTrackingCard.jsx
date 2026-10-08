import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';

export default function LiveTrackingCard({ request, userId }) {
  const router = useRouter();
  const { colors } = useTheme();
  const participant =
    request.requesterId === userId || request.providerId === userId;
  const active = ['assigned', 'in_progress'].includes(request.status);
  if (!participant || !request.providerId || !active) return null;
  const doer = request.providerId === userId;
  return (
    <View
      style={{
        padding: 18,
        gap: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            padding: 10,
            borderRadius: 12,
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Ionicons
            name="navigate-outline"
            size={22}
            color={colors.link}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
            Live tracking
          </ThemedText>
          <ThemedText
            tone="textMuted"
            style={{ fontSize: 12 }}
          >
            Private to you and your task partner
          </ThemedText>
        </View>
      </View>
      <ThemedText
        tone="textMuted"
        style={{ lineHeight: 21 }}
      >
        {doer
          ? 'Share your position while heading to the task. You control when sharing starts and stops.'
          : 'See your doer’s position and the task destination when they choose to share.'}
      </ThemedText>
      <ThemedButton
        title={doer ? 'Open live tracking' : 'Track my doer'}
        onPress={() =>
          router.push({ pathname: '/map', params: { requestId: request.id } })
        }
      />
    </View>
  );
}
