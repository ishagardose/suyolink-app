import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from '../themed/ThemedText';
import TaskCard from '../cards/TaskCard';

export default function AvailableSuyos({ suyos }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <ThemedText style={styles.sectionHeading}>Available suyos</ThemedText>
        <TouchableOpacity activeOpacity={0.7}>
          <ThemedText style={styles.seeAllText}>View all</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.tasksList}>
        {suyos.map((suyo) => (
          <TaskCard key={suyo.id} suyo={suyo} />
        ))}
      </View>
    </>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    sectionHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      marginBottom: 12,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.link,
    },
    tasksList: {
      gap: 10,
    },
  });
