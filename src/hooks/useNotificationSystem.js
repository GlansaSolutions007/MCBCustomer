/* NOTIFICATION SYSTEM HOOK DISABLED
// import { useEffect, useRef } from 'react';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { initializeNotificationSystem } from '../utils/notificationService';
// import { unregisterBackgroundFetch } from '../utils/backgroundTaskService';

export const useNotificationSystem = () => {
  const cleanupRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      try {
        // Get customer ID from storage
        const userData = await AsyncStorage.getItem("userData");
        const customerId = userData ? JSON.parse(userData)?.custID : null;
        
        if (customerId && isMounted) {
          const cleanup = await initializeNotificationSystem(customerId);
          if (cleanup && isMounted) {
            cleanupRef.current = cleanup;
          }
        }
      } catch (error) {
        console.error("Error setting up notification system:", error);
      }
    };

    setupNotifications();

    // Cleanup function
    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      // Unregister background fetch on unmount
      unregisterBackgroundFetch();
    };
  }, []);

  return null;
};
*/

// Export empty hook to prevent errors
export const useNotificationSystem = () => {
  return null;
};
