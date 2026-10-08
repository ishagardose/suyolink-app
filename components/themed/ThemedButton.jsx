import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ThemedText from './ThemedText';

export default function ThemedButton({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityState,
  onPress,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  const foreground =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : colors.link;

  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: !isInteractive,
        busy: loading,
      }}
      disabled={!isInteractive}
      activeOpacity={0.65}
      onMouseEnter={(e) => {
        if (isInteractive) setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      style={[
        styles.button,
        {
          backgroundColor:
            variant === 'danger'
              ? colors.danger
              : variant === 'primary'
                ? colors.primary
                : colors.surfaceAlt,
          opacity: isInteractive ? 1 : 0.6,
        },
        hovered &&
          isInteractive &&
          (variant === 'primary'
            ? {
                backgroundColor: colors.primaryHover,
                transform: [{ scale: 1.015 }],
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }
            : variant === 'danger'
              ? {
                  backgroundColor: colors.dangerHover,
                  transform: [{ scale: 1.015 }],
                  elevation: 2,
                }
              : {
                  backgroundColor: colors.surfaceHover,
                  borderColor: colors.hoverBorder,
                  borderWidth: 1,
                  transform: [{ scale: 1.015 }],
                  elevation: 2,
                }),
        typeof style === 'function'
          ? style({ pressed: false, hovered })
          : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <ThemedText style={[styles.text, { color: foreground }, textStyle]}>
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
});
