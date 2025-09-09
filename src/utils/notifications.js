/* NOTIFICATIONS DISABLED
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";
// import { db } from "../config/firebaseConfig";
// import { ref, set } from "firebase/database";

// export async function registerForPushNotificationsAsync() {
//   if (!Device.isDevice) {
//     return null;
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }
//   if (finalStatus !== "granted") {
//     return null;
//   }

//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.MAX,
//     });
//   }

//   let expoPushToken = null;
//   try {
//     expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
//   } catch (_) {}

//   let fcmToken = null;
//   try {
//     const deviceToken = await Notifications.getDevicePushTokenAsync();
//     fcmToken = deviceToken?.data || null;
//     console.log("FCM Token:", fcmToken);
//   } catch (_) {}

//   return { expoPushToken, fcmToken };
// }

export async function registerForPushNotificationsAsync() {
  let expoPushToken = null;
  let fcmToken = null;

  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return { expoPushToken: null, fcmToken: null };
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permissions not granted!");
      return { expoPushToken: null, fcmToken: null };
    }

    // Case 1: Expo Go (always works with Expo’s default key)
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      expoPushToken = token.data;
    } catch (err) {
      console.log("Expo push token fetch failed:", err.message);
    }

    // Case 2: Development build / Production build (with your own FCM key)
    if (Platform.OS === "android") {
      const projectId = Device.osBuildId; // fallback, but you should hardcode if needed
      try {
        const fcm = await Notifications.getDevicePushTokenAsync();
        fcmToken = fcm.data;
      } catch (err) {
        console.log("FCM token fetch failed:", err.message);
      }
    } else if (Platform.OS === "ios") {
      try {
        const apns = await Notifications.getDevicePushTokenAsync();
        fcmToken = apns.data;
      } catch (err) {
        console.log("APNs token fetch failed:", err.message);
      }
    }
  } catch (err) {
    console.log("Push registration error:", err.message);
  }

  return { expoPushToken, fcmToken };
}

export async function saveCustomerPushToken(customerId, tokens) {
  console.log(customerId,'CID......');
  
  if (!customerId || !tokens) return;
  const { expoPushToken, fcmToken } = tokens;
  const baseRef = ref(db, `customerPushTokens/${customerId}`);
  try {
    if (expoPushToken) {
      await set(ref(db, `customerPushTokens/${customerId}/expo/${encodeURIComponent(expoPushToken)}`), true);
    }
    if (fcmToken) {
      await set(ref(db, `customerPushTokens/${customerId}/fcm/${encodeURIComponent(fcmToken)}`), true);
    }
  } catch (_) {}
}
*/

// Export empty functions to prevent errors
export const registerForPushNotificationsAsync = () => Promise.resolve({});
export const saveCustomerPushToken = () => Promise.resolve();
