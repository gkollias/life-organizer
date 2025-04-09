// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';

// Interfaces for type safety
interface NotificationPermission {
  granted: boolean;
}

interface DeviceToken {
  data: string;
}

interface ActivityReminder {
  type: 'before' | 'after';
  time: number;
  message?: string;
}

interface Activity {
  id: string;
  programId: string;
  title: string;
  description?: string;
  startTime: string;
  reminders?: ActivityReminder[];
}

interface NotificationData {
  activityId?: string;
  programId?: string;
  type?: 'activity' | 'reminder';
  reminderType?: 'before' | 'after';
}

export class NotificationService {
  // Initialize notifications with appropriate settings
  static async init(): Promise<boolean> {
    try {
      // Request permissions
      const permission = await this.requestPermissions();
      
      if (!permission.granted) {
        console.log('Notification permission not granted');
        return false;
      }
      
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }
  
  // Request notification permissions
  static async requestPermissions(): Promise<NotificationPermission> {
    if (!Device.isDevice) {
      console.log('Must use physical device for notifications');
      return { granted: false };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // iOS-specific additional permissions
      if (Platform.OS === 'ios') {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }
      
      return { granted: finalStatus === 'granted' };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { granted: false };
    }
  }
  
  // Register device token with Firestore
  static async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      if (!process.env.EXPO_PROJECT_ID) {
        console.error('EXPO_PROJECT_ID is not defined');
        return null;
      }

      const token: DeviceToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      
      // Store the token in Firestore
      const devicesRef = collection(db, 'users', userId, 'devices');
      const q = query(devicesRef, where('token', '==', token.data));
      const snapshot = await getDocs(q);
      
      // Only add if this token doesn't exist yet
      if (snapshot.empty) {
        await addDoc(devicesRef, {
          token: token.data,
          platform: Platform.OS,
          deviceName: Device.deviceName || 'Unknown',
          createdAt: serverTimestamp(),
        });
      }
      
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }
  
  // Schedule local notification
  static async scheduleLocalNotification(
    title: string, 
    body: string, 
    trigger: Date, 
    data: NotificationData = {}
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }
  
  // Schedule activity notification
  static async scheduleActivityNotification(
    userId: string, 
    activity: Activity, 
    programTitle: string, 
    date: Date
  ): Promise<string | null> {
    try {
      // Validate activity
      if (!activity || !activity.title || !activity.startTime) {
        console.error('Invalid activity for notification');
        return null;
      }
      
      // Parse activity start time 
      const [hours, minutes] = activity.startTime.split(':').map(Number);
      const activityTime = new Date(date);
      activityTime.setHours(hours, minutes, 0, 0);
      
      // Check if the time is in the future
      if (activityTime <= new Date()) {
        console.log('Activity time is in the past, not scheduling notification');
        return null;
      }
      
      // Create the notification content
      const title = `${activity.title} - ${programTitle}`;
      const body = activity.description || 'Time for your scheduled activity';
      
      // Schedule local notification
      const notificationId = await this.scheduleLocalNotification(
        title,
        body,
        activityTime,
        {
          activityId: activity.id,
          programId: activity.programId,
          type: 'activity',
        }
      );
      
      // Store in Firestore if notification was scheduled
      if (notificationId) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title,
          body,
          type: 'activity',
          data: {
            activityId: activity.id,
            programId: activity.programId,
          },
          scheduledFor: activityTime,
          read: false,
          sent: false,
          localNotificationId: notificationId,
          createdAt: serverTimestamp(),
        });
      }
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling activity notification:', error);
      return null;
    }
  }
  
  // Schedule reminder notifications for an activity
  static async scheduleActivityReminders(
    userId: string, 
    activity: Activity, 
    programTitle: string, 
    date: Date
  ): Promise<string[]> {
    try {
      const notificationIds: string[] = [];
      
      // Check if activity has reminders
      if (!activity.reminders || activity.reminders.length === 0) {
        return notificationIds;
      }
      
      // Parse activity start time
      const [hours, minutes] = activity.startTime.split(':').map(Number);
      const activityTime = new Date(date);
      activityTime.setHours(hours, minutes, 0, 0);
      
      // Schedule each reminder
      for (const reminder of activity.reminders) {
        // Calculate reminder time
        const reminderTime = new Date(activityTime);
        
        if (reminder.type === 'before') {
          // Subtract minutes for 'before' reminders
          reminderTime.setMinutes(reminderTime.getMinutes() - reminder.time);
        } else if (reminder.type === 'after') {
          // Add minutes for 'after' reminders
          reminderTime.setMinutes(reminderTime.getMinutes() + reminder.time);
        }
        
        // Check if reminder time is in the future
        if (reminderTime > new Date()) {
          const reminderTitle = `Reminder: ${activity.title}`;
          const reminderBody = reminder.message || 
            `${reminder.time} ${reminder.type === 'before' ? 'minutes until' : 'minutes after'} ${activity.title}`;
          
          // Schedule the reminder notification
          const notificationId = await this.scheduleLocalNotification(
            reminderTitle,
            reminderBody,
            reminderTime,
            {
              activityId: activity.id,
              programId: activity.programId,
              type: 'reminder',
              reminderType: reminder.type,
            }
          );
          
          if (notificationId) {
            notificationIds.push(notificationId);
            
            // Store in Firestore
            await addDoc(collection(db, 'notifications'), {
              userId,
              title: reminderTitle,
              body: reminderBody,
              type: 'reminder',
              data: {
                activityId: activity.id,
                programId: activity.programId,
                reminderType: reminder.type,
              },
              scheduledFor: reminderTime,
              read: false,
              sent: false,
              localNotificationId: notificationId,
              createdAt: serverTimestamp(),
            });
          }
        }
      }
      
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling activity reminders:', error);
      return [];
    }
  }
  
  // Cancel notification by ID
  static async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }
  
  // Get all pending notifications
  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
  
  // Add notification listener
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }
  
  // Add notification response listener (when user taps notification)
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
  
  // Remove notification listener
  static removeNotificationSubscription(subscription: Notifications.Subscription): void {
    Notifications.removeNotificationSubscription(subscription);
  }
}

export default NotificationService;