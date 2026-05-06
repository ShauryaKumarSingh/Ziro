import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

const InitialLayout = () => {
  // 1. Get everything from our single, reliable context
  const { authToken, isLoading, isOnboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until the context has finished loading both auth and onboarding status
    if (isLoading) return;

    const inAppGroup = segments[0] === '(app)';

    // If onboarding has never been completed, go to the slides
    if (isOnboardingComplete === false) {
      router.replace('/onboarding');
      return;
    }
    
    // If onboarding is complete, check for login status
    if (authToken && !inAppGroup) {
      // User is logged in, go to the main app
      router.replace('/(app)');
    } else if (!authToken && segments.length > 0 && segments[0] !== '(auth)' && segments[0] !== 'onboarding') {
      // User is logged out, go to the login screen
      router.replace('/(auth)/ZiroLoginScreen');
    }
  }, [authToken, isLoading, isOnboardingComplete]);


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}