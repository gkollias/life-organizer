// src/screens/auth/WelcomeScreen.tsx

// Define RootStackParamList type
type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
};
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

// Define navigation prop type
type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList, 
  'Welcome'
>;

// Define props interface
interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>LifeOrganizer</Text>
          <Text style={styles.tagline}>Structure your day, master your life</Text>
        </View>
        
        <View style={styles.featureContainer}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📋</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Daily Programs</Text>
              <Text style={styles.featureDescription}>Follow structured daily routines designed for productivity</Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>⏰</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Smart Notifications</Text>
              <Text style={styles.featureDescription}>Get timely reminders to keep you on track throughout your day</Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📊</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Progress Tracking</Text>
              <Text style={styles.featureDescription}>Monitor your consistency and build better habits</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.buttonTextPrimary}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.buttonTextSecondary}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding * 2,
    paddingTop: SIZES.padding * 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  logo: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  tagline: {
    ...FONTS.body2,
    color: COLORS.gray,
  },
  featureContainer: {
    marginTop: SIZES.padding * 2,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: SIZES.padding * 2,
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  featureDescription: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  buttonContainer: {
    paddingHorizontal: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 2,
  },
  button: {
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonTextPrimary: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  buttonTextSecondary: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
});

export default WelcomeScreen;

// Note: You'll need to define the RootStackParamList in your navigation types
// Example:
// type RootStackParamList = {
//   Welcome: undefined;
//   SignUp: undefined;
//   SignIn: undefined;
// };