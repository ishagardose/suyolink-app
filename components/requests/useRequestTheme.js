import { useMemo } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { resolvePaletteColor } from '../../theme/paletteAdapter';
import { createRequestFormStyles } from './RequestForm.styles';
export default function useRequestTheme() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => createRequestFormStyles(colors, isDark),
    [colors, isDark],
  );
  const resolveColor = (value, property = 'color') =>
    resolvePaletteColor(value, property, colors, isDark);
  return { colors, isDark, styles, resolveColor };
}
