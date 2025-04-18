// app/(tabs)/notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/auth-context';
import { BellIcon } from '../../components/ui/icons';
import { COLORS, FONTS, SIZES } from '../../styles/theme';
import { TextStyle } from 'react-native';

// Define Notification interface
interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  type?: string;
  data?: Record<string, any>;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notificationsData: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Notification, 'id'>),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      }));

      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });

      // Update local state
      setNotifications(
        notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNotificationTime = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // difference in seconds

    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem: ListRenderItem<Notification> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationIcon}>
        <BellIcon size={24} color={COLORS.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {formatNotificationTime(item.createdAt)}
        </Text>
      </View>
      {!item.read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellIcon size={50} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll receive notifications about your activities and programs here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
        />
      )}
    </View>
  );
}

// Fix TypeScript issues with styles by explicitly typing styles that go to Text components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: FONTS.h2.fontSize,
    fontWeight: FONTS.h2.fontWeight as TextStyle['fontWeight'],
    color: COLORS.black,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    padding: SIZES.padding,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: COLORS.primaryLight,
  },
  notificationIcon: {
    marginRight: SIZES.padding,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONTS.h4.fontSize,
    fontWeight: FONTS.h4.fontWeight as TextStyle['fontWeight'],
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  notificationBody: {
    fontSize: FONTS.body3.fontSize,
    fontWeight: FONTS.body3.fontWeight as TextStyle['fontWeight'],
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  notificationTime: {
    fontSize: FONTS.body4.fontSize,
    fontWeight: FONTS.body4.fontWeight as TextStyle['fontWeight'],
    color: COLORS.gray,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    marginTop: SIZES.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    fontSize: FONTS.h3.fontSize,
    fontWeight: FONTS.h3.fontWeight as TextStyle['fontWeight'],
    color: COLORS.gray,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptySubtext: {
    fontSize: FONTS.body3.fontSize,
    fontWeight: FONTS.body3.fontWeight as TextStyle['fontWeight'],
    color: COLORS.gray,
    textAlign: 'center',
  },
});