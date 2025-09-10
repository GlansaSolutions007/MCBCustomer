import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { db } from '../../config/firebaseConfig';
import { ref, set, get, push, onValue, off } from 'firebase/database';
import CustomText from '../../components/CustomText';
import { color } from '../../styles/theme';
import globalStyles from '../../styles/globalStyles';

export default function FirebaseTestScreen() {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Unknown');

  useEffect(() => {
    // Test connection status
    testConnectionStatus();
    return () => {
      // Cleanup listeners
      const connectedRef = ref(db, '.info/connected');
      off(connectedRef);
    };
  }, []);

  const testConnectionStatus = () => {
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setConnectionStatus(connected ? 'Connected' : 'Disconnected');
      console.log('Firebase connection status:', connected ? 'Connected' : 'Disconnected');
    });
  };

  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result, timestamp: new Date().toISOString() }
      }));
      console.log(`✅ Test ${testName} passed:`, result);
    } catch (error) {
      console.error(`❌ Test ${testName} failed:`, error);
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, timestamp: new Date().toISOString() }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicConnection = async () => {
    const testRef = ref(db, 'test/connection');
    await set(testRef, {
      timestamp: new Date().toISOString(),
      test: true,
      message: 'Basic connection test successful'
    });
    return 'Basic connection test passed';
  };

  const testDataReading = async () => {
    const testRef = ref(db, 'test/connection');
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error('No data found at test path');
  };

  const testCustomerPushTokenSaving = async () => {
    const customerId = 'test_customer_123';
    const tokens = {
      expoPushToken: 'ExponentPushToken[test_expo_token]',
      fcmToken: 'test_fcm_token_123'
    };

    const { expoPushToken, fcmToken } = tokens;
    
    if (expoPushToken) {
      const expoRef = ref(db, `customerPushTokens/${customerId}/expo/${encodeURIComponent(expoPushToken)}`);
      await set(expoRef, {
        token: expoPushToken,
        timestamp: new Date().toISOString(),
        platform: 'expo'
      });
    }
    
    if (fcmToken) {
      const fcmRef = ref(db, `customerPushTokens/${customerId}/fcm/${encodeURIComponent(fcmToken)}`);
      await set(fcmRef, {
        token: fcmToken,
        timestamp: new Date().toISOString(),
        platform: 'fcm'
      });
    }
    
    return 'Customer push token saving test passed';
  };

  const testTechnicianLocationSaving = async () => {
    const techId = 'test_tech_123';
    const locationData = {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };

    const techRef = ref(db, `technicians/${techId}`);
    await set(techRef, {
      ...locationData,
      lastUpdated: new Date().toISOString(),
      isActive: true
    });
    
    return 'Technician location saving test passed';
  };

  const testNotificationSaving = async () => {
    const customerId = 'test_customer_123';
    const notificationData = {
      title: 'Test Notification',
      body: 'This is a test notification from Firebase test',
      type: 'test',
      read: false
    };

    const notificationRef = ref(db, `notifications/${customerId}`);
    const newNotificationRef = push(notificationRef);
    await set(newNotificationRef, {
      ...notificationData,
      timestamp: new Date().toISOString()
    });
    
    return 'Notification saving test passed';
  };

  const testRealTimeListener = async () => {
    return new Promise((resolve, reject) => {
      const testRef = ref(db, 'test/realtime');
      const timeout = setTimeout(() => {
        off(testRef);
        reject(new Error('Real-time listener timeout'));
      }, 5000);

      onValue(testRef, (snapshot) => {
        clearTimeout(timeout);
        off(testRef);
        if (snapshot.exists()) {
          resolve('Real-time listener test passed');
        } else {
          reject(new Error('No data received from real-time listener'));
        }
      });

      // Trigger the listener by writing test data
      set(testRef, {
        timestamp: new Date().toISOString(),
        test: 'realtime'
      });
    });
  };

  const runAllTests = async () => {
    const tests = [
      { name: 'Basic Connection', func: testBasicConnection },
      { name: 'Data Reading', func: testDataReading },
      { name: 'Customer Push Token Saving', func: testCustomerPushTokenSaving },
      { name: 'Technician Location Saving', func: testTechnicianLocationSaving },
      { name: 'Notification Saving', func: testNotificationSaving },
      { name: 'Real-time Listener', func: testRealTimeListener },
    ];

    for (const test of tests) {
      await runTest(test.name, test.func);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearTestData = async () => {
    try {
      const testRef = ref(db, 'test');
      await set(testRef, null);
      const customerRef = ref(db, 'customerPushTokens/test_customer_123');
      await set(customerRef, null);
      const techRef = ref(db, 'technicians/test_tech_123');
      await set(techRef, null);
      const notificationRef = ref(db, 'notifications/test_customer_123');
      await set(notificationRef, null);
      
      Alert.alert('Success', 'Test data cleared successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to clear test data: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Connected': return color.success || '#4CAF50';
      case 'Disconnected': return color.error || '#F44336';
      default: return color.warning || '#FF9800';
    }
  };

  const getTestResultColor = (testName) => {
    const result = testResults[testName];
    if (!result) return color.textLight || '#666';
    return result.success ? (color.success || '#4CAF50') : (color.error || '#F44336');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CustomText style={styles.title}>Firebase Realtime Database Test</CustomText>
        <View style={styles.connectionStatus}>
          <CustomText style={styles.connectionLabel}>Connection Status:</CustomText>
          <CustomText style={[styles.connectionValue, { color: getStatusColor(connectionStatus) }]}>
            {connectionStatus}
          </CustomText>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Basic Connection', testBasicConnection)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Basic Connection</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Data Reading', testDataReading)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Data Reading</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Customer Push Token Saving', testCustomerPushTokenSaving)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Push Token Saving</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Technician Location Saving', testTechnicianLocationSaving)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Location Saving</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Notification Saving', testNotificationSaving)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Notification Saving</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('Real-time Listener', testRealTimeListener)}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Test Real-time Listener</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Run All Tests</CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearTestData}
          disabled={isLoading}
        >
          <CustomText style={styles.buttonText}>Clear Test Data</CustomText>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <CustomText style={styles.resultsTitle}>Test Results:</CustomText>
        {Object.keys(testResults).length === 0 ? (
          <CustomText style={styles.noResults}>No tests run yet</CustomText>
        ) : (
          Object.entries(testResults).map(([testName, result]) => (
            <View key={testName} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <CustomText style={[styles.testName, { color: getTestResultColor(testName) }]}>
                  {testName}
                </CustomText>
                <CustomText style={styles.testTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </CustomText>
              </View>
              <CustomText style={styles.testResult}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </CustomText>
              {result.success ? (
                <CustomText style={styles.testDetails}>
                  {typeof result.result === 'string' ? result.result : JSON.stringify(result.result)}
                </CustomText>
              ) : (
                <CustomText style={styles.testError}>
                  Error: {result.error}
                </CustomText>
              )}
            </View>
          ))
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <CustomText style={styles.loadingText}>Running tests...</CustomText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background || '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: color.textDark || '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectionLabel: {
    fontSize: 16,
    color: color.textDark || '#333',
    marginRight: 10,
  },
  connectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: color.primary || '#007AFF',
  },
  secondaryButton: {
    backgroundColor: color.secondary || '#34C759',
  },
  dangerButton: {
    backgroundColor: color.error || '#FF3B30',
  },
  buttonText: {
    color: color.white || '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: color.white || '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: color.textDark || '#333',
    marginBottom: 15,
  },
  noResults: {
    fontSize: 14,
    color: color.textLight || '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: color.border || '#e0e0e0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  testTime: {
    fontSize: 12,
    color: color.textLight || '#666',
  },
  testResult: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  testDetails: {
    fontSize: 12,
    color: color.textLight || '#666',
    fontStyle: 'italic',
  },
  testError: {
    fontSize: 12,
    color: color.error || '#FF3B30',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: color.white || '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
