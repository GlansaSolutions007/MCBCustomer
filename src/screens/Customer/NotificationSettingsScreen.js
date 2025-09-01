import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import CustomText from "../../components/CustomText";
import { color } from "../../styles/theme";
import globalStyles from "../../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";

const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState({
    technicianAssigned: true,
    startJourney: true,
    reached: true,
    startService: true,
    completed: true,
    cancelled: true,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive service updates.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification to verify your settings.',
          sound: settings.soundEnabled ? "notificationtone.wav" : null,
        },
        trigger: null,
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const SettingItem = ({ title, description, value, onValueChange, icon }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon} size={20} color={color.primary} style={styles.settingIcon} />
          <CustomText style={[globalStyles.f14Bold, styles.settingTitle]}>{title}</CustomText>
        </View>
        <CustomText style={[globalStyles.f12Regular, styles.settingDescription]}>{description}</CustomText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: color.primary }}
        thumbColor={value ? color.white : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <CustomText style={[globalStyles.f16Bold, styles.sectionTitle]}>
          Notification Permissions
        </CustomText>
        
        <View style={styles.permissionCard}>
          <View style={styles.permissionInfo}>
            <CustomText style={[globalStyles.f14Bold, styles.permissionTitle]}>
              Push Notifications
            </CustomText>
            <CustomText style={[globalStyles.f12Regular, styles.permissionDescription]}>
              Allow notifications to receive real-time service updates
            </CustomText>
            <CustomText style={[globalStyles.f12Regular, styles.permissionStatus]}>
              Status: {permissionStatus === 'granted' ? '✅ Enabled' : '❌ Disabled'}
            </CustomText>
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              permissionStatus === 'granted' && styles.permissionButtonDisabled
            ]}
            onPress={requestPermissions}
            disabled={permissionStatus === 'granted'}
          >
            <CustomText style={styles.permissionButtonText}>
              {permissionStatus === 'granted' ? 'Granted' : 'Enable'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <CustomText style={[globalStyles.f16Bold, styles.sectionTitle]}>
          Service Status Notifications
        </CustomText>
        
        <SettingItem
          title="Technician Assigned"
          description="Get notified when a technician is assigned to your booking"
          value={settings.technicianAssigned}
          onValueChange={(value) => handleSettingChange('technicianAssigned', value)}
          icon="person-add"
        />

        <SettingItem
          title="Journey Started"
          description="Get notified when your technician starts the journey"
          value={settings.startJourney}
          onValueChange={(value) => handleSettingChange('startJourney', value)}
          icon="car"
        />

        <SettingItem
          title="Technician Arrived"
          description="Get notified when your technician reaches your location"
          value={settings.reached}
          onValueChange={(value) => handleSettingChange('reached', value)}
          icon="location"
        />

        <SettingItem
          title="Service Started"
          description="Get notified when your technician begins the service"
          value={settings.startService}
          onValueChange={(value) => handleSettingChange('startService', value)}
          icon="construct"
        />

        <SettingItem
          title="Service Completed"
          description="Get notified when your service is completed"
          value={settings.completed}
          onValueChange={(value) => handleSettingChange('completed', value)}
          icon="checkmark-circle"
        />

        <SettingItem
          title="Booking Cancelled"
          description="Get notified if your booking is cancelled"
          value={settings.cancelled}
          onValueChange={(value) => handleSettingChange('cancelled', value)}
          icon="close-circle"
        />
      </View>

      <View style={styles.section}>
        <CustomText style={[globalStyles.f16Bold, styles.sectionTitle]}>
          Notification Preferences
        </CustomText>
        
        <SettingItem
          title="Sound"
          description="Play sound for notifications"
          value={settings.soundEnabled}
          onValueChange={(value) => handleSettingChange('soundEnabled', value)}
          icon="volume-high"
        />

        <SettingItem
          title="Vibration"
          description="Vibrate device for notifications"
          value={settings.vibrationEnabled}
          onValueChange={(value) => handleSettingChange('vibrationEnabled', value)}
          icon="phone-portrait"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Ionicons name="notifications" size={20} color={color.white} />
          <CustomText style={styles.testButtonText}>Send Test Notification</CustomText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: color.primary,
    marginBottom: 12,
  },
  permissionCard: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    color: color.primary,
    marginBottom: 4,
  },
  permissionDescription: {
    color: '#666',
    marginBottom: 8,
  },
  permissionStatus: {
    color: '#666',
    fontStyle: 'italic',
  },
  permissionButton: {
    backgroundColor: color.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  permissionButtonText: {
    color: color.white,
    ...globalStyles.f12Bold,
  },
  settingItem: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingTitle: {
    color: color.primary,
  },
  settingDescription: {
    color: '#666',
    marginLeft: 28,
  },
  testButton: {
    backgroundColor: color.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: color.white,
    ...globalStyles.f14Bold,
    marginLeft: 8,
  },
});

export default NotificationSettingsScreen;
