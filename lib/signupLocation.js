import AsyncStorage from '@react-native-async-storage/async-storage';
export const signupLocationKey = (email) =>
  `@suyolink/signup-location/${encodeURIComponent(email.trim().toLowerCase())}`;
export const stageSignupLocation = (email, position, source) =>
  AsyncStorage.setItem(
    signupLocationKey(email),
    JSON.stringify({ position, source, acknowledged: true }),
  );
