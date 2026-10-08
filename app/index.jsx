import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDeviceLocation } from '../context/LocationContext';
import LandingScreen from '../components/onboarding/LandingScreen';

export default function IndexScreen() {
  const { isLoggedIn } = useAuth();
  const { hasSavedLocation, isReady } = useDeviceLocation();
  if (!isLoggedIn) return <LandingScreen />;
  if (isReady && !hasSavedLocation) return <Redirect href="/set-location" />;
  return <Redirect href="/dashboard" />;
}
