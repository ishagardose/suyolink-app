import React from 'react';
import { useRouter } from 'expo-router';
import AuthSheet from './AuthSheet';
export default function LoginSheet({ visible, onClose, onSwitchToSignUp, onLoginSuccess }) {
  const router = useRouter();
  return <AuthSheet mode="login" visible={visible} onClose={onClose} onSwitch={onSwitchToSignUp}
    onSuccess={onLoginSuccess ?? (() => router.replace('/dashboard'))} />;
}
