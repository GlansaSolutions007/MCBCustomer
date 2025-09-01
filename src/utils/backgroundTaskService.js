import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "@env";
import { monitorBookingsForNotifications } from "./notificationService";

// Background task name
const BACKGROUND_FETCH_TASK = 'background-booking-monitor';

// Register background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background task: Monitoring bookings for notifications');
    
    // Get user data
    const userData = await AsyncStorage.getItem("userData");
    if (!userData) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const parsedUserData = JSON.parse(userData);
    const custID = parsedUserData.custID;
    
    if (!custID) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Fetch current bookings
    const response = await axios.get(`${API_URL}Bookings/${custID}`);
    const bookings = response.data || [];

    // Monitor for notification changes
    await monitorBookingsForNotifications(bookings, custID);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background fetch
export const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes minimum
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered successfully');
  } catch (error) {
    console.error('Error registering background fetch:', error);
  }
};

// Unregister background fetch
export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch unregistered successfully');
  } catch (error) {
    console.error('Error unregistering background fetch:', error);
  }
};

// Get background fetch status
export const getBackgroundFetchStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    console.log('Background fetch status:', status);
    return status;
  } catch (error) {
    console.error('Error getting background fetch status:', error);
    return null;
  }
};
