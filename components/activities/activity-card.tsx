// src/components/activities/ActivityCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import { CheckCircleIcon, ClockIcon } from '../../components/ui/icons';

// Define Activity interface
interface Activity {
  id: string;
  title: string;
  startTime: string;
  description?: string;
  duration?: number;
  programTitle?: string;
}

// Define props interface
interface ActivityCardProps {
  activity: Activity;
  completed: boolean;
  onPress: () => void;
  onComplete: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  completed, 
  onPress, 
  onComplete 
}) => {
  const formatTimeDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  
  // Calculate if the activity is current, upcoming, or past
  const getActivityStatus = (): 'upcoming' | 'past' | 'current' => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [activityHour, activityMinute] = activity.startTime.split(':').map(Number);
    
    // Add the duration to get the end time
    const endTime = new Date();
    endTime.setHours(activityHour, activityMinute + (activity.duration || 15), 0, 0);
    
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    if (
      (currentHour < activityHour) || 
      (currentHour === activityHour && currentMinute < activityMinute)
    ) {
      return 'upcoming';
    } else if (
      (currentHour > endHour) || 
      (currentHour === endHour && currentMinute > endMinute)
    ) {
      return 'past';
    } else {
      return 'current';
    }
  };
  
  const status = getActivityStatus();
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        status === 'current' && styles.currentActivity,
        completed && styles.completedActivity
      ]}
      onPress={onPress}
    >
      <View style={styles.timeContainer}>
        <ClockIcon size={16} color={COLORS.primary} />
        <Text style={styles.time}>{formatTimeDisplay(activity.startTime)}</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{activity.title}</Text>
          <TouchableOpacity 
            style={styles.checkButton}
            onPress={onComplete}
          >
            <CheckCircleIcon 
              size={24} 
              color={completed ? COLORS.primary : COLORS.lightGray} 
            />
          </TouchableOpacity>
        </View>
        
        {activity.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {activity.description}
          </Text>
        ) : null}
        
        {activity.programTitle && (
          <View style={styles.programBadge}>
            <Text style={styles.programText}>{activity.programTitle}</Text>
          </View>
        )}
      </View>
      
      {status === 'current' && !completed && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>NOW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  currentActivity: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  completedActivity: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  time: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginLeft: SIZES.base / 2,
  },
  contentContainer: {
    marginLeft: SIZES.base,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.black,
    flex: 1,
  },
  checkButton: {
    padding: SIZES.base / 2,
  },
  description: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  programBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius / 2,
    alignSelf: 'flex-start',
  },
  programText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.base,
    right: SIZES.base,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius / 2,
  },
  statusText: {
    ...FONTS.body4,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ActivityCard;