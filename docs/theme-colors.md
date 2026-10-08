# Theme colors

Use `useTheme().colors` for UI surfaces, text, borders, inputs, notices, button states, and modal backdrops. These tokens describe a purpose and have light/dark values in `theme/colors.js`.

Use `FIXED_COLORS` from that file only when the visual identity must remain the same: brand artwork, gold rating stars, verification badges, or blue doer markers. White text on a primary button should still use `colors.onPrimary`; white cards should use `colors.card` so they can change with the theme.

Profile, calendar, and clock styles live in separate style factories that receive the current theme colors. Recreate them with `useMemo` when `colors` changes. Add reusable color roles to both palettes instead of placing hex values in components.

Legacy screens still contain hardcoded colors and need conversion by UI role. Do not replace every matching hex value with the same token: a white card and white text on a green button serve different purposes.
