// NOTIFICATIONS - DEPRECATED - Use notificationService.js instead
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { db } from "../config/firebaseConfig";
import { ref, set } from "firebase/database";

// NOTE: Token registration functions are centralized in notificationService.js.

export async function saveCustomerPushToken(customerId, tokens) {
  console.log('🔍 Saving customer push token:', customerId);
  console.log('📱 Tokens:', tokens);
  
  if (!customerId || !tokens) {
    console.log('❌ Missing customerId or tokens');
    return;
  }
  
  const { expoPushToken, fcmToken } = tokens;
  
  try {
    // Test Firebase connection first
    const testRef = ref(db, 'test/connection');
    await set(testRef, { timestamp: new Date().toISOString() });
    console.log('✅ Firebase connection test passed');
    
    if (expoPushToken) {
      const expoRef = ref(db, `customerPushTokens/${customerId}/expo/${encodeURIComponent(expoPushToken)}`);
      await set(expoRef, {
        token: expoPushToken,
        timestamp: new Date().toISOString(),
        platform: 'expo'
      });
      console.log('✅ Expo token saved successfully');
    }
    
    if (fcmToken) {
      const fcmRef = ref(db, `customerPushTokens/${customerId}/fcm/${encodeURIComponent(fcmToken)}`);
      await set(fcmRef, {
        token: fcmToken,
        timestamp: new Date().toISOString(),
        platform: 'fcm'
      });
      console.log('✅ FCM token saved successfully');
    }
    
    console.log('✅ All push tokens saved successfully');
  } catch (error) {
    console.error('❌ Error saving push tokens to Firebase:', error);
    console.error('Error detailsasdsdasdasd:', {
      code: error.code,
      message: error.message,
      customerId,
      hasExpoToken: !!expoPushToken,
      hasFcmToken: !!fcmToken
    });
  }
}


// Upsert the current FCM token for a customer under a stable path
// Path: customerPushTokens/{customerId}/current
export async function saveOrUpdateCustomerFcmToken(customerId, fcmToken) {
  try {
    if (!customerId || !fcmToken) {
      console.log('❌ Missing customerId or fcmToken');
      console.log('customerId:', customerId);
      console.log('fcmToken:', fcmToken);
      return;
    }

    console.log('🔍 Saving FCM token to Firebase for customer:', customerId);
    console.log('📱 FCM Token:', fcmToken);
    console.log('🌐 Platform:', Platform.OS);

    const currentRef = ref(db, `customerPushTokens/${customerId}/current`);
    const tokenData = {
      token: fcmToken,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      customerId: customerId,
    };
    
    await set(currentRef, tokenData);
    console.log('✅ Current FCM token upserted for customer:', customerId);
    console.log('📊 Token data saved:', tokenData);
    
    return true;
  } catch (error) {
    console.error('❌ Error upserting current FCM token:', error);
    console.error('Error detailssdddasdasdasdasdadasdasdae3444:', {
      code: error.code,
      message: error.message,
      customerId,
      fcmToken: fcmToken ? 'present' : 'missing',
      platform: Platform.OS
    });
    return false;
  }
}


// Debug utility to test FCM token saving
export async function testFCMTokenSaving(customerId, fcmToken) {
  console.log("🧪 Testing FCM token saving...");
  console.log("Customer ID:", customerId);
  console.log("FCM Token:", fcmToken);
  
  try {
    const result = await saveOrUpdateCustomerFcmToken(customerId, fcmToken);
    console.log("Test result:", result ? "✅ Success" : "❌ Failed");
    return result;
  } catch (error) {
    console.error("Test error:", error);
    return false;
  }
}

// DEPRECATED: These functions are now in notificationService.js
// Keeping this file for backward compatibility but functions are disabled
