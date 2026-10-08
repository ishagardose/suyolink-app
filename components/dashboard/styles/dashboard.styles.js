import { StyleSheet } from 'react-native';
import { themeStyles } from '../../../theme/paletteAdapter';
import { baseStyles } from './base.styles';
import { homeStyles } from './home.styles';
import { activeSuyoStyles } from './activeSuyo.styles';
import { navigationStyles } from './navigation.styles';
import { sharedModalStyles } from './sharedModal.styles';
import { filtersStyles } from './filters.styles';
import { suyoDetailsStyles } from './suyoDetails.styles';
import { doerProfileStyles } from './doerProfile.styles';
import { editSuyoStyles } from './editSuyo.styles';
import { favoritesStyles } from './favorites.styles';
import { mySuyoStyles } from './mySuyo.styles';
import { toastStyles } from './toast.styles';
import { doerDetailsStyles } from './doerDetails.styles';
import { notificationsStyles } from './notifications.styles';
import { walletStyles } from './wallet.styles';
import { receiptStyles } from './receipt.styles';
import { statisticsStyles } from './statistics.styles';
import { walletChartStyles } from './walletChart.styles';
import { doerSuyoStyles } from './doerSuyo.styles';
import { doerCancelStyles } from './doerCancel.styles';

const definitions = {
  ...baseStyles,
  ...homeStyles,
  ...activeSuyoStyles,
  ...navigationStyles,
  ...sharedModalStyles,
  ...filtersStyles,
  ...suyoDetailsStyles,
  ...doerProfileStyles,
  ...editSuyoStyles,
  ...favoritesStyles,
  ...mySuyoStyles,
  ...toastStyles,
  ...doerDetailsStyles,
  ...notificationsStyles,
  ...walletStyles,
  ...receiptStyles,
  ...statisticsStyles,
  ...walletChartStyles,
  ...doerSuyoStyles,
  ...doerCancelStyles,
};

export const createDashboardStyles = (colors, isDark) =>
  StyleSheet.create(themeStyles(definitions, colors, isDark));
