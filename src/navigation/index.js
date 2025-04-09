// src/navigation/index.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import { COLORS } from '../../styles/theme';
import { NotificationService } from '../services/NotificationService';

// Tab Icons
import { 
  HomeIcon, 
  CalendarIcon, 
  BellIcon, 
  UserIcon 
} from '../../components/ui/icons';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Main Screens
import DailyProgramScreen from '../screens/home/DailyProgramScreen';
import ProgramsLibraryScreen from '../screens/programs/ProgramsLibraryScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Program Screens
import ProgramDetailsScreen from '../screens/programs/ProgramDetailsScreen';
import CreateProgramScreen from '../screens/programs/CreateProgramScreen';
import ManageActivitiesScreen from '../screens/programs/ManageActivitiesScreen';
import ActivityDetailsScreen from '../screens/programs/ActivityDetailsScreen';
import ProgramSettingsScreen from '../screens/programs/ProgramSettingsScreen';

// Profile Screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AppSettingsScreen from '../screens/profile/AppSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Welcome"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
};

// Home Tab Navigator
const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DailyProgram"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="DailyProgram" component={DailyProgramScreen} />
      <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
    </Stack.Navigator>
  );
};

// Programs Tab Navigator
const ProgramsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProgramsLibrary"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="ProgramsLibrary" component={ProgramsLibraryScreen} />
      <Stack.Screen name="ProgramDetails" component={ProgramDetailsScreen} />
      <Stack.Screen name="CreateProgram" component={CreateProgramScreen} />
      <Stack.Screen name="ManageActivities" component={ManageActivitiesScreen} />
      <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
      <Stack.Screen name="ProgramSettings" component={ProgramSettingsScreen} />
    </Stack.Navigator>
  );
};

// Profile Tab Navigator
const ProfileStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          
          if (route.name === 'HomeTab') {
            icon = <HomeIcon size={size} color={color} />;
          } else if (route.name === 'ProgramsTab') {
            icon = <CalendarIcon size={size} color={color} />;
          } else if (route.name === 'NotificationsTab') {
            icon = <BellIcon size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            icon = <UserIcon size={size} color={color} />;
          }
          
          return icon;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="ProgramsTab" 
        component={ProgramsStack} 
        options={{ tabBarLabel: 'Programs' }} 
      />
      <Tab.Screen 
        name="NotificationsTab" 
        component={NotificationsScreen} 
        options={{ tabBarLabel: 'Notifications' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{ tabBarLabel: 'Profile' }} 
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading, setUser } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
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
      
      setIsInitialized(true);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (!isInitialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Wrap navigator with SafeAreaProvider
const Navigation = () => {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default Navigation;