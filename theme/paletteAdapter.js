// Map the existing dashboard palette by its role. Light mode retains its exact
// original colors; brand backgrounds and white text on them remain fixed.
const set = (values) => new Set(values.split(' '));
const primaryText = set(
  '#163523 #143A25 #0F172A #1E293B #27382F #334155 #374151 #344E41 #2D4F38 #425C4D',
);
const greenText = set(
  '#1E4D2B #166534 #15803D #059669 #047857 #064E3B #065F46',
);
const dangerText = set('#DC2626 #D32F2F #B91C1C #991B1B #EF4444 #7F1D1D');
const warningText = set('#D97706 #B45309 #92400E #78350F');
const blueText = set('#0369A1 #0284C7 #2563EB #1E40AF');
const purpleText = set('#7E22CE #9333EA #7C3AED #5B21B6');
const fixedText = set(
  '#FFFFFF #F59E0B #FDE047 #4ADE80 #86EFAC #A8D5B8 #D0EDD9 #D4E8DC #C2DEC9 #D1FAE5',
);
const neutralSurfaces = set(
  '#F8FAF9 #F1F5F9 #F8FAFC #F3F4F6 #F0F5F2 #EEF4F0 #F7FAF8 #F6F9F7 #F4F9F6 #EEF5F1 #F9FBF9 #FAFCFA #F7FCF9 #F8FAF8 #F3F8F5 #F0F7F3 #E5ECE8 #E2E8F0 #FAFDFB #F5FAF7 #F6FCF8 #F0F6F2',
);
const greenSurfaces = set(
  '#EAF4EF #E8F5EE #D7E8DC #D7EBE0 #F3FAF5 #E1EFE7 #EBF5EE #EBF4EE #F0FDF4 #DCFCE7 #F0FAF3 #EBF5EF #F4FAF6 #E6F4EC #ECFDF5 #D1FAE5 #E5F4EC #E2EFE7',
);
const dangerSurfaces = set('#FEE2E2 #FDECEC #FEF2F2 #FFF9F9 #FDEDEC');
const warningSurfaces = set('#FEF3C7 #FFFBEB #FFFDF5 #F4ECE4');

export function resolvePaletteColor(value, property, colors, isDark) {
  if (!isDark || typeof value !== 'string') return value;
  const color = value.toUpperCase();
  if (property === 'shadowColor') return colors.shadow;
  if (property === 'backgroundColor') {
    if (color === '#F4F7F5' || color === '#F5F7F4') return colors.background;
    if (color === '#FFFFFF') return colors.card;
    if (neutralSurfaces.has(color)) return colors.surface;
    if (greenSurfaces.has(color)) return colors.successSurface;
    if (dangerSurfaces.has(color)) return colors.dangerSurface;
    if (warningSurfaces.has(color)) return colors.warningSurface;
    if (['#E0F2FE', '#F0F9FF', '#EFF6FF'].includes(color)) return '#123247';
    if (color === '#F3E8FF' || color === '#F5F3FF') return '#302044';
    if (value.startsWith('rgba(0, 0, 0,')) return colors.backdrop;
    if (value.startsWith('rgba(30, 77, 43,')) return colors.surfaceAlt;
    return value;
  }
  if (/^border.*Color$/.test(property)) {
    if (
      dangerText.has(color) ||
      ['#FECACA', '#F87171', '#F8C8C8'].includes(color)
    )
      return colors.dangerBorder;
    if (
      greenText.has(color) ||
      ['#86EFAC', '#A7F3D0', '#BBF7D0'].includes(color)
    )
      return colors.successBorder;
    return color.startsWith('#') ? colors.border : value;
  }
  if (property === 'color' || property === 'placeholderTextColor') {
    if (value.startsWith('rgba(22, 53, 35,')) return colors.textMuted;
    if (fixedText.has(color) || !color.startsWith('#')) return value;
    if (primaryText.has(color)) return colors.text;
    if (greenText.has(color)) return colors.link;
    if (dangerText.has(color)) return '#FCA5A5';
    if (warningText.has(color)) return colors.warning;
    if (blueText.has(color)) return '#7DD3FC';
    if (purpleText.has(color)) return '#D8B4FE';
    if (color === '#0D9488') return '#5EEAD4';
    return colors.textMuted;
  }
  return value;
}

export function themeStyles(definitions, colors, isDark) {
  if (!isDark) return definitions;
  return Object.fromEntries(
    Object.entries(definitions).map(([name, style]) => [
      name,
      Object.fromEntries(
        Object.entries(style).map(([property, value]) => [
          property,
          resolvePaletteColor(value, property, colors, isDark),
        ]),
      ),
    ]),
  );
}
