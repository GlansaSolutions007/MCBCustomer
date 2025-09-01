import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "@env";
import { registerBackgroundFetch } from "./backgroundTaskService";

// Notification status tracking keys
const NOTIFICATION_KEYS = {
  TECH_ASSIGNED: 'tech_assigned_',
  STATUS_CHANGE: 'status_change_',
  JOURNEY_START: 'journey_start_',
  REACHED: 'reached_',
  SERVICE_START: 'service_start_',
  COMPLETED: 'completed_',
  CANCELLED: 'cancelled_'
};

// Status notification messages
const STATUS_MESSAGES = {
  'Confirmed': {
    title: 'Technician Assigned! 🚗',
    body: 'Your technician has been assigned and will contact you soon.',
    type: 'tech_assigned'
  },
  'StartJourney': {
    title: 'Technician is on the way! 🚗',
    body: 'Your technician has started the journey to your location.',
    type: 'journey_start'
  },
  'Reached': {
    title: 'Technician has arrived! ✅',
    body: 'Your technician has reached your location and is ready to start.',
    type: 'reached'
  },
  'StartService': {
    title: 'Service Started! 🔧',
    body: 'Your technician has begun working on your vehicle.',
    type: 'service_start'
  },
  'Completed': {
    title: 'Service Completed! 🎉',
    body: 'Your vehicle service has been completed successfully.',
    type: 'completed'
  },
  'Cancelled': {
    title: 'Booking Cancelled ❌',
    body: 'Your service booking has been cancelled.',
    type: 'cancelled'
  }
};

// Initialize notification channels for Android
export const initializeNotificationChannels = async () => {
  if (Platform.OS === "android") {
    // Main channel for all notifications
    await Notifications.setNotificationChannelAsync("default", {
      name: "Service Updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "notificationtone.wav",
      enableVibrate: true,
      enableLights: true,
    });

    // High priority channel for urgent updates
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#FF0000",
      sound: "notificationtone.wav",
      enableVibrate: true,
      enableLights: true,
    });
  }
};

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  await initializeNotificationChannels();

  let expoPushToken = null;
  let fcmToken = null;

  try {
    expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", expoPushToken);
  } catch (error) {
    console.error("Error getting Expo push token:", error);
  }

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    fcmToken = deviceToken?.data || null;
    console.log("FCM Token:", fcmToken);
  } catch (error) {
    console.error("Error getting FCM token:", error);
  }

  return { expoPushToken, fcmToken };
};

// Save customer push token to backend
export const saveCustomerPushToken = async (customerId, tokens) => {
  if (!customerId || !tokens) return;

  try {
    const { expoPushToken, fcmToken } = tokens;
    
    await axios.post(`${API_URL}Push/register`, {
      userType: 'customer',
      id: Number(customerId),
      fcmToken: fcmToken || null,
      expoPushToken: expoPushToken || null,
      platform: Platform.OS,
    });

    // Store tokens locally for backup
    await AsyncStorage.setItem('pushToken', fcmToken || expoPushToken || '');
    await AsyncStorage.setItem('pushTokenType', fcmToken ? 'fcm' : (expoPushToken ? 'expo' : 'unknown'));
    
    console.log("Push tokens saved successfully");
  } catch (error) {
    console.error("Error saving push tokens:", error);
  }
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}, channelId = "default") => {
  try {
    // Get user settings
    const settings = await getUserNotificationSettings();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: settings.soundEnabled ? "notificationtone.wav" : null,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
    console.log("Local notification sent:", title);
  } catch (error) {
    console.error("Error sending local notification:", error);
  }
};

