// src/screens/programs/ProgramDetailsScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import Header from '../../components/ui/header';
import { CalendarIcon, ClockIcon, SettingsIcon, PlusIcon } from '../../components/ui/icons';
import ActivityCard from '../../components/activities/ActivityCard';

const ProgramDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { userProgramId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [userProgram, setUserProgram] = useState(null);
  const [program, setProgram] = useState(null);
  const [activities, setActivities] = useState([]);
  const [completedActivities, setCompletedActivities] = useState([]);
  
  useEffect(() => {
    fetchProgramDetails();
  }, [userProgramId]);
  
  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      
      // Get userProgram details
      const userProgramDoc = await getDoc(doc(db, 'userPrograms', userProgramId));
      
      if (!userProgramDoc.exists()) {
        Alert.alert('Error', 'Program not found');
        navigation.goBack();
        return;
      }
      
      const userProgramData = { id: userProgramDoc.id, ...userProgramDoc.data() };
      setUserProgram(userProgramData);
      
      // Get program details
      const programDoc = await getDoc(doc(db, 'programs', userProgramData.programId));
      const programData = { id: programDoc.id, ...programDoc.data() };
      setProgram(programData);
      
      // Get activities for this program
      const activitiesRef = collection(db, 'activities');
      const activitiesQuery = query(activitiesRef, where('programId', '==', userProgramData.programId));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort activities by startTime
      activitiesData.sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0]; // Sort by hour
        }
        return timeA[1] - timeB[1]; // Sort by minute
      });
      
      setActivities(activitiesData);
      
      // Get today's completed activities
      const todayDate = new Date().toISOString().split('T')[0];
      const progressRef = collection(db, 'userProgramProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('date', '==', todayDate),
        where('userProgramId', '==', userProgramId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      if (!progressSnapshot.empty) {
        const progressData = progressSnapshot.docs[0].data();
        setCompletedActivities(progressData.completedActivities || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching program details:', error);
      Alert.alert('Error', 'Failed to load program details');
      setLoading(false);
    }
  };
  
  const formatTimeDisplay = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  
  const formatDays = (days) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };
  
  const handleToggleProgramActive = async () => {
    try {
      const updatedStatus = !userProgram.isActive;
      
      // Update in Firestore
      await updateDoc(doc(db, 'userPrograms', userProgramId), {
        isActive: updatedStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserProgram({
        ...userProgram,
        isActive: updatedStatus
      });
      
      Alert.alert(
        updatedStatus ? 'Program Activated' : 'Program Deactivated',
        updatedStatus 
          ? 'You will now receive notifications for this program.' 
          : 'You will no longer receive notifications for this program.'
      );
    } catch (error) {
      console.error('Error updating program status:', error);
      Alert.alert('Error', 'Failed to update program status');
    }
  };
  
  const handleDeleteProgram = async () => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete userProgram document
              await deleteDoc(doc(db, 'userPrograms', userProgramId));
              
              // Navigate back
              navigation.goBack();
              
              // Show success message
              Alert.alert('Success', 'Program deleted successfully');
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert('Error', 'Failed to delete program');
            }
          }
        }
      ]
    );
  };
  
  const handleMarkActivityComplete = async (activityId) => {
    try {
      // Update local state first for immediate feedback
      let updatedCompletedActivities;
      
      if (completedActivities.includes(activityId)) {
        // Remove from completed
        updatedCompletedActivities = completedActivities.filter(id => id !== activityId);
      } else {
        // Add to completed
        updatedCompletedActivities = [...completedActivities, activityId];
      }
      
      setCompletedActivities(updatedCompletedActivities);
      
      // Update in Firestore
      const todayDate = new Date().toISOString().split('T')[0];
      const progressRef = collection(db, 'userProgramProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('date', '==', todayDate),
        where('userProgramId', '==', userProgramId)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      if (progressSnapshot.empty) {
        // Create new progress document
        await addDoc(collection(db, 'userProgramProgress'), {
          userId: user.uid,
          userProgramId: userProgramId,
          date: todayDate,
          completedActivities: updatedCompletedActivities,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing document
        const progressDoc = progressSnapshot.docs[0];
        await updateDoc(progressDoc.ref, {
          completedActivities: updatedCompletedActivities,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating activity completion:', error);
      // Revert local state on error
      setCompletedActivities(completedActivities);
      Alert.alert('Error', 'Failed to update activity status');
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        title={program?.title || 'Program Details'} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
        rightComponent={
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProgramSettings', { userProgramId })}
          >
            <SettingsIcon size={24} color={COLORS.black} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.programHeader}>
          <Text style={styles.description}>{program?.description}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ClockIcon size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                {formatTimeDisplay(userProgram?.customizations?.startTime || program?.schedule?.startTime)} - 
                {formatTimeDisplay(userProgram?.customizations?.endTime || program?.schedule?.endTime)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <CalendarIcon size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                {formatDays(userProgram?.customizations?.days || program?.schedule?.days)}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                userProgram?.isActive ? styles.deactivateButton : styles.activateButton
              ]}
              onPress={handleToggleProgramActive}
            >
              <Text style={styles.actionButtonText}>
                {userProgram?.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteProgram}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.activitiesHeader}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => navigation.navigate('ManageActivities', { programId: program.id })}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
        
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities yet</Text>
            <TouchableOpacity 
              style={styles.addActivityButton}
              onPress={() => navigation.navigate('ManageActivities', { programId: program.id })}
            >
              <PlusIcon size={16} color={COLORS.white} />
              <Text style={styles.addActivityButtonText}>Add Activities</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activitiesContainer}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                completed={completedActivities.includes(activity.id)}
                onPress={() => navigation.navigate('ActivityDetails', { activityId: activity.id })}
                onComplete={() => handleMarkActivityComplete(activity.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    padding: SIZES.base,
  },
  scrollView: {
    flex: 1,
  },
  programHeader: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  description: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding * 2,
  },
  infoText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginLeft: SIZES.base / 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SIZES.base / 2,
  },
  activateButton: {
    backgroundColor: COLORS.primary,
  },
  deactivateButton: {
    backgroundColor: COLORS.gray,
  },
  deleteButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  deleteButtonText: {
    ...FONTS.h4,
    color: COLORS.error,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.base,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  manageButton: {
    padding: SIZES.base,
  },
  manageButtonText: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  addActivityButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  addActivityButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
  activitiesContainer: {
    padding: SIZES.padding,
  },
});

export default ProgramDetailsScreen;