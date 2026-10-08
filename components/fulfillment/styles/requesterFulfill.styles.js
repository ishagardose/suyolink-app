import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

  /* TOP APP HEADER */
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE5',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F2',
  },
  navBarTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  headerRightAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5EF',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* 1. TITLE HEADER */
  titleHeaderSection: {
    marginBottom: 16,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulsingActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4D2B',
  },
  activeSuyoTaskSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.8,
  },
  rewardBadge: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  taskHeadlineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 6,
  },
  headerArrivalRequesterBlock: {
    marginBottom: 12,
  },
  headerEstimatedArrivalTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  headerRequesterNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52695C',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5DF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334B3D',
  },

  /* 2. PROGRESS DIAGRAM */
  progressDiagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  diagramTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepNodeBlock: {
    alignItems: 'center',
    minWidth: 54,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#1E4D2B',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(30,77,43,0.28)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  stepCirclePast: {
    backgroundColor: '#2F6A42',
  },
  stepCirclePending: {
    backgroundColor: '#EEF4F0',
    borderWidth: 1.5,
    borderColor: '#D4E2D9',
  },
  stepNumberPendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718A7C',
  },
  stepNodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718A7C',
    textAlign: 'center',
  },
  stepNodeLabelActive: {
    color: '#1E4D2B',
    fontWeight: '800',
  },
  stepNodeLabelPast: {
    color: '#2F6A42',
    fontWeight: '700',
  },
  stepConnectorLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  stepConnectorLineActive: {
    backgroundColor: '#2F6A42',
  },
  stepConnectorLineInactive: {
    backgroundColor: '#E2ECE5',
  },

  /* 3. LIVE ROUTE MAP */
  mapSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    padding: 12,
    marginBottom: 18,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  mapTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  mapSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#163523',
    letterSpacing: -0.2,
  },
  distanceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  mapViewportWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE8E0',
    backgroundColor: '#F3F7F4',
  },
  mapCanvas: {
    flex: 1,
  },
  routeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  routePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routePointBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePointText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#415B4D',
    flex: 1,
  },

  /* PROOF BANNER */
  proofUploadedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBF5EF',
    borderWidth: 1,
    borderColor: '#C5DEC9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  proofUploadedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4D2B',
    flex: 1,
  },

  /* 4. TRACK & TRACE */
  trackTraceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    padding: 16,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }),
  },
  trackTraceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F0',
  },
  trackTraceTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#163523',
    letterSpacing: 0.8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  timelineDotCircleCompleted: {
    borderColor: '#1E4D2B',
  },
  timelineDotCirclePending: {
    borderColor: '#C3D6CC',
    backgroundColor: '#F8FAF8',
  },
  timelineInnerDotCompleted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E4D2B',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 52,
    marginVertical: 2,
  },
  timelineVerticalLineActive: {
    backgroundColor: '#1E4D2B',
  },
  timelineVerticalLineInactive: {
    backgroundColor: '#DDE9E2',
  },
  timelineContentBlock: {
    flex: 1,
    paddingBottom: 18,
  },
  timelineItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#163523',
    marginBottom: 2,
  },
  timelineItemTitleMuted: {
    color: '#869F91',
  },
  timelineItemRoute: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D2B',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  timelineItemActor: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#52695C',
    marginBottom: 3,
  },
  timelineItemQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#385344',
    lineHeight: 17,
    marginBottom: 4,
  },
  timelineItemTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#718A7C',
  },

  /* 5. BUTTON: MARK AS RECEIVED & RATE THE DOER */
  markReceivedButton: {
    backgroundColor: '#1E4D2B',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(30,77,43,0.22)' }
      : {
          shadowColor: '#1E4D2B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 4,
        }),
    marginBottom: 24,
  },
  markReceivedButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* PROOF PREVIEW MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  previewModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#163523',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofModalImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
  },
  proofNotesText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#415B4D',
    textAlign: 'center',
    marginBottom: 16,
  },
  closePreviewBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  closePreviewBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
