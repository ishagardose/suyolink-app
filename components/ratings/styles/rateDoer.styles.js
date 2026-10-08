import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0EC',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* PROFILE CARD */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#D8E7DF',
    padding: 16,
    marginBottom: 16,
    gap: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 3px 10px rgba(22,53,35,0.05)' }
      : {
          shadowColor: '#163523',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D0E4D8',
  },
  avatarInitialsText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1E4D2B',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#163523',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#556E60',
  },
  statsDot: {
    fontSize: 11,
    color: '#8EA296',
    marginHorizontal: 2,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F8F5',
    borderWidth: 1,
    borderColor: '#DFECE5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  taskPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334B3D',
  },

  /* RATING CARD */
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#D8E7DF',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 3px 10px rgba(22,53,35,0.05)' }
      : {
          shadowColor: '#163523',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#658071',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#637A6D',
    textAlign: 'center',
    marginBottom: 14,
  },
  sectionSubtitleLeft: {
    fontSize: 12,
    fontWeight: '500',
    color: '#637A6D',
    marginBottom: 14,
    lineHeight: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  starTouch: {
    padding: 4,
  },
  ratingLabelBadge: {
    backgroundColor: '#F5FAF7',
    borderWidth: 1,
    borderColor: '#D4E4DC',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },

  /* OPTIONS (2-COLUMN GRID, NO CHECKBOXES, SMOOTH EDGES) */
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#D8E7DF',
    padding: 18,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 3px 10px rgba(22,53,35,0.05)' }
      : {
          shadowColor: '#163523',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  optionCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.4,
    minHeight: 52,
  },
  optionCardUnselected: {
    backgroundColor: '#FAFCFA',
    borderColor: '#E0EBE4',
  },
  optionCardSelected: {
    backgroundColor: '#EAF6F0',
    borderColor: '#1E4D2B',
  },
  optionIcon: {
    flexShrink: 0,
  },
  optionLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#345241',
    lineHeight: 16,
    flex: 1,
  },
  optionLabelTextSelected: {
    color: '#163523',
    fontWeight: '800',
  },

  /* COMMENTS CARD */
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#D8E7DF',
    padding: 18,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 3px 10px rgba(22,53,35,0.05)' }
      : {
          shadowColor: '#163523',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  commentInput: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1.2,
    borderColor: '#D0E2D7',
    borderRadius: 18,
    padding: 14,
    fontSize: 13,
    color: '#163523',
    minHeight: 92,
  },
  charCount: {
    fontSize: 11,
    color: '#8EA296',
    textAlign: 'right',
    marginTop: 6,
  },

  /* SUBMIT BUTTON */
  submitButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 24,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(30,77,43,0.25)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  submitButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* SUCCESS MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E4D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 6,
  },
  successModalSub: {
    fontSize: 13,
    color: '#556E60',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  ratingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F8F5',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    marginBottom: 20,
  },
  starsCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingSummaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#163523',
  },
  successDoneButton: {
    backgroundColor: '#1E4D2B',
    width: '100%',
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
