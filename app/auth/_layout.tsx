// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../../contexts/auth-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { NotificationService } from '../../services/notification-service';

// Import your theme
import { COLORS } from '../../styles/theme';

// Root layout wrapper
export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

// Navigation structure based on authentication
function RootLayoutNav() {
  const { user, loading, setUser } = useAuth();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        setUser(userAuth);
        
        // Initialize notifications for logged in users
        await NotificationService.init();
        await NotificationService.registerForPushNotifications(userAuth.uid);
      } else {
        setUser(null);
      }
    });
    
    return () => unsubscribe();
  }, [setUser]);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.white 
      }}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.primary} 
        />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name={user ? "(tabs)" : "auth"} 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}