// src/screens/profile/ProfileScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import {
  UserIcon,
  SettingsIcon,
  BellIcon,
  CheckCircleIcon,
} from '../../components/ui/icons';

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, signout, fetchUserProfile } = useAuth();
  const { toggleTheme, themeMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    programsCompleted: 0,
    activitiesCompleted: 0,
    streakDays: 0,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      if (user && !userProfile) {
        await fetchUserProfile();
      }
      
      // We would normally fetch these from Firestore
      // Here using mock data for now
      setStats({
        programsCompleted: 5,
        activitiesCompleted: 47,
        streakDays: 12,
      });
      
      setLoading(false);
    };

    loadProfileData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AppSettings')}
        >
          <SettingsIcon size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <UserIcon size={40} color={COLORS.white} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.displayName || user?.displayName || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.programsCompleted}</Text>
              <Text style={styles.statLabel}>Programs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activitiesCompleted}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity
            style={styles.optionItem}
            onPress={toggleTheme}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>App Theme</Text>
              <Text style={styles.optionValue}>{
                themeMode === 'light' ? 'Light' : 
                themeMode === 'dark' ? 'Dark' : 'System'
              }</Text>
            </View>
            <SettingsIcon size={20} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              // We'd normally navigate to notification settings
              console.log('Navigate to notification settings');
            }}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Notifications</Text>
              <Text style={styles.optionValue}>Enabled</Text>
            </View>
            <BellIcon size={20} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionItem, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  settingsButton: {
    padding: SIZES.base,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  profileImageContainer: {
    marginRight: SIZES.padding,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  profileEmail: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
  },
  editProfileButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  statsSection: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginBottom: SIZES.base / 2,
  },
  statLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  optionsSection: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    ...FONTS.body2,
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  optionValue: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  signOutButton: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: SIZES.padding,
  },
  signOutButtonText: {
    ...FONTS.h4,
    color: COLORS.error,
  },
});

export default ProfileScreen;