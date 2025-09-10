import { db } from '../config/firebaseConfig';
import { ref, set, get, push, onValue, off } from 'firebase/database';

// Debug Firebase Realtime Database connection and data insertion
export const firebaseDebug = {
  // Test basic connection
  async testConnection() {
    try {
      console.log('🔍 Testing Firebase Realtime Database connection...');
      console.log('Database URL:', db.app.options.databaseURL);
      
      // Test write operation
      const testRef = ref(db, 'test/connection');
      await set(testRef, {
        timestamp: new Date().toISOString(),
        test: true,
        message: 'Connection test successful'
      });
      
      console.log('✅ Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  },

  // Test customer push token saving
  async testCustomerPushTokenSaving(customerId, tokens) {
    try {
      console.log('🔍 Testing customer push token saving...');
      console.log('Customer ID:', customerId);
      console.log('Tokens:', tokens);
      
      if (!customerId || !tokens) {
        console.log('❌ Missing customerId or tokens');
        return false;
      }

      const { expoPushToken, fcmToken } = tokens;
      const baseRef = ref(db, `customerPushTokens/${customerId}`);
      
      // Test expo token saving
      if (expoPushToken) {
        const expoRef = ref(db, `customerPushTokens/${customerId}/expo/${encodeURIComponent(expoPushToken)}`);
        await set(expoRef, {
          token: expoPushToken,
          timestamp: new Date().toISOString(),
          platform: 'expo'
        });
        console.log('✅ Expo token saved successfully');
      }
      
      // Test FCM token saving
      if (fcmToken) {
        const fcmRef = ref(db, `customerPushTokens/${customerId}/fcm/${encodeURIComponent(fcmToken)}`);
        await set(fcmRef, {
          token: fcmToken,
          timestamp: new Date().toISOString(),
          platform: 'fcm'
        });
        console.log('✅ FCM token saved successfully');
      }
      
      console.log('✅ Customer push token saving test successful');
      return true;
    } catch (error) {
      console.error('❌ Customer push token saving test failed:', error);
      return false;
    }
  },

  // Test reading data
  async testDataReading(path) {
    try {
      console.log('🔍 Testing data reading from path:', path);
      
      const dataRef = ref(db, path);
      const snapshot = await get(dataRef);
      
      if (snapshot.exists()) {
        console.log('✅ Data read successfully:', snapshot.val());
        return snapshot.val();
      } else {
        console.log('ℹ️ No data found at path:', path);
        return null;
      }
    } catch (error) {
      console.error('❌ Data reading test failed:', error);
      return null;
    }
  },

  // Test real-time listener
  testRealtimeListener(path, callback) {
    try {
      console.log('🔍 Testing real-time listener on path:', path);
      
      const dataRef = ref(db, path);
      const unsubscribe = onValue(dataRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log('📡 Real-time data received:', snapshot.val());
          if (callback) callback(snapshot.val());
        } else {
          console.log('📡 No data at path:', path);
        }
      }, (error) => {
        console.error('❌ Real-time listener error:', error);
      });
      
      console.log('✅ Real-time listener started');
      return unsubscribe;
    } catch (error) {
      console.error('❌ Real-time listener test failed:', error);
      return null;
    }
  },

  // Test technician location tracking
  async testTechnicianLocationSaving(techId, locationData) {
    try {
      console.log('🔍 Testing technician location saving...');
      console.log('Tech ID:', techId);
      console.log('Location data:', locationData);
      
      const techRef = ref(db, `technicians/${techId}`);
      await set(techRef, {
        ...locationData,
        lastUpdated: new Date().toISOString(),
        isActive: true
      });
      
      console.log('✅ Technician location saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Technician location saving test failed:', error);
      return false;
    }
  },

  // Test notification saving
  async testNotificationSaving(customerId, notificationData) {
    try {
      console.log('🔍 Testing notification saving...');
      console.log('Customer ID:', customerId);
      console.log('Notification data:', notificationData);
      
      const notificationRef = ref(db, `notifications/${customerId}`);
      const newNotificationRef = push(notificationRef);
      await set(newNotificationRef, {
        ...notificationData,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      console.log('✅ Notification saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Notification saving test failed:', error);
      return false;
    }
  },

  // Comprehensive test
  async runAllTests(customerId, tokens) {
    console.log('🧪 Running comprehensive Firebase Realtime Database tests...');
    
    const results = {
      connection: false,
      pushTokenSaving: false,
      dataReading: false,
      technicianLocation: false,
      notificationSaving: false
    };
    
    // Test connection
    results.connection = await this.testConnection();
    
    // Test push token saving
    if (customerId && tokens) {
      results.pushTokenSaving = await this.testCustomerPushTokenSaving(customerId, tokens);
    }
    
    // Test data reading
    const testData = await this.testDataReading('test/connection');
    results.dataReading = testData !== null;
    
    // Test technician location saving
    results.technicianLocation = await this.testTechnicianLocationSaving('test_tech_123', {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 10
    });
    
    // Test notification saving
    results.notificationSaving = await this.testNotificationSaving(customerId || 'test_customer', {
      title: 'Test Notification',
      body: 'This is a test notification',
      type: 'test'
    });
    
    // Summary
    console.log('📊 Firebase Test Results Summary:');
    console.log('Connection:', results.connection ? '✅' : '❌');
    console.log('Push Token Saving:', results.pushTokenSaving ? '✅' : '❌');
    console.log('Data Reading:', results.dataReading ? '✅' : '❌');
    console.log('Technician Location:', results.technicianLocation ? '✅' : '❌');
    console.log('Notification Saving:', results.notificationSaving ? '✅' : '❌');
    
    return results;
  }
};

export default firebaseDebug;
