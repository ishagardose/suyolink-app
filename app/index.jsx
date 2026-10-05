import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LandingScreen from '../components/onboarding/LandingScreen';

export default function IndexScreen() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Redirect href="/dashboard" /> : <LandingScreen />;
}
