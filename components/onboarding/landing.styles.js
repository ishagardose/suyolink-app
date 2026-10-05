import { StyleSheet } from 'react-native';
export default function createLandingStyles(colors, screenWidth) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.brand, // Signature deep Hunter Green
    },

    /* ------------------------------------------- */
    /* 1. Initial Splash Screen Styles             */
    /* ------------------------------------------- */
    initialScreenContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.brand,
    },
    initialSafeArea: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 24,
    },
    centerLogoWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoColumn: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    logoImageContainer: {
      width: 210,
      height: 210,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 8,
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    bottomChevronContainer: {
      paddingBottom: 24,
    },
    chevronButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },

    /* ------------------------------------------- */
    /* 2. Onboarding Screen Styles                 */
    /* ------------------------------------------- */
    secondScreenOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.brand,
      zIndex: 10,
    },
    secondScreenHeaderSafeArea: {
      flex: 1,
      backgroundColor: colors.brand,
    },
    topNavBar: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      backgroundColor: colors.brand,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    helpButtonText: {
      color: colors.onBrand,
      fontSize: 14,
      fontWeight: '600',
    },
    whiteSheet: {
      flex: 1,
      backgroundColor: colors.card,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      overflow: 'hidden',
      marginTop: 8,
      justifyContent: 'space-between',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    stickerWrapper: {
      flex: 1.15,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      paddingHorizontal: 20,
    },
    stickerAnimatedWrapper: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickerImage: {
      width: screenWidth * 0.84,
      height: '100%',
      maxHeight: 310,
    },
    sheetContent: {
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 8,
    },
    textClickableWrapper: {
      alignItems: 'center',
      width: '100%',
    },
    textAnimatedWrapper: {
      alignItems: 'center',
      width: '100%',
    },
    titleText: {
      fontSize: 27,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 300,
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
    },
    paginationDot: {
      height: 4,
      borderRadius: 3,
    },
    paginationDotInactive: {
      width: 14,
      backgroundColor: colors.border,
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
    bottomButtonsWrapper: {
      paddingHorizontal: 24,
      paddingBottom: 16,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.primary, // Signature Hunter Green
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    secondaryButton: {
      backgroundColor: colors.card,
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.link,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.link,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}
