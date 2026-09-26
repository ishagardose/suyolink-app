import React from 'react';
import { useRouter } from 'expo-router';
import LoginSheet from '../../components/LoginSheet';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <LoginSheet
      visible={true}
      onClose={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
      onSwitchToSignUp={() => router.replace('/signup')}
    />
  );
}
