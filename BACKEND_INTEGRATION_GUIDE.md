# Backend Integration Guide for Live Push Notifications

## Overview
This guide explains how to implement server-side push notifications that will work even when the My Car Buddy app is closed and the mobile is locked.

## Why Push Notifications Are Needed

### Current Limitation
- **Local notifications** only work when the app is open
- **Background fetch** has limitations and doesn't work reliably when app is closed
- **Mobile locked state** prevents most local notification systems

### Solution: Server-Side Push Notifications
- **Firebase Cloud Messaging (FCM)** for Android
- **Apple Push Notification Service (APNs)** for iOS
- **Expo Push Notifications** as fallback

## Required Backend Implementation

### 1. Database Schema Updates

```sql
-- Customer push tokens table
CREATE TABLE customer_push_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    fcm_token VARCHAR(500),
    expo_push_token VARCHAR(500),
    platform ENUM('android', 'ios', 'web') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Notification history table
CREATE TABLE notification_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### 2. API Endpoints Required

#### A. Register Push Token
```http
POST /api/Push/register
Content-Type: application/json

{
    "userType": "customer",
    "id": 123,
    "fcmToken": "fcm_token_here",
    "expoPushToken": "expo_token_here",
    "platform": "android"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Push token registered successfully"
}
```

#### B. Send Push Notification
```http
POST /api/Push/sendToCustomer
Content-Type: application/json

{
    "id": 123,
    "title": "Technician Assigned! 🚗",
    "body": "John has been assigned to your booking BID123. They will contact you soon.",
    "data": {
        "type": "technician_assigned",
        "bookingId": "456",
        "trackId": "BID123",
        "techName": "John",
        "priority": "high"
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Push notification sent successfully",
    "fcmResult": "success",
    "expoResult": "success"
}
```

### 3. Backend Implementation (Node.js/Express Example)

```javascript
// pushNotificationService.js
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

class PushNotificationService {
    constructor() {
        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'your-project-id'
        });
        
        this.expo = new Expo();
    }

    async registerPushToken(req, res) {
        try {
            const { userType, id, fcmToken, expoPushToken, platform } = req.body;
            
            // Store tokens in database
            await db.query(`
                INSERT INTO customer_push_tokens (customer_id, fcm_token, expo_push_token, platform)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                fcm_token = VALUES(fcm_token),
                expo_push_token = VALUES(expo_push_token),
                updated_at = CURRENT_TIMESTAMP
            `, [id, fcmToken, expoPushToken, platform]);
            
            res.json({ success: true, message: 'Push token registered successfully' });
        } catch (error) {
            console.error('Error registering push token:', error);
            res.status(500).json({ success: false, message: 'Failed to register token' });
        }
    }

    async sendToCustomer(req, res) {
        try {
            const { id, title, body, data } = req.body;
            
            // Get customer's push tokens
            const tokens = await db.query(`
                SELECT fcm_token, expo_push_token, platform 
                FROM customer_push_tokens 
                WHERE customer_id = ? AND is_active = 1
            `, [id]);
            
            const results = {
                fcmResult: 'not_sent',
                expoResult: 'not_sent'
            };
            
            // Send FCM notification
            for (const token of tokens) {
                if (token.fcm_token) {
                    try {
                        await this.sendFCMNotification(token.fcm_token, title, body, data);
                        results.fcmResult = 'success';
                    } catch (error) {
                        console.error('FCM error:', error);
                        results.fcmResult = 'failed';
                    }
                }
                
                if (token.expo_push_token) {
                    try {
                        await this.sendExpoNotification(token.expo_push_token, title, body, data);
                        results.expoResult = 'success';
                    } catch (error) {
                        console.error('Expo error:', error);
                        results.expoResult = 'failed';
                    }
                }
            }
            
            // Log notification
            await this.logNotification(id, 'service_update', title, body, data);
            
            res.json({
                success: true,
                message: 'Push notification sent successfully',
                ...results
            });
        } catch (error) {
            console.error('Error sending push notification:', error);
            res.status(500).json({ success: false, message: 'Failed to send notification' });
        }
    }

    async sendFCMNotification(token, title, body, data) {
        const message = {
            token: token,
            notification: {
                title: title,
                body: body,
                sound: 'notificationtone.wav'
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            android: {
                priority: 'high',
                notification: {
                    channel_id: 'urgent',
                    sound: 'notificationtone.wav',
                    priority: 'high'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'notificationtone.wav',
                        badge: 1
                    }
                }
            }
        };
        
        return await admin.messaging().send(message);
    }

    async sendExpoNotification(token, title, body, data) {
        const messages = [{
            to: token,
            sound: 'notificationtone.wav',
            title: title,
            body: body,
            data: data,
            priority: 'high'
        }];
        
        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets = [];
        
        for (const chunk of chunks) {
            try {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Expo chunk error:', error);
            }
        }
        
        return tickets;
    }

    async logNotification(customerId, type, title, body, data) {
        await db.query(`
            INSERT INTO notification_history (customer_id, notification_type, title, body, data)
            VALUES (?, ?, ?, ?, ?)
        `, [customerId, type, title, body, JSON.stringify(data)]);
    }
}

