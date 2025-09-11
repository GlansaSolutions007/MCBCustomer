# Firebase Realtime Database Debug Guide

## Issue: Data Not Inserting into Firebase Realtime Database

This guide helps you debug and fix Firebase Realtime Database data insertion issues in your MyCarBuddy Customer app.

## 🔍 Debugging Steps

### 1. Check Firebase Configuration

**File:** `src/config/firebaseConfig.js`

Verify your Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1e_nM-v-G5EYZSrXjElyHo61I4qb5rNc",
  authDomain: "mycarbuddycustomer.firebaseapp.com",
  databaseURL: "https://mycarbuddycustomer-default-rtdb.firebaseio.com", // ✅ Correct
  projectId: "mycarbuddycustomer",
  storageBucket: "mycarbuddycustomer.appspot.com",
  messagingSenderId: "98137449003",
  appId: "1:98137449003:web:f14e6f91c0126ef8f8806e",
};
```

### 2. Test Firebase Connection

**Use the Firebase Test Screen:**
1. Navigate to `src/screens/Common/FirebaseTestScreen.js`
2. Add this screen to your navigation
3. Run individual tests to identify the issue

**Or use the debug utility:**
```javascript
import firebaseDebug from '../utils/firebaseDebug';

// Test basic connection
const isConnected = await firebaseDebug.testConnection();

// Test specific operations
const results = await firebaseDebug.runAllTests(customerId, tokens);
```

### 3. Check Firebase Realtime Database Rules

**Current Issue:** Your Firebase project might have restrictive rules.

**Solution:** Set permissive rules for testing:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**To update rules:**
1. Go to Firebase Console
2. Select your project: `mycarbuddycustomer`
3. Go to Realtime Database → Rules
4. Update rules to allow read/write access
5. Publish changes

### 4. Common Data Insertion Points

**Customer Push Tokens:**
- **File:** `src/utils/notifications.js`
- **Path:** `customerPushTokens/{customerId}/expo|fcm/{token}`
- **Issue:** Token encoding or path structure

**Technician Locations:**
- **File:** `src/screens/Customer/WhereCustomer.js`
- **Path:** `technicians/{techId}`
- **Issue:** Location data format or permissions

**Notifications:**
- **File:** `src/utils/notificationService.js`
- **Path:** `notifications/{customerId}`
- **Issue:** Data structure or permissions

### 5. Debug Specific Operations

**Enhanced Error Logging:**
The updated `saveCustomerPushToken` function now includes:
- Connection testing before data insertion
- Detailed error logging
- Token validation
- Timestamp tracking

**Check Console Logs:**
Look for these log messages:
- `🔍 Saving customer push token:`
- `✅ Firebase connection test passed`
- `✅ Expo token saved successfully`
- `❌ Error saving push tokens to Firebase:`

### 6. Test Data Insertion

**Manual Test:**
```javascript
import { db } from '../config/firebaseConfig';
import { ref, set } from 'firebase/database';

// Test basic write
const testRef = ref(db, 'test/connection');
await set(testRef, {
  timestamp: new Date().toISOString(),
  test: true
});
```

**Automated Test:**
Use the Firebase Test Screen to run comprehensive tests.

### 7. Common Issues & Solutions

**Issue 1: Permission Denied**
- **Cause:** Restrictive Firebase rules
- **Solution:** Update rules to allow read/write access

**Issue 2: Network Connection**
- **Cause:** Poor internet connection
- **Solution:** Check connection status in Firebase Test Screen

**Issue 3: Invalid Data Structure**
- **Cause:** Incorrect data format
- **Solution:** Validate data before insertion

**Issue 4: Token Encoding Issues**
- **Cause:** Special characters in tokens
- **Solution:** Use `encodeURIComponent()` for token paths

### 8. Monitoring & Verification

**Firebase Console:**
1. Go to Firebase Console
2. Select Realtime Database
3. Check data structure:
   ```
   customerPushTokens/
     {customerId}/
       expo/
         {encodedToken}: true
       fcm/
         {encodedToken}: true
   
   technicians/
     {techId}/
       latitude: number
       longitude: number
       lastUpdated: timestamp
   ```

**App Logs:**
Monitor console for success/error messages during data operations.

### 9. Production Considerations

**Security Rules:**
Before production, implement proper security rules:
```json
{
  "rules": {
    "customerPushTokens": {
      "$customerId": {
        ".read": "auth != null && auth.uid == $customerId",
        ".write": "auth != null && auth.uid == $customerId"
      }
    },
    "technicians": {
      "$techId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $techId"
      }
    }
  }
}
```

**Error Handling:**
Implement proper error handling and fallback mechanisms for offline scenarios.

## 🚀 Quick Fix

If you need immediate resolution:

1. **Update Firebase Rules** to allow all read/write access
2. **Test with Firebase Test Screen** to verify connection
3. **Check console logs** for specific error messages
4. **Verify network connectivity** and Firebase project status

## 📞 Support

If issues persist:
1. Check Firebase Console for project status
2. Verify billing and quotas
3. Test with minimal data structures
4. Contact Firebase support if needed

---

**Last Updated:** $(date)
**Status:** Ready for testing
