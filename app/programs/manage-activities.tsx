// src/screens/programs/ManageActivitiesScreen.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { DragIcon, ClockIcon, PlusIcon, TrashIcon } from '../../components/ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import TimePicker from '../../components/ui/time-picker';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Header from '../../components/ui/header';

type RouteParams = {
  ManageActivities: {
    programId: string;
  };
  ActivityDetails: {
    activityId: string;
  };
};
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp, 
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
  const route = useRoute<RouteProp<RouteParams, 'ManageActivities'>>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RouteParams>>();

const ManageActivitiesScreen = () => {
  const navigation = useNavigation<NavigationProp<RouteParams>>();
  const route = useRoute<RouteProp<RouteParams, 'ManageActivities'>>();
  const insets = useSafeAreaInsets();
  const { programId } = route.params;
  
  const [loading, setLoading] = useState(true);
  interface Program {
    id: string;
    title?: string;
    schedule?: {
      startTime: string;
    };
    activities?: string[];
    updatedAt?: any;
  }
  const [program, setProgram] = useState<Program | null>(null);
  interface Activity {
    id: string;
    title: string;
    description?: string;
    duration: number;
    startTime: string;
    programId: string;
    completionType: string;
    reminders: Array<{
      type: string;
      time: number;
      message: string;
    }>;
    resources: any[];
    createdAt: any;
    updatedAt: any;
  }

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  
  // New activity form state
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityDuration, setActivityDuration] = useState('15');
  const [activityStartTime, setActivityStartTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  useEffect(() => {
    fetchProgramDetails();
  }, [programId]);
  
  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      
      // Get program details
      const programDoc = await getDoc(doc(db, 'programs', programId));
      
      if (!programDoc.exists()) {
        Alert.alert('Error', 'Program not found');
        navigation.goBack();
        return;
      }
      
      const programData: Program = { id: programDoc.id, ...programDoc.data() } as Program;
      setProgram(programData);
      
      // Get activities for this program
      const activitiesRef = collection(db, 'activities');
      const activitiesQuery = query(activitiesRef, where('programId', '==', programId));
      const activitiesSnapshot = await getDocs(activitiesQuery);
      
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
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
      
      // Set default start time for new activity
      if (activitiesData.length === 0) {
        // If no activities, use program start time
        setActivityStartTime(programData.schedule?.startTime || '00:00');
      } else {
        // Otherwise use time after the last activity
        const lastActivity = activitiesData[activitiesData.length - 1];
        const [hours, minutes] = lastActivity.startTime.split(':').map(Number);
        const lastActivityTime = new Date();
        lastActivityTime.setHours(hours, minutes, 0, 0);
        
        // Add the duration of the last activity
        lastActivityTime.setMinutes(lastActivityTime.getMinutes() + (lastActivity.duration || 15));
        
        // Format as HH:MM
        const newHours = lastActivityTime.getHours().toString().padStart(2, '0');
        const newMinutes = lastActivityTime.getMinutes().toString().padStart(2, '0');
        setActivityStartTime(`${newHours}:${newMinutes}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching program details:', error);
      Alert.alert('Error', 'Failed to load program details');
      setLoading(false);
    }
  };
  
  const handleAddActivity = async () => {
    try {
      if (!activityTitle.trim()) {
        Alert.alert('Error', 'Please enter an activity title');
        return;
      }
      
      if (!activityStartTime) {
        Alert.alert('Error', 'Please set a start time');
        return;
      }
      
      const duration = parseInt(activityDuration);
      if (isNaN(duration) || duration <= 0) {
        Alert.alert('Error', 'Please enter a valid duration');
        return;
      }
      
      // Create new activity
      const newActivity = {
        programId,
        title: activityTitle,
        description: activityDescription,
        duration,
        startTime: activityStartTime,
        completionType: 'checkbox',
        reminders: [
          {
            type: 'before',
            time: 5,
            message: `${activityTitle} is starting soon!`
          }
        ],
        resources: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const activityRef = await addDoc(collection(db, 'activities'), newActivity);
      
      // Update program's activity list
      await updateDoc(doc(db, 'programs', programId), {
        activities: arrayUnion(activityRef.id),
        updatedAt: serverTimestamp()
      });
      
      // Add to local state
      setActivities([...activities, { id: activityRef.id, ...newActivity }]);
      
      // Calculate next start time
      const [hours, minutes] = activityStartTime.split(':').map(Number);
      const nextActivityTime = new Date();
      nextActivityTime.setHours(hours, minutes, 0, 0);
      nextActivityTime.setMinutes(nextActivityTime.getMinutes() + duration);
      
      // Format as HH:MM
      const newHours = nextActivityTime.getHours().toString().padStart(2, '0');
      const newMinutes = nextActivityTime.getMinutes().toString().padStart(2, '0');
      setActivityStartTime(`${newHours}:${newMinutes}`);
      
      // Reset form
      setActivityTitle('');
      setActivityDescription('');
      setActivityDuration('15');
      setShowAddActivity(false);
      
      // Sort activities
      sortActivitiesByTime();
    } catch (error) {
      console.error('Error adding activity:', error);
      Alert.alert('Error', 'Failed to add activity. Please try again.');
    }
  };
  
  interface HandleDeleteActivityParams {
    activityId: string;
  }

  const handleDeleteActivity = async ({ activityId }: HandleDeleteActivityParams): Promise<void> => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'activities', activityId));
      
      // Update program's activity list
      await updateDoc(doc(db, 'programs', programId), {
        activities: arrayRemove(activityId),
        updatedAt: serverTimestamp()
      });
      
      // Remove from local state 
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity');
    }
  };
  
  const handleDragEnd = async ({ data }: { data: Activity[] }) => {
    setActivities(data);
    
    // Update start times based on new order
    let currentTime = null;
    
    if (data.length > 0) {
      // Start with first activity's time
      currentTime = new Date();
      const [hours, minutes] = data[0].startTime.split(':').map(Number);
      currentTime.setHours(hours, minutes, 0, 0);
      
      // Update subsequent activities
      for (let i = 1; i < data.length; i++) {
        // Add previous activity's duration
        currentTime.setMinutes(currentTime.getMinutes() + (data[i-1].duration || 15));
        
        // Format new time
        const newHours = currentTime.getHours().toString().padStart(2, '0');
        const newMinutes = currentTime.getMinutes().toString().padStart(2, '0');
        const newStartTime = `${newHours}:${newMinutes}`;
        
        // Update in Firestore
        await updateDoc(doc(db, 'activities', data[i].id), {
          startTime: newStartTime,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        data[i].startTime = newStartTime;
      }
    }
    
    setActivities([...data]);
  };
  
  const sortActivitiesByTime = () => {
    const sorted = [...activities].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0]; // Sort by hour
      }
      return timeA[1] - timeB[1]; // Sort by minute
    });
    
    setActivities(sorted);
  };
  
  interface TimeFormatting {
    hour: 'numeric';
    minute: '2-digit';
  }

  const formatTimeDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' } as TimeFormatting);
  };
  
  const handleTimePickerConfirm = (date: Date): void => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setActivityStartTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };
  
  const renderActivityItem = ({ item, drag, isActive }: { item: Activity; drag: () => void; isActive: boolean }) => {
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isActive && styles.activityItemActive
        ]}
        onLongPress={drag}
        onPress={() => navigation.navigate('ActivityDetails', { activityId: item.id })}
      >
        <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
          <DragIcon size={20} color={COLORS.gray} />
        </TouchableOpacity>
        
        <View style={styles.activityContent}>
          <Text style={styles.activityTime}>
            {formatTimeDisplay(item.startTime)}
            {item.duration && ` (${item.duration} min)`}
          </Text>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Activity',
              `Are you sure you want to delete "${item.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteActivity({ activityId: item.id }) }
              ]
            );
          }}
        >
          <TrashIcon size={20} color={COLORS.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
        title={program ? `${program.title}: Activities` : 'Manage Activities'} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Drag to reorder activities. Times will automatically adjust.
        </Text>
      </View>
      
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activities yet</Text>
          <Text style={styles.emptySubtext}>Add your first activity below</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.activitiesList}
        />
      )}
      
      {showAddActivity ? (
        <View style={styles.addFormContainer}>
          <Text style={styles.formTitle}>New Activity</Text>
          
          <TextInput
            style={styles.input}
            value={activityTitle}
            onChangeText={setActivityTitle}
            placeholder="Activity Title"
            placeholderTextColor={COLORS.gray}
            maxLength={50}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            value={activityDescription}
            onChangeText={setActivityDescription}
            placeholder="Description (optional)"
            placeholderTextColor={COLORS.gray}
            multiline={true}
            numberOfLines={3}
          />
          
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <ClockIcon size={16} color={COLORS.primary} />
                <Text style={styles.timePickerText}>
                  {activityStartTime ? formatTimeDisplay(activityStartTime) : 'Set Time'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formColumn}>
              <Text style={styles.inputLabel}>Duration (min)</Text>
              <TextInput
                style={[styles.input, styles.durationInput]}
                value={activityDuration}
                onChangeText={setActivityDuration}
                placeholder="15"
                placeholderTextColor={COLORS.gray}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
          
          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowAddActivity(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.addButton]}
              onPress={handleAddActivity}
            >
              <Text style={styles.addButtonText}>Add Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setShowAddActivity(true)}
        >
          <PlusIcon size={24} color={COLORS.white} />
          <Text style={styles.floatingButtonText}>Add Activity</Text>
        </TouchableOpacity>
      )}
      
      {showTimePicker && (
        <TimePicker
          initialTime={activityStartTime}
          onConfirm={handleTimePickerConfirm}
          onCancel={() => setShowTimePicker(false)}
        />
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
  infoContainer: {
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.base,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  infoText: {
    ...FONTS.body4,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  activitiesList: {
    padding: SIZES.padding,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    padding: SIZES.padding,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItemActive: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  dragHandle: {
    padding: SIZES.base,
    marginRight: SIZES.base,
  },
  activityContent: {
    flex: 1,
  },
  activityTime: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginBottom: 2,
  },
  activityTitle: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  activityDescription: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteButton: {
    padding: SIZES.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.gray,
  },
  emptySubtext: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
  },
  floatingButton: {
    position: 'absolute',
    bottom: SIZES.padding,
    right: SIZES.padding,
    left: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
  addFormContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius,
    borderTopRightRadius: SIZES.radius,
    padding: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  formTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...FONTS.body3,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: SIZES.base,
  },
  inputLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  timePickerButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerText: {
    ...FONTS.body3,
    color: COLORS.black,
    marginLeft: SIZES.base,
  },
  durationInput: {
    marginBottom: 0,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginHorizontal: SIZES.base,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    ...FONTS.h4,
    color: COLORS.gray,
  },
});

export default ManageActivitiesScreen;