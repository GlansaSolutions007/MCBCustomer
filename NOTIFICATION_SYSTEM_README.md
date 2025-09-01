# My Car Buddy - Notification System

## Overview
This notification system provides comprehensive real-time updates for service booking statuses in the My Car Buddy customer app. It ensures users receive timely notifications even when the mobile is locked or the app is in the background.

## Features

### Service Status Notifications
- **Technician Assigned** - When a technician is assigned to a booking
- **Start Journey** - When technician starts traveling to customer location
- **Reached** - When technician arrives at customer location
- **Start Service** - When technician begins the service work
- **Completed** - When service is completed successfully
- **Cancelled** - When booking is cancelled

### Technical Features
- **Live Notifications** - Works even when mobile is locked
- **Background Monitoring** - Continuous monitoring via background tasks
- **User Preferences** - Customizable notification settings
- **Dual Notification System** - Local + Push notifications
- **Duplicate Prevention** - Prevents duplicate notifications
- **Sound & Vibration** - Configurable audio and haptic feedback

## Architecture

### Core Components

1. **notificationService.js** - Main notification logic and status monitoring
2. **backgroundTaskService.js** - Background task for continuous monitoring
3. **NotificationSettingsScreen.js** - User settings management
4. **useNotificationSystem.js** - React hook for system lifecycle

### Notification Flow

```
Booking Status Change → Monitor Service → Check User Settings → Send Notifications
```

1. **Status Detection**: Monitors booking data for status changes
2. **Settings Check**: Verifies user notification preferences
3. **Duplicate Check**: Ensures notification hasn't been sent before
4. **Local Notification**: Sends immediate local notification
5. **Push Notification**: Sends server-based push notification
6. **Status Tracking**: Marks notification as sent

## Implementation Details

### Status Messages
```javascript
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
  // ... more statuses
};
```

### Background Monitoring
- Uses Expo Background Fetch for continuous monitoring
- Runs every 15 minutes minimum
- Monitors all active bookings for changes
- Works even when app is terminated

### User Settings
Users can customize:
- Individual status notifications (enable/disable)
- Sound preferences
- Vibration preferences
- Push notification preferences

### Notification Channels (Android)
- **Default Channel**: Regular service updates
- **Urgent Channel**: High-priority updates (arrival, service start, completion)

## Setup Instructions

### 1. Install Dependencies
```bash
expo install expo-notifications expo-background-fetch expo-task-manager
```

### 2. Configure App
Update `app.config.js`:
```javascript
plugins: [
  [
    "expo-notifications",
    {
      icon: "./assets/icons/active.png",
      color: "#ffffff",
      sounds: ["./assets/notificationtone.wav"],
    },
  ],
  [
    "expo-background-fetch",
    {
      minimumInterval: 15 * 60, // 15 minutes
    },
  ],
],
```

### 3. Initialize System
```javascript
import { useNotificationSystem } from './src/hooks/useNotificationSystem';

export default function App() {
  useNotificationSystem();
  // ... rest of app
}
```

### 4. Monitor Bookings
```javascript
import { monitorBookingsForNotifications } from './src/utils/notificationService';

// In your booking fetch function
const bookings = await fetchBookings();
if (customerId) {
  monitorBookingsForNotifications(bookings, customerId);
}
```

## API Integration

### Backend Endpoints Required
- `POST /Push/register` - Register push tokens
- `POST /Push/sendToCustomer` - Send push notifications
- `GET /Bookings/{customerId}` - Fetch customer bookings

### Push Token Registration
```javascript
await axios.post(`${API_URL}Push/register`, {
  userType: 'customer',
  id: Number(customerId),
  fcmToken: fcmToken || null,
  expoPushToken: expoPushToken || null,
  platform: Platform.OS,
});
```

## Testing

### Test Notifications
1. Navigate to Notification Settings screen
2. Tap "Send Test Notification"
3. Verify notification appears with sound/vibration

### Test Status Changes
1. Create a test booking
2. Simulate status changes in backend
3. Verify notifications are triggered

### Test Background Monitoring
1. Put app in background
2. Simulate status change
3. Verify notification appears

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check notification permissions
   - Verify user settings are enabled
   - Check device notification settings

2. **Background monitoring not working**
   - Verify background fetch is registered
   - Check device battery optimization settings
   - Ensure app has necessary permissions

3. **Duplicate notifications**
   - Check notification tracking logic
   - Verify AsyncStorage is working properly

### Debug Logs
Enable debug logging by checking console output for:
- "Notification system initialized successfully"
- "Local notification sent: [title]"
- "Push notification sent via backend: [title]"
- "Background task: Monitoring bookings for notifications"

## Security Considerations

1. **Token Storage**: Push tokens are stored securely in AsyncStorage
2. **Permission Handling**: Proper permission request and fallback
3. **Error Handling**: Graceful degradation when services fail
4. **Data Validation**: Input validation for all notification data

## Performance Optimization

1. **Efficient Monitoring**: Only monitors when necessary
2. **Background Task Limits**: Respects device battery and performance
3. **Duplicate Prevention**: Prevents unnecessary notifications
4. **Memory Management**: Proper cleanup of listeners and tasks

## Future Enhancements

1. **Rich Notifications**: Add images and action buttons
2. **Scheduled Notifications**: Reminders for upcoming services
3. **Notification History**: Store and display notification history
4. **Advanced Filtering**: More granular notification preferences
5. **Analytics**: Track notification engagement and effectiveness