module.exports = new PushNotificationService();
```

### 4. Integration Points in Your Backend

#### A. When Technician is Assigned
```javascript
// In your booking assignment logic
async function assignTechnician(bookingId, technicianId) {
    // Your existing assignment logic
    await updateBookingTechnician(bookingId, technicianId);
    
    // Get booking details
    const booking = await getBookingDetails(bookingId);
    const customer = await getCustomerDetails(booking.customer_id);
    const technician = await getTechnicianDetails(technicianId);
    
    // Send push notification
    await pushNotificationService.sendToCustomer({
        id: booking.customer_id,
        title: 'Technician Assigned! 🚗',
        body: `${technician.name} has been assigned to your booking ${booking.track_id}. They will contact you soon.`,
        data: {
            type: 'technician_assigned',
            bookingId: String(booking.id),
            trackId: booking.track_id,
            techName: technician.name,
            priority: 'high'
        }
    });
}
```

#### B. When Status Changes
```javascript
// In your status update logic
async function updateBookingStatus(bookingId, newStatus) {
    const oldStatus = await getCurrentStatus(bookingId);
    
    // Your existing status update logic
    await updateBookingStatusInDB(bookingId, newStatus);
    
    // Send push notification if status changed
    if (oldStatus !== newStatus) {
        const booking = await getBookingDetails(bookingId);
        const customer = await getCustomerDetails(booking.customer_id);
        const technician = await getTechnicianDetails(booking.technician_id);
        
        const statusMessages = {
            'StartJourney': {
                title: 'Technician is on the way! 🚗',
                body: `${technician.name} has started the journey to your location.`
            },
            'Reached': {
                title: 'Technician has arrived! ✅',
                body: `${technician.name} has reached your location and is ready to start.`
            },
            'StartService': {
                title: 'Service Started! 🔧',
                body: `${technician.name} has begun working on your vehicle.`
            },
            'Completed': {
                title: 'Service Completed! 🎉',
                body: 'Your vehicle service has been completed successfully.'
            },
            'Cancelled': {
                title: 'Booking Cancelled ❌',
                body: 'Your service booking has been cancelled.'
            }
        };
        
        const message = statusMessages[newStatus];
        if (message) {
            await pushNotificationService.sendToCustomer({
                id: booking.customer_id,
                title: message.title,
                body: `${message.body} (Booking: ${booking.track_id})`,
                data: {
                    type: newStatus.toLowerCase(),
                    bookingId: String(booking.id),
                    trackId: booking.track_id,
                    status: newStatus,
                    techName: technician.name,
                    priority: ['Reached', 'StartService', 'Completed'].includes(newStatus) ? 'high' : 'normal'
                }
            });
        }
    }
}
```

### 5. Testing Push Notifications

#### A. Test Endpoint
```javascript
// Add this endpoint for testing
app.post('/api/Push/test', async (req, res) => {
    try {
        const { customerId } = req.body;
        
        await pushNotificationService.sendToCustomer({
            id: customerId,
            title: 'Test Push Notification',
            body: 'This is a test notification to verify the system is working.',
            data: {
                type: 'test',
                timestamp: new Date().toISOString(),
                test: true
            }
        });
        
        res.json({ success: true, message: 'Test notification sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
```

#### B. Test Commands
```bash
# Test push notification
curl -X POST http://your-api.com/api/Push/test \
  -H "Content-Type: application/json" \
  -d '{"customerId": 123}'

# Test specific notification
curl -X POST http://your-api.com/api/Push/sendToCustomer \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {"type": "test"}
  }'
```

## Configuration Requirements

### 1. Firebase Configuration
- Create Firebase project
- Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- Add to your app
- Configure Firebase Admin SDK in backend

### 2. Expo Configuration
- Configure Expo push notifications
- Set up Expo server SDK in backend

### 3. Environment Variables
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## Monitoring and Debugging

### 1. Notification Logs
Monitor the `notification_history` table to track:
- Success/failure rates
- Delivery times
- Customer engagement

### 2. Error Handling
```javascript
// Handle FCM errors
admin.messaging().send(message)
    .then(response => {
        console.log('Successfully sent message:', response);
    })
    .catch(error => {
        console.log('Error sending message:', error);
        // Handle invalid tokens, etc.
    });
```

### 3. Token Management
- Remove invalid tokens
- Update tokens when they change
- Handle multiple devices per customer

## Security Considerations

1. **Token Validation**: Verify tokens before storing
2. **Rate Limiting**: Prevent spam notifications
3. **Authentication**: Secure all notification endpoints
4. **Data Privacy**: Don't send sensitive data in notifications

## Performance Optimization

1. **Batch Notifications**: Send multiple notifications together
2. **Async Processing**: Use queues for notification sending
3. **Caching**: Cache customer tokens
4. **Retry Logic**: Retry failed notifications

## Next Steps

1. **Implement the backend endpoints** as shown above
2. **Test with a few customers** first
3. **Monitor delivery rates** and adjust as needed
4. **Add analytics** to track notification effectiveness
5. **Implement notification preferences** (allow customers to opt out)

This implementation will ensure that customers receive live notifications even when the app is closed and the mobile is locked! 🎉
