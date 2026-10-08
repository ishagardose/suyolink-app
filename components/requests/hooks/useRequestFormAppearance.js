import { useCallback, useMemo } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import {
  resolvePaletteColor,
  themeStyles,
} from '../../../theme/paletteAdapter';
import { styles as lightStyles } from '../RequestForm.styles';

export default function useRequestFormAppearance() {
  const { colors, isDark } = useTheme();
  const resolveColor = useCallback(
    (value, property = 'color') => {
      if (isDark && property === 'backgroundColor') {
        if (['#FAFDFB', '#F5FAF7', '#F6FCF8'].includes(value))
          return colors.input;
        if (['#F0F9FF', '#EFF6FF'].includes(value)) return '#123247';
        if (value === '#F5F3FF') return '#302044';
      }
      return resolvePaletteColor(value, property, colors, isDark);
    },
    [colors, isDark],
  );
  const styles = useMemo(() => {
    const themed = themeStyles(lightStyles, colors, isDark);
    if (!isDark) return themed;
    return Object.fromEntries(
      Object.entries(themed).map(([name, style]) => [
        name,
        {
          ...style,
          ...(lightStyles[name].backgroundColor
            ? {
                backgroundColor: resolveColor(
                  lightStyles[name].backgroundColor,
                  'backgroundColor',
                ),
              }
            : {}),
        },
      ]),
    );
  }, [colors, isDark, resolveColor]);
  return { styles, colors, resolveColor };
}
