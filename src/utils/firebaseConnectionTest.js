// Firebase Connection Test Utility
import { db } from '../config/firebaseConfig';
import { ref, set, get, onValue, off } from 'firebase/database';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔍 Testing Firebase Realtime Database connection...');
    
    // Test 1: Basic connection
    const testRef = ref(db, 'test/connection');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      test: true,
      message: 'Connection test successful'
    });
    console.log('✅ Basic write test passed');
    
    // Test 2: Read test
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Basic read test passed');
      console.log('📊 Test data:', snapshot.val());
    } else {
      console.log('❌ Basic read test failed - no data found');
    }
    
    // Test 3: Connection status
    const connectedRef = ref(db, '.info/connected');
    return new Promise((resolve) => {
      const unsubscribe = onValue(connectedRef, (snapshot) => {
        const connected = snapshot.val();
        console.log('📡 Connection status:', connected ? 'Connected' : 'Disconnected');
        unsubscribe();
        resolve({
          success: true,
          connected: connected,
          message: connected ? 'Firebase is connected and ready' : 'Firebase is disconnected'
        });
      }, (error) => {
        console.error('❌ Connection status check failed:', error);
        unsubscribe();
        resolve({
          success: false,
          connected: false,
          error: error.message
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
};

export const checkFirebaseRules = async () => {
  try {
    console.log('🔍 Checking Firebase Realtime Database rules...');
    
    // Try to write to a test path
    const testRef = ref(db, 'test/rules');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      test: 'rules_check'
    });
    
    // Try to read from the test path
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Firebase rules allow read/write access');
      return {
        success: true,
        message: 'Firebase rules are properly configured'
      };
    } else {
      console.log('❌ Firebase rules may be too restrictive');
      return {
        success: false,
        message: 'Firebase rules may be blocking read/write access'
      };
    }
  } catch (error) {
    console.error('❌ Firebase rules check failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Firebase rules check failed - check your database rules'
    };
  }
};

export const diagnoseFirebaseIssues = async () => {
  console.log('🔍 Starting comprehensive Firebase diagnosis...');
  
  const results = {
    connection: await testFirebaseConnection(),
    rules: await checkFirebaseRules(),
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Firebase Diagnosis Results:');
  console.log('Connection:', results.connection.success ? '✅' : '❌');
  console.log('Rules:', results.rules.success ? '✅' : '❌');
  
  if (!results.connection.success) {
    console.log('💡 Connection Issues:');
    console.log('- Check your internet connection');
    console.log('- Verify Firebase project is active');
    console.log('- Check Firebase billing status');
    console.log('- Verify database URL is correct');
  }
  
  if (!results.rules.success) {
    console.log('💡 Rules Issues:');
    console.log('- Update Firebase Realtime Database rules');
    console.log('- Set rules to allow read/write for testing');
    console.log('- Check Firebase Console for rule updates');
  }
  
  return results;
};
