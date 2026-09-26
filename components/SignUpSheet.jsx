import React from 'react';
import { useRouter } from 'expo-router';
import AuthSheet from './AuthSheet';
export default function SignUpSheet({ visible, onClose, onSwitchToLogin, onSignUpSuccess }) {
  const router = useRouter();
  return <AuthSheet mode="signup" visible={visible} onClose={onClose} onSwitch={onSwitchToLogin}
    onSuccess={onSignUpSuccess ?? (() => router.replace('/welcome'))} />;
}
