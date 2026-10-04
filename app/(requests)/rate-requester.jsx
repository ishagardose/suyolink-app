import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
export default function WorkflowRoute() {
  const params = useLocalSearchParams();
  const id = params.id || params.requestId;
  return <Redirect href={id ? { pathname: '/rate-suyo', params: { id } } : '/dashboard'} />;
}
