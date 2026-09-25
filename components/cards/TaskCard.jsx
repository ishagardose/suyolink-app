import ThemedText from '../themed/ThemedText';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function TaskCard({ suyo }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
                <View style={styles.taskCard}>
                  <View style={styles.taskIconWrapper}>
                    <Ionicons name="bicycle-outline" size={24} color={colors.link} />
                  </View>
                  <View style={styles.taskMeta}>
                    <ThemedText style={styles.taskTitle} numberOfLines={1}>
                      {suyo.title}
                    </ThemedText>
                    <ThemedText style={styles.taskSub}>
                      {suyo.type} • {suyo.distance}
                    </ThemedText>
                  </View>
                  <View style={styles.taskPriceColumn}>
                    <ThemedText style={styles.taskPrice}>{suyo.reward}</ThemedText>
                    <View style={styles.statusPillTransit}>
                      <ThemedText style={styles.statusPillTextTransit}>{suyo.postedTime}</ThemedText>
                    </View>
                  </View>
                </View>
  );
}
const createStyles = (colors) => StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  taskMeta: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  taskSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  taskPriceColumn: {
    alignItems: 'flex-end',
  },
  taskPrice: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statusPillTransit: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.warningSurface,
  },
  statusPillTextTransit: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.warning,
  },
});
