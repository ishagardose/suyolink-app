import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function useLocationPickerStyles() {
  const { colors } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        gap: 8,
        marginTop: 4,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      headerTitleBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
      },
      locateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
      },
      disabledButton: {
        opacity: 0.6,
      },
      locateButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.link,
      },
      helperText: {
        fontSize: 12,
        lineHeight: 16,
      },
      mapCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.2,
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      },
      mapInner: {
        height: 220,
        width: '100%',
      },
      pinStatusFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      pinIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
      },
      pinDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      pinStatusText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: colors.textMuted,
      },
      verifiedPinPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
      },
      verifiedPinText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.link,
      },
      errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.dangerSurface,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
      },
      errorText: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '500',
      },
    });
  }, [colors]);
}
