import React from 'react';
import { useRouter } from 'expo-router';
import SignUpSheet from '../components/SignUpSheet';

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <SignUpSheet
      visible={true}
      onClose={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
      onSignUpSuccess={() => router.push('/otp-verification')}
      onSwitchToLogin={() => router.replace('/login')}
    />
  );
}
