// src/screens/home/DailyProgramScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import ActivityCard from '../../components/activities/ActivityCard';
import ProgressCircle from '../../components/common/ProgressCircle';
import { ClockIcon, CalendarIcon, ChevronRightIcon } from '../../components/ui/icons';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

const DailyProgramScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayPrograms, setTodayPrograms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [completedActivities, setCompletedActivities] = useState([]);
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
  
  useEffect(() => {
    const fetchTodayPrograms = async () => {
      try {
        setLoading(true);
        
        // Get user programs active for today
        const userProgramsRef = collection(db, 'userPrograms');
        const q = query(
          userProgramsRef,
          where('userId', '==', user.uid),
          where('isActive', '==', true),
          where('customizations.days', 'array-contains', dayOfWeek)
        );
        
        const userProgramsSnapshot = await getDocs(q);
        const programsData = [];
        
        // For each active program, get the program details
        const programPromises = userProgramsSnapshot.docs.map(async (doc) => {
          const userProgram = { id: doc.id, ...doc.data() };
          
          // Get the program details
          const programDoc = await getDoc(doc(db, 'programs', userProgram.programId));
          const program = { id: programDoc.id, ...programDoc.data() };
          
          return {
            ...userProgram,
            program,
          };
        });
        
        const resolvedPrograms = await Promise.all(programPromises);
        setTodayPrograms(resolvedPrograms);
        
        // Get all activities for these programs
        const allActivities = [];
        const activityPromises = resolvedPrograms.flatMap(async (userProgram) => {
          const activitiesRef = collection(db, 'activities');
          const activitiesQuery = query(
            activitiesRef,
            where('programId', '==', userProgram.programId)
          );
          
          const activitiesSnapshot = await getDocs(activitiesQuery);
          const programActivities = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userProgramId: userProgram.id,
            programTitle: userProgram.program.title,
          }));
          
          allActivities.push(...programActivities);
        });
        
        await Promise.all(activityPromises);
        
        // Sort activities by start time
        allActivities.sort((a, b) => {
          const timeA = a.startTime.split(':').map(Number);
          const timeB = b.startTime.split(':').map(Number);
          
          if (timeA[0] !== timeB[0]) {
            return timeA[0] - timeB[0]; // Sort by hour
          }
          return timeA[1] - timeB[1]; // Sort by minute
        });
        
        setActivities(allActivities);
        
        // Get completed activities for today
        const completedActivitiesRef = collection(db, 'userProgramProgress');
        const completedQuery = query(
          completedActivitiesRef,
          where('userId', '==', user.uid),
          where('date', '==', format(today, 'yyyy-MM-dd'))
        );
        
        const completedSnapshot = await getDocs(completedQuery);
        if (!completedSnapshot.empty) {
          const completedData = completedSnapshot.docs[0].data();
          setCompletedActivities(completedData.completedActivities || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching today programs:', error);
        setLoading(false);
      }
    };
    
    fetchTodayPrograms();
  }, [user, dayOfWeek]);
  
  const getCompletionPercentage = () => {
    if (activities.length === 0) return 0;
    return Math.round((completedActivities.length / activities.length) * 100);
  };
  
  const isActivityCompleted = (activityId) => {
    return completedActivities.includes(activityId);
  };
  
  const handleActivityPress = (activity) => {
    navigation.navigate('ActivityDetails', { activity });
  };
  
  const handleMarkComplete = async (activityId) => {
    try {
      // Update local state
      if (isActivityCompleted(activityId)) {
        setCompletedActivities(completedActivities.filter(id => id !== activityId));
      } else {
        setCompletedActivities([...completedActivities, activityId]);
      }
      
      // Update in Firestore
      const progressRef = collection(db, 'userProgramProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('date', '==', format(today, 'yyyy-MM-dd'))
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      if (progressSnapshot.empty) {
        // Create new entry for today
        await addDoc(collection(db, 'userProgramProgress'), {
          userId: user.uid,
          date: format(today, 'yyyy-MM-dd'),
          completedActivities: [activityId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing entry
        const docRef = progressSnapshot.docs[0].ref;
        const currentData = progressSnapshot.docs[0].data();
        
        let updatedActivities;
        if (currentData.completedActivities?.includes(activityId)) {
          // Remove if already completed
          updatedActivities = currentData.completedActivities.filter(id => id !== activityId);
        } else {
          // Add to completed list
          updatedActivities = [...(currentData.completedActivities || []), activityId];
        }
        
        await updateDoc(docRef, {
          completedActivities: updatedActivities,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating activity completion:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.date}>{format(today, 'EEEE, MMMM d')}</Text>
        <View style={styles.progressContainer}>
          <ProgressCircle 
            percentage={getCompletionPercentage()} 
            size={60} 
            color={COLORS.primary} 
          />
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressText}>
              {completedActivities.length}/{activities.length} activities completed
            </Text>
          </View>
        </View>
      </View>
      
      {todayPrograms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active programs for today</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('ProgramsLibrary')}
          >
            <Text style={styles.addButtonText}>Browse Programs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.programsContainer}>
            {todayPrograms.map((userProgram) => (
              <TouchableOpacity 
                key={userProgram.id}
                style={styles.programCard}
                onPress={() => navigation.navigate('ProgramDetails', { userProgramId: userProgram.id })}
              >
                <View style={styles.programHeader}>
                  <Text style={styles.programTitle}>{userProgram.program.title}</Text>
                  <ChevronRightIcon size={20} color={COLORS.gray} />
                </View>
                <View style={styles.programInfo}>
                  <View style={styles.infoItem}>
                    <ClockIcon size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                      {userProgram.customizations?.startTime || userProgram.program.schedule.startTime} - 
                      {userProgram.customizations?.endTime || userProgram.program.schedule.endTime}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <CalendarIcon size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                      {activities.filter(a => a.programId === userProgram.programId).length} activities
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Today's Activities</Text>
          
          <View style={styles.activitiesContainer}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                completed={isActivityCompleted(activity.id)}
                onPress={() => handleActivityPress(activity)}
                onComplete={() => handleMarkComplete(activity.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
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
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  date: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  progressTextContainer: {
    marginLeft: SIZES.padding,
  },
  progressTitle: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  progressText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  scrollView: {
    flex: 1,
  },
  programsContainer: {
    padding: SIZES.padding,
  },
  programCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  programTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  programInfo: {
    flexDirection: 'row',
    marginTop: SIZES.base,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  infoText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginLeft: 4,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginHorizontal: SIZES.padding,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  activitiesContainer: {
    padding: SIZES.padding,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  addButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default DailyProgramScreen;