/* PUSH NOTIFICATION TRIGGER DISABLED
// import axios from "axios";
// import { API_URL } from "@env";

// Push notification trigger for backend integration
export const triggerPushNotification = async (customerId, notificationData) => {
  try {
    const response = await axios.post(`${API_URL}Push/sendToCustomer`, {
      id: Number(customerId),
      title: notificationData.title,
      body: notificationData.body,
      data: {
        ...notificationData.data,
        timestamp: new Date().toISOString(),
        source: 'backend_trigger',
        priority: notificationData.priority || 'normal'
      },
    });
    
    console.log("Push notification triggered successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error triggering push notification:", error.response?.data || error.message);
    throw error;
  }
};

// Batch push notifications for multiple customers
export const triggerBatchPushNotifications = async (customerIds, notificationData) => {
  const promises = customerIds.map(customerId => 
    triggerPushNotification(customerId, notificationData)
  );
  
  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');
    
    console.log(`Batch push notifications: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  } catch (error) {
    console.error("Error in batch push notifications:", error);
    throw error;
  }
};

// Specific notification triggers for different statuses
export const triggerTechnicianAssignedNotification = async (customerId, bookingData) => {
  const notificationData = {
    title: 'Technician Assigned! 🚗',
    body: `${bookingData.techName || 'Your technician'} has been assigned to your booking ${bookingData.trackId}. They will contact you soon.`,
    data: {
      type: 'technician_assigned',
      bookingId: String(bookingData.bookingId),
      trackId: bookingData.trackId,
      techName: bookingData.techName,
      action: 'view_booking'
    },
    priority: 'high'
  };
  
  return await triggerPushNotification(customerId, notificationData);
};

export const triggerStatusChangeNotification = async (customerId, bookingData, status) => {
  const statusMessages = {
    'StartJourney': {
      title: 'Technician is on the way! 🚗',
      body: `${bookingData.techName || 'Your technician'} has started the journey to your location.`
    },
    'Reached': {
      title: 'Technician has arrived! ✅',
      body: `${bookingData.techName || 'Your technician'} has reached your location and is ready to start.`
    },
    'StartService': {
      title: 'Service Started! 🔧',
      body: `${bookingData.techName || 'Your technician'} has begun working on your vehicle.`
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

  const message = statusMessages[status];
  if (!message) return null;

  const isUrgent = ['Reached', 'StartService', 'Completed'].includes(status);
  
  const notificationData = {
    title: message.title,
    body: `${message.body} (Booking: ${bookingData.trackId})`,
    data: {
      type: status.toLowerCase(),
      bookingId: String(bookingData.bookingId),
      trackId: bookingData.trackId,
      status: status,
      techName: bookingData.techName,
      action: status === 'Completed' ? 'review_service' : 'view_booking'
    },
    priority: isUrgent ? 'high' : 'normal'
  };
  
  return await triggerPushNotification(customerId, notificationData);
};

// Webhook endpoint for backend to trigger notifications
export const handleWebhookNotification = async (webhookData) => {
  const { customerId, notificationType, bookingData, status } = webhookData;
  
  try {
    switch (notificationType) {
      case 'technician_assigned':
        return await triggerTechnicianAssignedNotification(customerId, bookingData);
      
      case 'status_change':
        return await triggerStatusChangeNotification(customerId, bookingData, status);
      
      case 'custom':
        return await triggerPushNotification(customerId, bookingData);
      
      default:
        console.warn('Unknown notification type:', notificationType);
        return null;
    }
  } catch (error) {
    console.error('Error handling webhook notification:', error);
    throw error;
  }
};

// Test function to verify push notification system
export const testPushNotification = async (customerId) => {
  const testData = {
    title: 'Test Push Notification',
    body: 'This is a test notification to verify the push notification system is working.',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
      test: true
    },
    priority: 'normal'
  };
  
  return await triggerPushNotification(customerId, testData);
};
*/

// Export empty functions to prevent errors
export const triggerPushNotification = () => Promise.resolve();
export const testPushNotification = () => Promise.resolve();
