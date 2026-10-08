import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
