// app/programs/create.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { Event as DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import Header from '../../components/ui/header';
import CategoryPicker from '../../components/programs/category-picker';
import DaysPicker from '../../components/programs/days-picker';

// Define the categories as a const array of strings for type safety
const CATEGORIES = [
  'Productivity', 'Fitness', 'Wellness', 'Education', 
  'Nutrition', 'Mindfulness', 'Family', 'Career', 'Other'
] as const;

// Type for categories
type ProgramCategory = typeof CATEGORIES[number];

export default function CreateProgramScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ProgramCategory>('Productivity');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri by default
  
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  
  // Using Date objects to easily manipulate time
  const [startTime, setStartTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0); // 8:00 AM default
    return date;
  });
  
  const [endTime, setEndTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(17, 0, 0, 0); // 5:00 PM default
    return date;
  });
  
  const formatTimeString = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const formatTimeForDB = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
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
  
  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };
  
  const validateForm = (): boolean => {
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
    
    // Ensure user is defined with a type guard
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      // Create the program document
      const programRef = await addDoc(collection(db, 'programs'), {
        creator: {
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'User',
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
      
      // Navigate to activity creation - using Expo Router
      router.push(`/programs/manage-activities?programId=${programRef.id}`);
    } catch (error) {
      console.error('Error creating program:', error);
      Alert.alert('Error', 'Failed to create program. Please try again.');
    }
  };
  
  const handleDayToggle = (dayId: number) => {
    setDays(currentDays => 
      currentDays.includes(dayId)
        ? currentDays.filter(day => day !== dayId)
        : [...currentDays, dayId]
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        title="Create New Program" 
        showBackButton={true} 
        onBackPress={() => router.back()} 
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Program Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter program title"
            placeholderTextColor={COLORS.gray}
          />
        </View>
        
        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your program"
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={4}
          />
        </View>
        
        {/* Category Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <CategoryPicker
            categories={CATEGORIES.map((cat, index) => ({ 
              id: cat, 
              name: cat 
            }))}
            selectedCategory={category}
            onSelectCategory={(cat) => setCategory(cat as ProgramCategory)}
          />
        </View>
        
        {/* Days Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Active Days</Text>
          <DaysPicker
            selectedDays={days}
            onDayToggle={handleDayToggle}
          />
        </View>
        
        {/* Time Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Program Time</Text>
          <View style={styles.timeContainer}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.timeButtonText}>
                Start: {formatTimeString(startTime)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.timeButtonText}>
                End: {formatTimeString(endTime)}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Time Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={false}
              onChange={handleStartTimeChange}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour={false}
              onChange={handleEndTimeChange}
            />
          )}
        </View>
        
        {/* Public Toggle */}
        <View style={styles.inputContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Make Program Public</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ 
                false: COLORS.lightGray, 
                true: COLORS.primary 
              }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
        
        {/* Create Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateProgram}
        >
          <Text style={styles.createButtonText}>Create Program</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    ...FONTS.body3,
    color: COLORS.black,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 0.48,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.base,
    alignItems: 'center',
  },
  timeButtonText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  createButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});