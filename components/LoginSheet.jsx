import React from 'react';
import { useRouter } from 'expo-router';
import AuthSheet from './AuthSheet';
import { useDeviceLocation } from '../context/LocationContext';

export default function LoginSheet({
  visible,
  onClose,
  onSwitchToSignUp,
  onLoginSuccess,
}) {
  const router = useRouter();
  const { hasSavedLocation } = useDeviceLocation();
  return (
    <AuthSheet
      mode="login"
      visible={visible}
      onClose={onClose}
      onSwitch={onSwitchToSignUp}
      onSuccess={
        onLoginSuccess ??
        (() => {
          if (!hasSavedLocation) {
            router.replace('/set-location');
          } else {
            router.replace('/dashboard');
          }
        })
      }
    />
  );
}
