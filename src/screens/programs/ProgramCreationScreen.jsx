// src/screens/programs/CreateProgramScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import Header from '../../components/ui/header';
import CategoryPicker from '../../components/programs/CategoryPicker';
import DaysPicker from '../../components/programs/DaysPicker';

const CATEGORIES = [
  'Productivity', 'Fitness', 'Wellness', 'Education', 
  'Nutrition', 'Mindfulness', 'Family', 'Career', 'Other'
];

const CreateProgramScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [isPublic, setIsPublic] = useState(false);
  const [days, setDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri by default
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Using Date objects to easily manipulate time
  const [startTime, setStartTime] = useState(new Date());
  startTime.setHours(8, 0, 0, 0); // 8:00 AM default
  
  const [endTime, setEndTime] = useState(new Date());
  endTime.setHours(17, 0, 0, 0); // 5:00 PM default
  
  const formatTimeString = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const formatTimeForDB = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const handleStartTimeChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      
      // If end time is earlier than start time, adjust it
      if (selectedDate > endTime) {
        const newEndTime = new Date(selectedDate);
        newEndTime.setHours(selectedDate.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };
  
  const handleEndTimeChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a program title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a program description');
      return false;
    }
    if (days.length === 0) {
      Alert.alert('Error', 'Please select at least one day for the program');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }
    return true;
  };
  
  const handleCreateProgram = async () => {
    if (!validateForm()) return;
    
    try {
      // Create the program document
      const programRef = await addDoc(collection(db, 'programs'), {
        creator: {
          id: user.uid,
          username: user.displayName || user.email.split('@')[0],
        },
        title,
        description,
        category,
        tags: [category.toLowerCase()],
        isPublic,
        schedule: {
          startTime: formatTimeForDB(startTime),
          endTime: formatTimeForDB(endTime),
          days,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        activities: [],
        stats: {
          timesUsed: 0,
          avgCompletionRate: 0,
          rating: 0,
          ratingCount: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Also add it to userPrograms collection to activate it for this user
      await addDoc(collection(db, 'userPrograms'), {
        userId: user.uid,
        programId: programRef.id,
        isActive: true,
        customizations: {
          startTime: formatTimeForDB(startTime),
          endTime: formatTimeForDB(endTime),
          days: days,
          activityModifications: []
        },
        progress: {
          lastActiveDate: null,
          completedActivities: [],
          streakDays: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Navigate to activity creation
      navigation.navigate('AddActivities', { programId: programRef.id });
    } catch (error) {
      console.error('Error creating program:', error);
      Alert.alert('Error', 'Failed to create program. Please try again.');
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        title="Create New Program" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Program Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter program title"
            placeholderTextColor={COLORS.gray}
            maxLength={50}
          />
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your program"
            placeholderTextColor={COLORS.gray}
            multiline={true}
            numberOfLines={4}
            maxLength={200}
          />
          
          <Text style={styles.label}>Category</Text>
          <CategoryPicker
            categories={CATEGORIES}
            selectedCategory={category}
            onSelectCategory={setCategory}
          />
          
          <Text style={styles.label}>Schedule</Text>
          <View style={styles.scheduleContainer}>
            <View style={styles.timePickerRow}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TouchableOpacity 
                style={styles.timePicker}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeText}>{formatTimeString(startTime)}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timePickerRow}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TouchableOpacity 
                style={styles.timePicker}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeText}>{formatTimeString(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.label}>Days</Text>
          <DaysPicker
            selectedDays={days}
            onDayToggle={(day) => {
              if (days.includes(day)) {
                setDays(days.filter(d => d !== day));
              } else {
                setDays([...days, day].sort());
              }
            }}
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Make Public</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={isPublic ? COLORS.primary : COLORS.gray}
            />
          </View>
          
          <Text style={styles.infoText}>
            Public programs can be discovered by other users. They may use your program template, but won't see your personal data.
          </Text>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateProgram}
          >
            <Text style={styles.createButtonText}>Create Program</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: SIZES.padding,
  },
  label: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: SIZES.base,
    marginTop: SIZES.padding,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.black,
    ...FONTS.body3,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scheduleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  timeLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  timePicker: {
    backgroundColor: COLORS.lightGray,
    padding: SIZES.base,
    borderRadius: SIZES.radius,
    minWidth: 100,
    alignItems: 'center',
  },
  timeText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  infoText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: SIZES.base,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
    marginBottom: SIZES.padding,
  },
  createButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default CreateProgramScreen;