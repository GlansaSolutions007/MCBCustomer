/* NOTIFICATIONS CONFIG DISABLED
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";
// import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return { expoPushToken: null, fcmToken: null };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return { expoPushToken: null, fcmToken: null };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let expoPushToken = null;
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    expoPushToken = tokenResponse?.data ?? null;
  } catch (e) {
    console.log("getExpoPushTokenAsync error (customer):", e?.message || e);
  }

  let fcmToken = null;
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    fcmToken = deviceToken?.data || null;
  } catch (e) {
    console.log("getDevicePushTokenAsync error (customer):", e?.message || e);
  }

  return { expoPushToken, fcmToken };
}
*/

// Export empty function to prevent errors
export const registerForPushNotificationsAsync = () => Promise.resolve({ expoPushToken: null, fcmToken: null });