// Send push notification via backend
export const sendPushNotification = async (customerId, title, body, data = {}) => {
  try {
    await axios.post(`${API_URL}Push/sendToCustomer`, {
      id: Number(customerId),
      title,
      body,
      data,
    });
    console.log("Push notification sent via backend:", title);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

// Get user notification settings
export const getUserNotificationSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem('notificationSettings');
    return settings ? JSON.parse(settings) : {
      technicianAssigned: true,
      startJourney: true,
      reached: true,
      startService: true,
      completed: true,
      cancelled: true,
      pushNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      technicianAssigned: true,
      startJourney: true,
      reached: true,
      startService: true,
      completed: true,
      cancelled: true,
      pushNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }
};
export const hasNotificationBeenSent = async (bookingId, eventType) => {
  try {
    const key = `${eventType}${bookingId}`;
    const sent = await AsyncStorage.getItem(key);
    return sent === 'true';
  } catch (error) {
    console.error("Error checking notification status:", error);
    return false;
  }
};

// Mark notification as sent
export const markNotificationAsSent = async (bookingId, eventType) => {
  try {
    const key = `${eventType}${bookingId}`;
    await AsyncStorage.setItem(key, 'true');
  } catch (error) {
    console.error("Error marking notification as sent:", error);
  }
};

// Handle technician assignment notification
export const handleTechnicianAssignment = async (booking, customerId) => {
  const bookingId = booking.BookingID;
  const techName = booking.TechFullName || 'Your technician';
  const trackId = booking.BookingTrackID;

  // Get user settings
  const settings = await getUserNotificationSettings();
  if (!settings.technicianAssigned) return;

  // Check if we've already sent this notification
  const alreadySent = await hasNotificationBeenSent(bookingId, NOTIFICATION_KEYS.TECH_ASSIGNED);
  if (alreadySent) return;

  const title = 'Technician Assigned! 🚗';
  const body = `${techName} has been assigned to your booking ${trackId}. They will contact you soon.`;

  // Send local notification
  await sendLocalNotification(title, body, {
    type: 'technician_assigned',
    bookingId: String(bookingId),
    trackId: trackId,
    techName: techName
  }, 'urgent');

  // Send push notification if enabled
  if (settings.pushNotifications) {
    await sendPushNotification(customerId, title, body, {
      type: 'technician_assigned',
      bookingId: String(bookingId),
      trackId: trackId,
      techName: techName
    });
  }

  // Mark as sent
  await markNotificationAsSent(bookingId, NOTIFICATION_KEYS.TECH_ASSIGNED);
};

// Handle status change notification
export const handleStatusChange = async (booking, customerId, previousStatus) => {
  const bookingId = booking.BookingID;
  const currentStatus = booking.BookingStatus;
  const trackId = booking.BookingTrackID;
  const techName = booking.TechFullName || 'Your technician';

  // Skip if status hasn't changed
  if (previousStatus === currentStatus) return;

  // Get notification message for current status
  const statusMessage = STATUS_MESSAGES[currentStatus];
  if (!statusMessage) return;

  // Get user settings
  const settings = await getUserNotificationSettings();
  
  // Check if this status notification is enabled
  const settingKey = currentStatus === 'StartJourney' ? 'startJourney' :
                    currentStatus === 'Reached' ? 'reached' :
                    currentStatus === 'StartService' ? 'startService' :
                    currentStatus === 'Completed' ? 'completed' :
                    currentStatus === 'Cancelled' ? 'cancelled' : null;
  
  if (settingKey && !settings[settingKey]) return;

  // Check if we've already sent this notification
  const alreadySent = await hasNotificationBeenSent(bookingId, `${NOTIFICATION_KEYS.STATUS_CHANGE}${currentStatus}`);
  if (alreadySent) return;

  // Customize message based on status
  let title = statusMessage.title;
  let body = statusMessage.body;

  // Add technician name for relevant statuses
  if (['StartJourney', 'Reached', 'StartService'].includes(currentStatus) && techName) {
    body = body.replace('Your technician', techName);
  }

  // Add booking ID for reference
  body += ` (Booking: ${trackId})`;

  // Determine channel based on urgency
  const isUrgent = ['Reached', 'StartService', 'Completed'].includes(currentStatus);
  const channelId = isUrgent ? 'urgent' : 'default';

  // Send local notification
  await sendLocalNotification(title, body, {
    type: statusMessage.type,
    bookingId: String(bookingId),
    trackId: trackId,
    status: currentStatus,
    techName: techName
  }, channelId);

  // Send push notification if enabled
  if (settings.pushNotifications) {
    await sendPushNotification(customerId, title, body, {
      type: statusMessage.type,
      bookingId: String(bookingId),
      trackId: trackId,
      status: currentStatus,
      techName: techName
    });
  }

  // Mark as sent
  await markNotificationAsSent(bookingId, `${NOTIFICATION_KEYS.STATUS_CHANGE}${currentStatus}`);
};

// Monitor bookings for changes and send notifications
export const monitorBookingsForNotifications = async (currentBookings, customerId) => {
  try {
    // Get previous bookings from storage
    const previousBookingsKey = `previous_bookings_${customerId}`;
    const previousBookingsData = await AsyncStorage.getItem(previousBookingsKey);
    const previousBookings = previousBookingsData ? JSON.parse(previousBookingsData) : [];

    // Create maps for easy comparison
    const currentBookingsMap = new Map(currentBookings.map(b => [b.BookingID, b]));
    const previousBookingsMap = new Map(previousBookings.map(b => [b.BookingID, b]));

    // Check each current booking for changes
    for (const [bookingId, currentBooking] of currentBookingsMap) {
      const previousBooking = previousBookingsMap.get(bookingId);

      if (!previousBooking) {
        // New booking - no notifications needed
        continue;
      }

      // Check for technician assignment
      const wasAssigned = previousBooking.TechID !== null && previousBooking.TechID !== undefined;
      const isAssigned = currentBooking.TechID !== null && currentBooking.TechID !== undefined;
      
      if (!wasAssigned && isAssigned) {
        await handleTechnicianAssignment(currentBooking, customerId);
      }

      // Check for status changes
      if (previousBooking.BookingStatus !== currentBooking.BookingStatus) {
        await handleStatusChange(currentBooking, customerId, previousBooking.BookingStatus);
      }
    }

    // Store current bookings for next comparison
    await AsyncStorage.setItem(previousBookingsKey, JSON.stringify(currentBookings));
  } catch (error) {
    console.error("Error monitoring bookings for notifications:", error);
  }
};

// Setup notification listeners
export const setupNotificationListeners = () => {
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received:", notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification response:", response);
    // Handle notification tap - navigate to relevant screen
    const data = response.notification.request.content.data;
    if (data?.bookingId) {
      // Navigate to booking details
      // This will be handled by the navigation context
    }
  });

  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
};

// Initialize notification system
export const initializeNotificationSystem = async (customerId) => {
  try {
    // Register for push notifications
    const tokens = await registerForPushNotificationsAsync();
    if (tokens && customerId) {
      await saveCustomerPushToken(customerId, tokens);
    }

    // Setup notification listeners
    const cleanup = setupNotificationListeners();

    // Register background fetch for continuous monitoring
    await registerBackgroundFetch();

    console.log("Notification system initialized successfully");
    return cleanup;
  } catch (error) {
    console.error("Error initializing notification system:", error);
  }
};
